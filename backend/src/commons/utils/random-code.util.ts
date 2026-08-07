// src/commons/utils/random-code.util.ts
//
// Parameterized random-code generator (letters + digits by default, reused by
// the enrollment portal for scoped-unique application codes).

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate a random code of the given length using a provided charset.
 * Meant for friendly lookup tokens (application codes), NOT cryptographic
 * secrets — see note in the enrollment overview.
 */
export function generateRandomCode(
  length: number,
  charset: string = DEFAULT_CHARSET,
): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);

  let out = '';
  for (let i = 0; i < length; i++) {
    out += charset[bytes[i] % charset.length];
  }
  return out;
}