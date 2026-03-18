# EduTool — Platform Owner Management
## Pseudo Code Reference

---

## AUTHENTICATION

```
function platformOwnerLogin(email, password):
  admin = DB.platform_owners.findOne({ email })
  if not admin:
    throw NOT_FOUND("Account does not exist")
  if not bcrypt.verify(password, admin.password_hash):
    throw UNAUTHORIZED("Invalid credentials")

  session = createSession({
    role: "platform_owner",
    id:   admin.id
  })
  return session
```

---

## VIEW ALL ADMIN ACCOUNTS

```
function getAllAdminAccounts():
  requireRole("platform_owner")

  admins = DB.platform_admins
    .findAll()
    .orderBy("created_at", DESC)

  // Platform owner sees everything — no org_id filter here
  // because platform_admins sits above the org layer
  return admins.map(admin => ({
    id:           admin.id,
    full_name:    admin.full_name,
    email:        admin.email,
    plain_password: admin.plain_password,   // visible to platform owner only
    is_blocked:   admin.is_blocked,
    created_at:   admin.created_at
  }))
```

---

## CREATE ADMIN ACCOUNT

```
function createAdminAccount(payload):
  requireRole("platform_owner")

  // Validate input
  if not payload.full_name or not payload.email:
    throw VALIDATION_ERROR("full_name and email are required")
  if not isValidEmail(payload.email):
    throw VALIDATION_ERROR("Invalid email format")

  // Check global email uniqueness for admin accounts
  existing = DB.platform_admins.findOne({ email: payload.email })
  if existing:
    throw CONFLICT("An admin account with this email already exists")

  plain_password = generatePassword(length: 10)

  newAdmin = DB.platform_admins.insert({
    id:             generateUUID(),
    full_name:      payload.full_name,
    email:          payload.email,
    password_hash:  bcrypt.hash(plain_password),
    plain_password: plain_password,   // stored for distribution
    is_blocked:     false,
    created_at:     NOW()
  })

  // No org is created here — Admin creates their own org on first login
  return {
    admin:          newAdmin,
    plain_password: plain_password
  }
```

---

## VIEW SINGLE ADMIN CREDENTIALS

```
function getAdminCredentials(adminId):
  requireRole("platform_owner")

  admin = DB.platform_admins.findOne({ id: adminId })
  if not admin:
    throw NOT_FOUND("Admin account not found")

  return {
    full_name:      admin.full_name,
    email:          admin.email,
    plain_password: admin.plain_password
  }
  // Note: plain_password endpoint is restricted to platform_owner role only
  // at the router/middleware level — never exposed to any other role
```

---

## COPY ADMIN CREDENTIALS (for distribution)

```
function copyAdminCredentials(adminId):
  requireRole("platform_owner")

  credentials = getAdminCredentials(adminId)

  // Returns a formatted string for clipboard / manual distribution
  return formatCredentialString({
    name:     credentials.full_name,
    email:    credentials.email,
    password: credentials.plain_password
  })
  // e.g. "Name: Juan Dela Cruz | Email: juan@school.edu | Password: Xk9mP2nQwR"
```

---

## RESET ADMIN PASSWORD

```
function resetAdminPassword(adminId):
  requireRole("platform_owner")

  admin = DB.platform_admins.findOne({ id: adminId })
  if not admin:
    throw NOT_FOUND("Admin account not found")

  new_plain = generatePassword(length: 10)

  DB.platform_admins.update(adminId, {
    password_hash:  bcrypt.hash(new_plain),
    plain_password: new_plain,
    updated_at:     NOW()
  })

  return {
    message:        "Password reset successfully",
    plain_password: new_plain   // shown once to platform owner for distribution
  }
```

---

## BLOCK ADMIN ACCOUNT

```
function blockAdminAccount(adminId):
  requireRole("platform_owner")

  admin = DB.platform_admins.findOne({ id: adminId })
  if not admin:
    throw NOT_FOUND("Admin account not found")
  if admin.is_blocked:
    throw CONFLICT("Account is already blocked")

  DB.platform_admins.update(adminId, {
    is_blocked: true,
    updated_at: NOW()
  })

  // Invalidate all active sessions for this admin
  DB.sessions.deleteAll({ user_id: adminId, role: "admin" })

  // The org itself is NOT touched — only login is disabled
  return { message: "Admin account blocked. Org data is preserved." }
```

---

## UNBLOCK ADMIN ACCOUNT

```
function unblockAdminAccount(adminId):
  requireRole("platform_owner")

  admin = DB.platform_admins.findOne({ id: adminId })
  if not admin:
    throw NOT_FOUND("Admin account not found")
  if not admin.is_blocked:
    throw CONFLICT("Account is not currently blocked")

  DB.platform_admins.update(adminId, {
    is_blocked: false,
    updated_at: NOW()
  })

  return { message: "Admin account unblocked. Admin can log in again." }
```

---

## MIDDLEWARE — ENFORCE PLATFORM OWNER ROLE

```
middleware requirePlatformOwner(request):
  session = getSession(request)

  if not session:
    throw UNAUTHORIZED("Not authenticated")
  if session.role != "platform_owner":
    throw FORBIDDEN("This action requires Platform Owner access")

  // Platform owner has no org_id — no org context is set
  // Any attempt to query org-scoped tables from this session
  // will fail at the DB level (RLS: app.current_org_id is null)
  return next()
```

---

## WHAT PLATFORM OWNER CANNOT DO

```
// These actions are all FORBIDDEN for platform_owner role
// Enforced at middleware level — returns 403 before any DB query runs

FORBIDDEN_FOR_PLATFORM_OWNER = [
  "viewOrganization",
  "viewStudents",
  "viewEducators",
  "viewClasses",
  "viewGrades",
  "viewAssessments",
  "viewAuditLog",
  "viewSemesterSettings",
  "viewRubrics",
  "viewCalendarEvents",
  "modifyAnyOrgData"
]

function checkPlatformOwnerAction(action):
  if action in FORBIDDEN_FOR_PLATFORM_OWNER:
    throw FORBIDDEN("Platform Owner scope ends at Admin accounts only")
```