export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 compliant regex simplified
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

export function normalizeUsername(username: string): string {
  return (username || '').toLowerCase().trim();
}

export function validateUsername(username: string): { isValid: boolean; message?: string } {
  const normalized = normalizeUsername(username);

  if (!normalized) {
    return { isValid: false, message: 'Username is required' };
  }

  if (normalized.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters long' };
  }

  if (normalized.length > 30) {
    return { isValid: false, message: 'Username cannot exceed 30 characters' };
  }

  // Alphanumeric with underscores or hyphens, must start with letter or number
  const usernameRegex = /^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]{3}$/;
  if (!usernameRegex.test(normalized)) {
    return {
      isValid: false,
      message: 'Username can only contain letters, numbers, underscores, and hyphens',
    };
  }

  return { isValid: true };
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  return { isValid: true };
}

export function validateDisplayName(name: string): { isValid: boolean; message?: string } {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    return { isValid: false, message: 'Display name is required' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, message: 'Display name must be at least 2 characters long' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, message: 'Display name cannot exceed 50 characters' };
  }
  return { isValid: true };
}

export function validateMessageContent(content: string): { isValid: boolean; message?: string } {
  const trimmed = content?.trim() ?? '';
  if (!trimmed) {
    return { isValid: false, message: 'Message cannot be empty' };
  }
  if (content.length > 10000) {
    return { isValid: false, message: 'Message exceeds maximum limit of 10,000 characters' };
  }
  return { isValid: true };
}
