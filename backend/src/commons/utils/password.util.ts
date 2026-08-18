import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically random password.
 * Uses URL-safe base64 so it contains only letters, digits, - and _.
 * Default length: 12 characters.
 */
export function generatePassword(length = 12): string {
  // randomBytes gives us binary; base64url gives ~1.33 chars per byte
  // so we need ceil(length * 0.75) bytes to get at least `length` chars
  const bytes = randomBytes(Math.ceil(length * 0.75));
  return bytes.toString('base64url').slice(0, length);
}
