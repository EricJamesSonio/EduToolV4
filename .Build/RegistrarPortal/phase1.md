# Phase 1 — Backend: Expose `is_registrar` Through Auth

## Goal
Make `is_registrar` visible to the frontend so it can scope navigation and UI. This is read-only exposure — no permission enforcement in this phase.

## What to check/change

1. **`prisma/schema.prisma`** — confirm `Account.is_registrar Boolean @default(false)` exists (it may already, since the `registrar` module and admin-side registrar-management UI already exist). If missing, add it and generate a migration. Do not rename or repurpose any existing field.

2. **`backend/src/modules/auth/auth.service.ts` → `getMe()`**
   Currently returns:
   ```ts
   {
     id, orgId, role, email, status,
     fullName, metadata, createdAt,
     personalEmail, profileImage,
   }
   ```
   Add `isRegistrar: account.is_registrar ?? false` to this object.

3. **`backend/src/modules/auth/auth.repository.ts` → `findAccountById()`**
   Confirm the underlying Prisma query already selects `is_registrar` (it will by default unless the query uses an explicit `select`). If it uses `select`, add `is_registrar: true`.

4. **Do NOT bake `is_registrar` into the JWT payload** (`TokenPayload` / `generateTokens()`). Keep it a live DB lookup via `getMe()`, not a token claim — this avoids a stale flag persisting across a token's lifetime if an admin later revokes registrar status.

## Acceptance check
- Log in as a registrar test account → call `GET /auth/me` → response includes `isRegistrar: true`.
- Log in as a regular admin → `isRegistrar: false` (or field absent, but prefer explicit `false`).

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). Registrar accounts are Account records
with role='admin' and a new/existing boolean field `is_registrar`.

Task:
1. Open backend/prisma/schema.prisma and confirm the Account model has:
   is_registrar Boolean @default(false)
   If it's missing, add it and run a Prisma migration named "add_is_registrar_to_account".
   Do not touch any other fields.

2. Open backend/src/modules/auth/auth.service.ts. In the getMe() method, add
   `isRegistrar: account.is_registrar ?? false` to the returned object, following
   the exact same style as the other returned fields (personalEmail, profileImage, etc).

3. Open backend/src/modules/auth/auth.repository.ts. In findAccountById(), confirm
   the query does not use an explicit `select` that would exclude is_registrar. If it
   does, add is_registrar: true to the select.

4. Do NOT add is_registrar to the JWT TokenPayload interface or to generateTokens() —
   this must remain a live DB field, not a token claim.

5. Show me the diffs before applying anything.
```