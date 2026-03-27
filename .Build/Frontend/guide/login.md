================================================================================
  GLOBAL LAYOUT RULES
================================================================================

All portals (Platform, Admin, Educator, Student) share the same shell pattern:

  SHELL STRUCTURE
  ┌──────────────────────────────────────────────────────┐
  │  TOPBAR (full width, fixed top)                      │
  ├─────────────────┬────────────────────────────────────┤
  │                 │                                    │
  │  SIDEBAR        │   PAGE CONTENT AREA                │
  │  (fixed left,   │   (scrollable, padded)             │
  │   collapsible)  │                                    │
  │                 │                                    │
  └─────────────────┴────────────────────────────────────┘

  TOPBAR CONTENTS (all roles)
    - EduTool logo / app name (left)
    - Notification bell icon with unread count badge (right)
      → Click: opens NotificationDropdown panel (slide from right or dropdown)
      → Panel shows list of notifications, newest first
      → Each notification is a row with icon, message text, timestamp
      → No read/unread toggle — just a list
    - User avatar / name (right)
      → Click: opens dropdown menu
      → Menu items: "My Profile" (view only), "Logout"
      → Logout: clears token, redirects to /login

  SIDEBAR (role-specific nav links, see each role section below)
    - Collapse button at bottom or top of sidebar (toggles to icon-only mode)
    - Active link highlighted
    - Logo visible at top of sidebar

  PAGE CONTENT AREA
    - PageHeader at top: title, breadcrumb, action buttons slot
    - Main content below PageHeader

  RESPONSIVE NOTES
    - Sidebar collapses to icon-only on narrow screens
    - Tables use horizontal scroll on mobile
    - Dialogs are centered modals with overlay


================================================================================
  A. AUTH — /login
================================================================================

LAYOUT: Centered card, no sidebar, no topbar

PAGE: /login
  Component: LoginForm

  CONTENT
    - EduTool logo at top
    - "Welcome back" heading
    - Email input field
    - Password input field (with show/hide toggle)
    - "Log in" button
      → On click: calls POST /auth/login
      → On success: reads role from JWT payload
        - role = platform_owner → redirect to /platform
        - role = admin          → redirect to /admin
        - role = educator       → redirect to /educator
        - role = student        → redirect to /student
      → On error: shows inline error message below form
        "Invalid email or password."
    - No "Forgot password" link (passwords are managed by Admin only)
    - No "Sign up" link (no self-registration)
