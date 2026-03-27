================================================================================
B. PLATFORM OWNER PORTAL
================================================================================

URL PREFIX: /platform
LAYOUT: Topbar + Sidebar + Content area

SIDEBAR LINKS
  - Admins  →  /platform/admins  (only link — full scope)

LOGIN & REDIRECT
  - Use general login page.
  - Backend checks role:
      platform_owner → /platform
      admin           → /org/[org_id]/dashboard
      educator        → /org/[org_id]/classes
      student         → /org/[org_id]/student/home
  - No secret keys needed.

PAGE: /platform  (index)
  - Auto-redirects to /platform/admins

--------------------------------------------------------------------------------
B1. /platform/admins  — Admin List Page
--------------------------------------------------------------------------------

TOPBAR: standard (bell + user menu)
SIDEBAR: "Admins" active

PAGE HEADER
  - Title: "Admin Accounts"
  - Action button: "+ Create Admin"
    → Click: opens CreateAdminDialog modal

MAIN CONTENT
  - SearchInput
    - Placeholder: "Search by name or email..."
    - Filters table in real time (client-side or debounced API)

  - AdminTable  (DataTable wrapper)
    Columns: Full Name | Email | Status | Created Date | Actions
    Status column: uses StatusBadge (Active = green, Blocked = red)
    Actions column per row:
      - "View"      → navigates to /platform/admins/[id]
      - "Reset Password"
        → ConfirmDialog
        "Reset password for [Name]? A new password will be generated."
        Confirm → API call → show toast
        AdminCredentialsCard modal displays new credentials
      - "Block" (if Active) / "Unblock" (if Blocked)
        → ConfirmDialog
        "Block [Name]? They will no longer be able to log in."
        "Unblock [Name]? They will regain login access."
        Confirm → API call → status badge updates

  - Pagination
    - Shows "Showing X–Y of Z admins"
    - Prev / Next / page number buttons

MODALS
  1. CreateAdminDialog
     - Full Name input (required)
     - Email input (required)
     - "Create Account" button → POST /platform/admins
     - On success → closes modal, shows AdminCredentialsCard
     - Cancel → closes modal
  2. AdminCredentialsCard (post-creation)
     - "Account created successfully"
     - Shows: Full Name, Email, Generated Password (plain text)
     - Buttons:
       - Copy Credentials → clipboard
       - Download CSV → single-row CSV
       - Done → closes modal, refresh table

--------------------------------------------------------------------------------
B2. /platform/admins/[id]  — Single Admin Detail Page
--------------------------------------------------------------------------------

PAGE HEADER
  - Breadcrumb: Admins > [Admin Name]
  - Title: [Admin Full Name]
  - Action buttons:
      - Reset Password → ConfirmDialog + AdminCredentialsCard
      - Block / Unblock → ConfirmDialog

MAIN CONTENT
  - Info Card (AdminCredentialsCard style):
      - Full Name
      - Email
      - Educator ID (system-generated)
      - Status badge
      - Created Date
      - Last Login (if available)
  - Current Password section:
      - "Show Password" button → reveals plain-text password inline
      - "Copy" icon next to revealed password

--------------------------------------------------------------------------------
BACKEND / API ENDPOINTS (platform_owner only)
--------------------------------------------------------------------------------
  - GET    /platform/admins             → list all admins
  - POST   /platform/admins             → create admin
  - GET    /platform/admins/:id         → fetch admin detail
  - POST   /platform/admins/:id/reset-password → reset password
  - POST   /platform/admins/:id/block           → block account
  - POST   /platform/admins/:id/unblock         → unblock account
  - Middleware to check account.role === "platform_owner" for access