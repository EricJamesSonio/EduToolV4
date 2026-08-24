# Authentication Skill — Facts

<!--
Project-specific facts only. Permanent server-side-check rules live in
shared/skills/authentication/MUST-HAVES.md — read that first.
shared/agents/onboarder.md is the only agent that writes to this file.
Verify against the actual guard/strategy files in code — don't infer the
mechanism from a folder name.
-->

Last verified: <!-- fill in --> UNKNOWN — needs onboarder run

## Mechanism

Auth method: <!-- e.g. JWT in HTTP-only cookies / session-based / OAuth -->
Token lifetime & refresh strategy: <!-- fill in, or UNKNOWN — needs human input if not visible in code -->

## Roles

- [role_1]: <!-- what they can do -->
- [role_2]: <!-- what they can do -->
- [role_3]: <!-- what they can do -->

## Project-specific flows

- Password reset / email verification / privilege-escalation flows: <!-- token expiry, single-use, rate limiting, etc. -->
- Session/token invalidation on logout, password change, role change: <!-- describe expected behavior -->

## Common pitfalls specific to this project

<!-- e.g. anything this codebase does non-obviously around auth. -->
