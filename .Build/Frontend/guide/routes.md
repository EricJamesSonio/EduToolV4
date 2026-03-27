================================================================================
  G. ROUTING & REDIRECT SUMMARY
================================================================================

  /                         → /login
  /login                    → (after login, role-based redirect)
  /platform                 → /platform/admins
  /admin                    → /admin/dashboard
  /educator                 → /educator/classes
  /student                  → /student/classes

  Role guard (useRole hook):
    On any route load: checks AuthContext role
    If role mismatch: redirect to correct portal root
    If not logged in: redirect to /login

