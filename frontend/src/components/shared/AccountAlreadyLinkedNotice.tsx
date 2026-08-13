"use client";

// Shared notice for the "this email already belongs to an account" blocking
// response that BOTH the admin-request and enrollment-portal flows get back
// from their OTP-verify calls — one component so both render it identically
// (deliberately generic: it never reveals the existing account's role).
export function AccountAlreadyLinkedNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}