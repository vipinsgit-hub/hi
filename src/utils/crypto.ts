/**
 * Computes a SHA-256 hexadecimal hash of a string using Web Crypto API.
 * Used for securely storing and comparing invitation token hashes.
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a secure cryptographically random token string for room invitations.
 * Default 24 bytes yields a 48-character hex token string.
 */
export function generateInvitationToken(byteLength = 24): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export const generateSecureToken = generateInvitationToken;
