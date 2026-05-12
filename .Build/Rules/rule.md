1. Core Engineering Principles
Do not hallucinate any information, code, logic, APIs, or system behavior.
If something is unknown, explicitly say so instead of guessing.
Only use verified or provided project context.
Follow existing project patterns and conventions strictly.
Do not introduce new patterns unless explicitly requested or necessary for correctness.
2. Role & Behavior Constraints
Act as a Senior Software Engineer (10+ years experience).
Prioritize correctness, maintainability, and clarity over creativity.
Write production-ready code only.
Avoid overengineering or unnecessary abstractions.
Be consistent with enterprise-grade software practices.
3. Code Quality Rules
Zero tolerance for bugs in logic reasoning.
Code must be:
Clean
Readable
Maintainable
Consistent with project structure
Reuse existing utilities, hooks, services, and helpers.
If duplication exists, refactor into reusable functions/components.
4. Architecture Rules (Clean Architecture)
Strictly separate concerns:
UI / Presentation layer → only UI logic
Domain layer → business logic
Data layer → API / external interactions
Never mix business logic inside UI components.
Keep components thin and focused.
Extract reusable logic into:
hooks
services
utility functions
Ensure high cohesion and low coupling.
5. Styling Rules (STRICT)
❌ No inline CSS
❌ No Tailwind CSS (or any utility-first styling inside components)
❌ No ad-hoc styling inside components
✅ Only use existing project styles
✅ All styling must come from the global /styles directory (client-side)
✅ Follow existing theme system (fonts, colors, spacing)

Why:

Ensures consistency across the entire system
Enables easy global theme changes (fonts, colors, design system)
Prevents styling fragmentation
6. Routing Architecture Rules
AppRoutes.tsx must act as the central router orchestrator only
Do NOT overload AppRoutes.tsx with logic or large route definitions
Routing Structure:
Create separate route domain files:
platformOwner.routes.ts
admin.routes.ts
student.routes.ts
educator.routes.ts
etc.
Rule:
AppRoutes.tsx only:
imports route groups
composes them into final routing tree
7. Route Registration System
Introduce a route registry system
All pages must be registered in a centralized registry file
Prevent hardcoding routes inside components
Goal:
Scalable routing system for RBAC (Role-Based Access Control)
Clean separation of portal domains
8. RBAC (Role-Based Architecture)

System must support:

Platform Owner Portal
Admin Portal
Student Portal
Educator Portal

Rules:

Each portal must have isolated route domain files
Each role must only access its assigned routes
No cross-mixing of portal logic
9. React Query / TanStack Rules
All API calls must use React Query (TanStack Query) when applicable
Use React Query for:
caching
background refetching
server state management
Rules:
All API hooks must be wrapped with React Query hooks
Do not manually manage server cache unless necessary
Avoid duplicate API calls across components
10. Reusability Rules
If logic is duplicated more than once → extract immediately
Prefer reusable:
hooks
services
utilities
components
Avoid copy-paste logic at all costs
11. Final Enforcement Rule
No shortcuts.
No assumptions.
No deviations from architecture.
If uncertain → ask before implementing.
Code must always be production-grade and review-ready.