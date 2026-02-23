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

      const domain = getEmailDomain(email);
      const isWhitelisted = await isDomainWhitelisted(domain);
      if (!isWhitelisted) {
        throw new Error(`Email domain @${domain} is not whitelisted for signup`);
      }

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const passwordHash = await hashPassword(password);
      const result = await createUser(email, passwordHash, name);
      const userId = (result as any).insertId || result[0];

      const verificationToken = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await createEmailVerificationToken(userId, verificationToken, expiresAt);

      return {
        success: true,
        message: 'Signup successful. Please check your email to verify your account.',
        userId,
        verificationToken,
      };
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const { token } = input;

      const tokenRecord = await findEmailVerificationToken(token);
      if (!tokenRecord) {
        throw new Error('Verification token not found or expired');
      }

      if (new Date() > tokenRecord.expiresAt) {
        await deleteEmailVerificationToken(token);
        throw new Error('Verification token has expired');
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

      const user = await findUserByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.emailVerified) {
        throw new Error('Please verify your email before logging in');
      }

      if (!user.passwordHash) {
        throw new Error('Invalid email or password');
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      const sessionToken = await createSessionToken(user.id);
      const maxAge = 30 * 24 * 60 * 60;
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      ctx.res.setHeader('Set-Cookie', `session=${sessionToken}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict${secure}`);

      return {
        success: true,
        message: 'Login successful',
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
});
