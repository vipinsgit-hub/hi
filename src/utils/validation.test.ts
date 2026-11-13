import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  validatePassword,
  validateDisplayName,
  validateMessageContent,
  validateUsername,
  normalizeUsername,
} from './validation';

describe('Validation utilities', () => {
  it('validates email addresses', () => {
    expect(isValidEmail('alex@hi.chat')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('validates usernames', () => {
    expect(validateUsername('alex').isValid).toBe(true);
    expect(validateUsername('jordan_v').isValid).toBe(true);
    expect(validateUsername('user-123').isValid).toBe(true);
    expect(validateUsername('ab').isValid).toBe(false); // too short
    expect(validateUsername('a'.repeat(31)).isValid).toBe(false); // too long
    expect(validateUsername('alex!@#').isValid).toBe(false); // invalid characters
    expect(validateUsername('_invalid').isValid).toBe(false); // leading underscore
  });

  it('normalizes usernames consistently', () => {
    expect(normalizeUsername('  AlexRivera  ')).toBe('alexrivera');
    expect(normalizeUsername('JORDAN_01')).toBe('jordan_01');
  });

  it('validates password requirements', () => {
    expect(validatePassword('short').isValid).toBe(false);
    expect(validatePassword('12345678').isValid).toBe(true);
    expect(validatePassword('').isValid).toBe(false);
  });

  it('validates display names', () => {
    expect(validateDisplayName('A').isValid).toBe(false);
    expect(validateDisplayName('Alex Rivera').isValid).toBe(true);
    expect(validateDisplayName('').isValid).toBe(false);
  });

  it('validates message content', () => {
    expect(validateMessageContent('').isValid).toBe(false);
    expect(validateMessageContent('   ').isValid).toBe(false);
    expect(validateMessageContent('Hello there').isValid).toBe(true);
  });
});
