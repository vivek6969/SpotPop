export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
  cleanUsername: string;
}

/**
 * Validates a username according to Instagram's official username specification:
 * - 3 to 30 characters in length
 * - Only lowercase letters (a-z), numbers (0-9), periods (.), and underscores (_)
 * - Cannot start with a period
 * - Cannot end with a period
 * - Cannot contain consecutive periods (..)
 * - Case-insensitive (normalized to lowercase)
 * - Cannot match reserved system terms
 */
export function validateInstagramUsername(username: string): UsernameValidationResult {
  const clean = (username || '').trim().toLowerCase().replace(/^@/, '');

  if (!clean) {
    return { isValid: false, error: 'Username cannot be blank.', cleanUsername: '' };
  }

  if (clean.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.', cleanUsername: clean };
  }

  if (clean.length > 30) {
    return { isValid: false, error: 'Username must be 30 characters or fewer.', cleanUsername: clean };
  }

  if (clean.startsWith('.')) {
    return { isValid: false, error: 'Username cannot begin with a period.', cleanUsername: clean };
  }

  if (clean.endsWith('.')) {
    return { isValid: false, error: 'Username cannot end with a period.', cleanUsername: clean };
  }

  if (clean.includes('..')) {
    return { isValid: false, error: 'Username cannot contain consecutive periods.', cleanUsername: clean };
  }

  if (!/^[a-z0-9._]+$/.test(clean)) {
    return {
      isValid: false,
      error: 'Usernames can only use letters, numbers, underscores and periods.',
      cleanUsername: clean,
    };
  }

  const reserved = [
    'admin',
    'administrator',
    'api',
    'spots',
    'creators',
    'reels',
    'explore',
    'spotpop',
    'null',
    'undefined',
    'support',
    'help',
    'auth',
    'login',
    'signup',
    'register',
    'settings',
    'account',
  ];

  if (reserved.includes(clean)) {
    return {
      isValid: false,
      error: `The username '${clean}' is reserved or unavailable. Please choose another.`,
      cleanUsername: clean,
    };
  }

  return { isValid: true, cleanUsername: clean };
}
