# Phase 1 — Backend: Schema Changes + Shared Gmail Validator

## Goal

Extend `RegistrationStatus`/`RegistrationRequest` for per-field revision flagging, and add one reusable Gmail-only validator used in two places (this feature + retrofitted onto the Enrollment Portal).

## Steps

1. **Investigate first.** Read the current `RegistrationRequest` model and `RegistrationStatus` enum in `prisma/schema.prisma` exactly as they stand today. Also read `backend/src/modules/auth/auth.service.ts`'s `verifyOtp()` method and `auth.repository.ts`'s `createRegistrationRequest()` — confirm whether resubmitting/editing an existing request currently means updating the same row or creating a new one. Report findings before changing anything.

2. **Schema changes**:

   ```prisma
   enum RegistrationStatus {
     pending
     approved
     rejected
     needs_revision   // add this
   }
   ```

   On `RegistrationRequest`, add (adjust names to match existing convention if they differ):

   ```prisma
   revision_notes Json?
   reviewed_by    String?
   reviewed_at    DateTime?
   ```

   Only add `reviewed_by`/`reviewed_at` if they don't already exist under different names — check first.

3. **Migration**: `add_admin_request_revision_flagging`.

4. **Shared Gmail validator**: add a custom `class-validator` decorator, e.g. `backend/src/commons/validators/is-gmail-address.validator.ts`:

   ```ts
   import { registerDecorator, ValidationOptions } from "class-validator";

   export function IsGmailAddress(validationOptions?: ValidationOptions) {
     return function (object: Object, propertyName: string) {
       registerDecorator({
         name: "isGmailAddress",
         target: object.constructor,
         propertyName,
         options: {
           message: "Only @gmail.com addresses are accepted.",
           ...validationOptions,
         },
         validator: {
           validate(value: unknown) {
             return (
               typeof value === "string" && /^[^\s@]+@gmail\.com$/i.test(value)
             );
           },
         },
       });
     };
   }
   ```

5. **Retrofit**: find wherever the Enrollment Portal's `personal_email` field is validated (its create/update application DTO) and add `@IsGmailAddress()` there, alongside whatever validation already exists (`@IsEmail()` likely stays too — this is an additional constraint, not a replacement). Also apply it to this feature's request DTO in Phase 2.

6. **Login email generation utility**: `backend/src/commons/utils/admin-login-email.util.ts`:

   ```ts
   const ADMIN_EMAIL_DOMAIN = "admin.relief-ed";

   export function generateAdminLoginEmail(personalGmail: string): string {
     const localPart = personalGmail.split("@")[0];
     return `${localPart}@${ADMIN_EMAIL_DOMAIN}`;
   }
   ```

## Acceptance check

- Migration applies clean
- Submitting `notgmail@yahoo.com` to the Enrollment Portal's application form is now rejected by validation (retrofit confirmed working)
- `generateAdminLoginEmail('ericjamessonio7@gmail.com')` returns `'ericjamessonio7@admin.relief-ed'`

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). Upgrading the existing admin
registration-request flow (Otp, RegistrationRequest, platform-registration
module already exist and already work — this phase extends them, does not
replace them).

Step 1 — investigate: read the current RegistrationRequest model and
RegistrationStatus enum in backend/prisma/schema.prisma. Also read
backend/src/modules/auth/auth.service.ts's verifyOtp() and
backend/src/modules/auth/auth.repository.ts's createRegistrationRequest() —
report whether editing/resubmitting an existing request currently updates the
same row or creates a new one. Report all findings before changing anything.

Step 2: Add 'needs_revision' to the RegistrationStatus enum. Add to
RegistrationRequest: revision_notes Json? (shape: { [fieldName]: string }),
and reviewed_by String? / reviewed_at DateTime? only if equivalent fields
don't already exist under different names (check first).

Step 3: Generate migration add_admin_request_revision_flagging.

Step 4: Add backend/src/commons/validators/is-gmail-address.validator.ts —
a class-validator custom decorator @IsGmailAddress() that only accepts
addresses ending exactly in @gmail.com (case-insensitive), matching the code
in this phase doc.

Step 5: Find the Enrollment Portal's application create/update DTO (where
personal_email is currently validated) and add @IsGmailAddress() to that
field, alongside its existing validation (do not remove @IsEmail() if
present — this is additive).

Step 6: Add backend/src/commons/utils/admin-login-email.util.ts with
generateAdminLoginEmail(personalGmail: string): string, extracting the Gmail
local part and appending '@admin.relief-ed' (a named constant, not inlined
elsewhere).

Show me your Step 1 findings, then diffs for everything else.
```
