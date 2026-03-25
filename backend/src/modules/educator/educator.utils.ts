// @/modules/educator/educator.utils.ts

/**
 * Generates a system educator ID.
 * Format: EDU-XXXXXXXX (8 random alphanumeric chars)
 * e.g. EDU-A3F9K2LM
 */
export function generateEducatorId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
  return `EDU-${random}`;
}

/**
 * Generates a system password — 10 alphanumeric characters.
 * Returned in plain text once to Admin for distribution.
 * Never stored plain — always hashed before persistence.
 */
export function generateSystemPassword(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 10 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
}