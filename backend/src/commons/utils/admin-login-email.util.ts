// src/commons/utils/admin-login-email.util.ts
//
// Generates the system login email for an admin request from the applicant's
// personal Gmail. The login email is decoupled from the personal Gmail —
// it is a system-generated address on the admin domain.

const ADMIN_EMAIL_DOMAIN = 'admin.relief-ed';

export function generateAdminLoginEmail(personalGmail: string): string {
  const localPart = personalGmail.split('@')[0];
  return `${localPart}@${ADMIN_EMAIL_DOMAIN}`;
}