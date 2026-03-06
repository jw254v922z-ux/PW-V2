import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import type { TrpcContext } from '../_core/context';
import {
  findUserByEmail,
  createUser,
  markEmailAsVerified,
  updateUserPassword,
  createEmailVerificationToken,
  findEmailVerificationToken,
  deleteEmailVerificationToken,
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
  isDomainWhitelisted,
} from './db';
import { COOKIE_NAME } from '../../shared/const';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  createSessionToken,
  isValidEmail,
  isValidPassword,
  getEmailDomain,
} from './utils';

export const customAuthRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
        confirmPassword: z.string(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { email, password, confirmPassword, name } = input;

      if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      if (!isValidPassword(password)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const domain = getEmailDomain(email);
      const isWhitelisted = await isDomainWhitelisted(domain);
      if (!isWhitelisted) {
        throw new Error(`Email domain @${domain} is not allowed to sign up`);
      }

      const passwordHash = await hashPassword(password);
      const result = await createUser(email, passwordHash, name || undefined);
      const userId = (result as any).insertId || (result as any)[0]?.id || 1;

      // Mark email as verified immediately (skip email verification for now)
      await markEmailAsVerified(userId);

      return {
        success: true,
        message: 'Account created successfully. You can now log in.',
      };
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const { token } = input;

      const tokenRecord = await findEmailVerificationToken(token);
      if (!tokenRecord) {
        throw new Error('Email verification token not found or expired');
      }

      if (new Date() > tokenRecord.expiresAt) {
        await deleteEmailVerificationToken(token);
        throw new Error('Email verification token has expired');
      }

      await markEmailAsVerified(tokenRecord.userId);
      await deleteEmailVerificationToken(token);

      return {
        success: true,
        message: 'Email verified successfully. You can now log in.',
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: TrpcContext }) => {
      const { email, password } = input;
      console.log('[Login] Attempting login for email:', email);

      const user = await findUserByEmail(email);
      console.log('[Login] User found:', !!user, user ? { id: user.id, email: user.email, hasPasswordHash: !!user.passwordHash } : null);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Email verification skipped for now
      // if (!user.emailVerified) {
      //   throw new Error('Please verify your email before logging in');
      // }

      if (!user.passwordHash) {
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      console.log('[Login] Password valid:', isPasswordValid);
      if (!isPasswordValid) {
        console.log('[Login] Password mismatch for user:', user.email);
        throw new Error('Invalid email or password');
      }

      const sessionToken = await createSessionToken(user.id, user.openId || `local-user-${user.id}`, user.name || user.email || `User ${user.id}`);
      const maxAge = 30 * 24 * 60 * 60;
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      console.log('[Login] Setting session cookie:', COOKIE_NAME);
      ctx.res.setHeader('Set-Cookie', `${COOKIE_NAME}=${sessionToken}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`);
      console.log('[Login] Session cookie set successfully');

      return {
        success: true,
        message: 'Login successful',
        sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { email } = input;

      const user = await findUserByEmail(email);
      if (!user) {
        return {
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        };
      }

      const resetToken = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await createPasswordResetToken(user.id, resetToken, expiresAt);

      return {
        success: true,
        message: 'Password reset link has been sent to your email.',
        resetToken,
      };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string(),
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { token, password, confirmPassword } = input;

      if (!isValidPassword(password)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const tokenRecord = await findPasswordResetToken(token);
      if (!tokenRecord) {
        throw new Error('Password reset token not found or expired');
      }

      if (new Date() > tokenRecord.expiresAt) {
        await deletePasswordResetToken(token);
        throw new Error('Password reset token has expired');
      }

      const passwordHash = await hashPassword(password);
      await updateUserPassword(tokenRecord.userId, passwordHash);
      await deletePasswordResetToken(token);

      return {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      };
    }),

  changePassword: publicProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: TrpcContext }) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      const user = await findUserByEmail(ctx.user?.email || '');
      if (!ctx.user?.email) {
        throw new Error('User email not found');
      }
      if (!user || !user.passwordHash) {
        throw new Error('User not found');
      }

      const isPasswordValid = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      if (!isValidPassword(input.newPassword)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      }

      const newPasswordHash = await hashPassword(input.newPassword);
      await updateUserPassword(user.id, newPasswordHash);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    }),

  changeEmail: publicProcedure
    .input(z.object({ newEmail: z.string().email() }))
    .mutation(async ({ input, ctx }: { input: any; ctx: TrpcContext }) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      if (!isValidEmail(input.newEmail)) {
        throw new Error('Invalid email format');
      }

      const existingUser = await findUserByEmail(input.newEmail);
      if (existingUser) {
        throw new Error('Email already in use');
      }

      return {
        success: true as const,
        message: 'Email change feature coming soon',
      };
    }),

  deleteAccount: publicProcedure
    .mutation(async ({ ctx }: { ctx: TrpcContext }) => {
      if (!ctx.user) {
        throw new Error('Not authenticated');
      }

      return {
        success: true,
        message: 'Account deletion feature coming soon',
      };
    }),
});
