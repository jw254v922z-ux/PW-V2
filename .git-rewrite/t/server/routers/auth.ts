import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import type { TrpcContext } from '../_core/context';
import {
  findUserByEmail,
  findUserById,
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
} from '../auth/db';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  createSessionToken,
  isValidEmail,
  isValidPassword,
  getEmailDomain,
} from '../auth/utils';

export const authRouter = router({
  /**
   * Sign up a new user with email and password
   */
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

      // Validate email format
      if (!isValidEmail(email)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid email format',
        });
      }

      // Validate password strength
      if (!isValidPassword(password)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        });
      }

      // Validate passwords match
      if (password !== confirmPassword) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Passwords do not match',
        });
      }

      // Check domain whitelist
      const domain = getEmailDomain(email);
      const isWhitelisted = await isDomainWhitelisted(domain);
      if (!isWhitelisted) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Email domain @${domain} is not whitelisted for signup`,
        });
      }

      // Check if user already exists
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already registered',
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const result = await createUser(email, passwordHash, name);
      const userId = (result as any).insertId || result[0];

      // Generate verification token
      const verificationToken = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await createEmailVerificationToken(userId, verificationToken, expiresAt);

      return {
        success: true,
        message: 'Signup successful. Please check your email to verify your account.',
        userId,
        verificationToken, // In production, send via email instead
      };
    }),

  /**
   * Verify email with token
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const { token } = input;

      // Find token
      const tokenRecord = await findEmailVerificationToken(token);
      if (!tokenRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Verification token not found or expired',
        });
      }

      // Check if expired
      if (new Date() > tokenRecord.expiresAt) {
        await deleteEmailVerificationToken(token);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Verification token has expired',
        });
      }

      // Mark email as verified
      await markEmailAsVerified(tokenRecord.userId);
      await deleteEmailVerificationToken(token);

      return {
        success: true,
        message: 'Email verified successfully. You can now log in.',
      };
    }),

  /**
   * Log in with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: TrpcContext }) => {
      const { email, password } = input;

      // Find user
      const user = await findUserByEmail(email);
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Please verify your email before logging in',
        });
      }

      // Check password
      if (!user.passwordHash) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Create session token
      const sessionToken = await createSessionToken(user.id);

      // Set session cookie
      ctx.res.setHeader('Set-Cookie', `session=${sessionToken}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

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

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { email } = input;

      // Find user (don't reveal if email exists)
      const user = await findUserByEmail(email);
      if (!user) {
        return {
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        };
      }

      // Generate reset token
      const resetToken = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await createPasswordResetToken(user.id, resetToken, expiresAt);

      return {
        success: true,
        message: 'Password reset link has been sent to your email.',
        resetToken, // In production, send via email instead
      };
    }),

  /**
   * Reset password with token
   */
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

      // Validate password strength
      if (!isValidPassword(password)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        });
      }

      // Validate passwords match
      if (password !== confirmPassword) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Passwords do not match',
        });
      }

      // Find token
      const tokenRecord = await findPasswordResetToken(token);
      if (!tokenRecord) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Password reset token not found or expired',
        });
      }

      // Check if expired
      if (new Date() > tokenRecord.expiresAt) {
        await deletePasswordResetToken(token);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password reset token has expired',
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(password);

      // Update password
      await updateUserPassword(tokenRecord.userId, passwordHash);
      await deletePasswordResetToken(token);

      return {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      };
    }),

  /**
   * Get current user (protected)
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
    };
  }),
});
