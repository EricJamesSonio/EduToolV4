# Phase 4 — Backend: Notification Emails

## Goal

Three email templates matching the three review outcomes from Phase 3, all sent to the request's Gmail (never to the generated login email, which isn't a real inbox).

## Steps

1. **Investigate first.** Re-read `MailService.sendCredentialsEmail()` and its `credentialsTemplate()` in full — it already does almost exactly what "approved" needs. Confirm whether it can be reused as-is (called with the generated login email + password) or needs a small adjustment.

2. **Wire Phase 3's approval** to call `sendCredentialsEmail(personalGmail, generatedPassword)` — but check the existing method signature; it currently emails the credentials showing `email` as the _login_ email in the template body (since originally login email == recipient email). Now those are different values — the template needs to display the **generated login email** clearly, while being _sent to_ the personal Gmail. Adjust the method signature/template if needed so both values are shown correctly (recipient ≠ the email shown in the credentials box).

3. **Add `sendRejectionEmail(to: string, reason?: string)`** — new method on `MailService`, matching the visual style of the existing templates (same gradient-header/table structure). Copy: acknowledges the application, states it wasn't approved, includes the reason if provided, invites reapplication if appropriate.

4. **Add `sendRevisionNeededEmail(to: string, fieldNotes: Record<string, string>)`** — new method. Copy: explains specific items need updating before the request can be approved, lists each flagged field with its note, directs them to log back in via the request form (Gmail + OTP) to fix and resubmit.

5. **Wire Phase 3's reject/request-revision endpoints** to call these new methods, sending to `RegistrationRequest`'s email field (the applicant's Gmail — confirm the exact field name from Phase 1's schema investigation).

## Acceptance check

- Approval email shows the generated `@admin.relief-ed` login email and the password, sent to the Gmail address
- Rejection and revision-needed emails visually match the existing template style (not a jarringly different look)
- Revision-needed email lists every flagged field with its specific note, not just a generic "please fix your application"

---

## AI Prompt

```
Context: EduTool backend (NestJS). Phase 3's review actions (approve/reject/
request-revision) exist and need email wiring.

Step 1 — investigate: read MailService.sendCredentialsEmail() and its
credentialsTemplate() in backend/src/modules/mail/mail.service.ts in full.
Report whether it can be reused as-is for this feature or needs adjustment —
specifically, the template currently assumes the emailed "Email" field and the
"to" recipient are the same value; in this feature they're now different
(recipient = personal Gmail, displayed login email = the generated
@admin.relief-ed address). Report your assessment before changing anything.

Step 2: Adjust sendCredentialsEmail (or its template) if needed so it clearly
displays the generated login email in the credentials box while being sent to
the personal Gmail recipient. Wire this into Phase 3's approval flow.

Step 3: Add sendRejectionEmail(to: string, reason?: string) to MailService,
matching the exact visual template style (gradient header, table structure)
already used by sendOtpEmail/sendCredentialsEmail. Wire into Phase 3's reject
endpoint.

Step 4: Add sendRevisionNeededEmail(to: string, fieldNotes: Record<string, string>)
to MailService, same visual style, listing each flagged field with its note in
the email body. Wire into Phase 3's request-revision endpoint.

Show me your Step 1 assessment first, then diffs.
```
