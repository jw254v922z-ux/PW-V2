import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { hashPassword, verifyPassword, generateToken, isValidEmail, isValidPassword, getEmailDomain } from './utils';

describe('Authentication Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash a password and verify it correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword123!', hash);
      expect(isValid).toBe(false);
    });

    it('should hash the same password differently each time', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('Token Generation', () => {
    it('should generate a token', () => {
      const token = generateToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@company.co.uk')).toBe(true);
      expect(isValidEmail('admin+tag@domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      expect(isValidPassword('ValidPass123!')).toBe(true);
      expect(isValidPassword('AnotherGood1@')).toBe(true);
      expect(isValidPassword('SecurePassword99#')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isValidPassword('short')).toBe(false); // Too short
      expect(isValidPassword('nouppercase123!')).toBe(false); // No uppercase
      expect(isValidPassword('NOLOWERCASE123!')).toBe(false); // No lowercase
      expect(isValidPassword('NoNumbers!')).toBe(false); // No numbers
      expect(isValidPassword('NoSpecial123')).toBe(false); // No special character
    });
  });

  describe('Email Domain Extraction', () => {
    it('should extract domain from email', () => {
      expect(getEmailDomain('user@example.com')).toBe('example.com');
      expect(getEmailDomain('admin@company.co.uk')).toBe('company.co.uk');
      expect(getEmailDomain('test+tag@domain.com')).toBe('domain.com');
    });
  });
});
