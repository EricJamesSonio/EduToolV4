================================================================================
  1. SYSTEM OVERVIEW
================================================================================

EduTool is a multi-tenant platform for schools. The top-level container is an
Organization. All data lives within an org and is never visible outside it.
No public registration exists — the platform owner provisions Admin accounts,
and Admins create all other accounts.

  Role            Managed By          Core Scope
  ----------      ------------------  ------------------------------------------
  Platform Owner  EduTool team        Creates and manages Admin accounts only.
                                      No access to any org's internal data.

  Admin           Platform owner      Creates and manages one org. Manages the
                                      full academic structure within that org.
                                      Creates and manages all educator and
                                      student accounts, including subject
                                      assignments. One org per Admin account.

  Educators       Admin               Manage lessons, assessments, grades,
                                      attendance, and meetings — only within
                                      assigned classes.

  Students        Admin               Take assessments, attend meetings, view
                                      published scores, view locked final grades,
                                      access full transcript history.