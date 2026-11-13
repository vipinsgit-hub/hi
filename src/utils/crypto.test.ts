import { describe, it, expect } from 'vitest';
import { sha256, generateInvitationToken } from './crypto';

describe('Crypto utilities', () => {
  it('generates a 48-character hex invitation token', () => {
    const token = generateInvitationToken();
    expect(token).toHaveLength(48);
    expect(/^[a-f0-9]{48}$/.test(token)).toBe(true);
  });

  it('produces deterministic SHA-256 hashes', async () => {
    const token = 'test-token-12345';
    const hash1 = await sha256(token);
    const hash2 = await sha256(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // 256 bits = 32 bytes = 64 hex chars
  });
});

