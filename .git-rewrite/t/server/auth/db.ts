import { getDb } from '../db';
import {
  users,
  emailVerificationTokens,
  passwordResetTokens,
  domainWhitelist,
} from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  return result[0] || null;
}

/**
 * Find user by ID
 */
export async function findUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

/**
 * Create a new user
 */
export async function createUser(email: string, passwordHash: string, name?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
    loginMethod: 'custom',
    emailVerified: 0,
  });
  return result;
}

/**
 * Update user email verification status
 */
export async function markEmailAsVerified(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(users).set({ emailVerified: 1 }).where(eq(users.id, userId));
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

/**
 * Create email verification token
 */
export async function createEmailVerificationToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(emailVerificationTokens).values({
    userId,
    token,
    expiresAt,
  });
}

/**
 * Find email verification token
 */
export async function findEmailVerificationToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token));
  return result[0] || null;
}

/**
 * Delete email verification token
 */
export async function deleteEmailVerificationToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.token, token));
}

/**
 * Create password reset token
 */
export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt,
  });
}

/**
 * Find password reset token
 */
export async function findPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token));
  return result[0] || null;
}

/**
 * Delete password reset token
 */
export async function deletePasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
}

/**
 * Check if domain is whitelisted
 */
export async function isDomainWhitelisted(domain: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(domainWhitelist)
    .where(eq(domainWhitelist.domain, domain.toLowerCase()));
  return result.length > 0;
}

/**
 * Get all whitelisted domains
 */
export async function getAllWhitelistedDomains() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(domainWhitelist);
}

/**
 * Add domain to whitelist
 */
export async function addDomainToWhitelist(domain: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(domainWhitelist).values({
    domain: domain.toLowerCase(),
  });
}

/**
 * Remove domain from whitelist
 */
export async function removeDomainFromWhitelist(domain: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(domainWhitelist).where(eq(domainWhitelist.domain, domain.toLowerCase()));
}
