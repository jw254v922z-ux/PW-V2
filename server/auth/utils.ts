import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random token for email verification or password reset
 */
export function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Create a JWT session token
 * Note: This is used for custom email/password auth
 * The token payload must match what verifySession expects
 */
export async function createSessionToken(userId: number, openId?: string, name?: string): Promise<string> {
  // For now, use userId as openId for custom auth
  // In production, you'd want to use the actual openId from the user
  const payload = {
    openId: openId || `local-user-${userId}`,
    appId: process.env.VITE_APP_ID || 'local-app',
    name: name || `User ${userId}`,
  };
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret);
  return token;
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(token: string): Promise<{ userId: number } | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return { userId: verified.payload.userId as number };
  } catch (error) {
    return null;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Minimum 8 characters, at least one uppercase, one lowercase, one number, one special character
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  return true;
}

/**
 * Extract domain from email
 */
export function getEmailDomain(email: string): string {
  return email.split('@')[1].toLowerCase();
}
