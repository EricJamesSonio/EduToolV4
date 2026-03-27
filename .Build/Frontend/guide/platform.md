
================================================================================
  B. PLATFORM OWNER PORTAL
================================================================================

URL PREFIX: /platform
LAYOUT: Topbar + Sidebar + Content area

  SIDEBAR LINKS
    - Admins  →  /platform/admins  (only link — this is the full scope)

  PAGE: /platform  (index)
    Auto-redirects to /platform/admins

--------------------------------------------------------------------------------
  B1. /platform/admins  — Admin List Page
--------------------------------------------------------------------------------

  TOPBAR: standard (bell + user menu)
  SIDEBAR: "Admins" active

  PAGEHEADER
    - Title: "Admin Accounts"
    - Action button: "+ Create Admin"
      → Click: opens CreateAdminDialog modal

  MAIN CONTENT
    SearchInput
      - Placeholder: "Search by name or email..."
      - On type: filters the table in real time (client-side or debounced API)

    AdminTable  (DataTable wrapper)
      Columns: Full Name | Email | Status | Created Date | Actions
      Status column: uses StatusBadge (Active = green, Blocked = red)
      Actions column per row:
        - "View"      → navigates to /platform/admins/[id]
        - "Reset Password"
          → Click: shows ConfirmDialog
            "Reset password for [Name]? A new password will be generated."
            Confirm → calls API → shows success toast "Password reset. New credentials ready."
        - "Block" (if Active)  / "Unblock" (if Blocked)
          → Click: shows ConfirmDialog
            Block: "Block [Name]? They will no longer be able to log in."
            Unblock: "Unblock [Name]? They will regain login access."
            Confirm → calls API → table row status badge updates

    Pagination
      - Shows "Showing X–Y of Z admins"
      - Prev / Next / page number buttons

  MODAL: CreateAdminDialog
    - Full Name input (required)
    - Email input (required)
    - "Create Account" button
      → On submit: calls POST /platform/admins
      → On success: closes modal, shows AdminCredentialsCard modal overlay
    - Cancel button → closes modal

  MODAL: AdminCredentialsCard  (shown after creation)
    - "Account created successfully"
    - Shows: Full Name, Email, Generated Password (visible plain text)
    - "Copy Credentials" button → copies to clipboard as formatted text
    - "Download CSV" button → downloads single-row CSV
    - "Done" button → closes modal, table refreshes

--------------------------------------------------------------------------------
  B2. /platform/admins/[id]  — Single Admin Detail Page
--------------------------------------------------------------------------------

  PAGEHEADER
    - Breadcrumb: Admins > [Admin Name]
    - Title: [Admin Full Name]
    - Action buttons:
        "Reset Password" button
          → Same ConfirmDialog + credentials display flow as table action
        "Block" or "Unblock" button (depends on status)
          → Same ConfirmDialog flow as table action

  MAIN CONTENT  (AdminCredentialsCard style layout)
    Info card:
      - Full Name
      - Email
      - Educator ID (system-generated)
      - Status badge
      - Created Date
      - Last Login (if available)

    Current Password section:
      - "Show Password" button  → reveals plain-text password inline
      - "Copy" icon next to revealed password