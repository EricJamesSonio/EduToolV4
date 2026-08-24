# Build Mode Rules

Enter Build Mode for a phase **only after** Eric has explicitly approved the Plan Mode summary for that phase (see `01-rules-planmode.md`, rule 5). Never skip straight to Build Mode.

## 0. Gates you must run and pass before declaring a phase done

This repo has these commands available — all are mandatory, not optional:

```
npx tsc --noEmit
npm run lint
npm run test        # and npm run test:e2e where the phase touches e2e-tested modules
```

Paste real output. Never assert "tests pass" or "lint is clean" without showing the actual command output. If a gate fails, fix it — don't report success anyway.

## 1. Core principle

Write code correct by construction — don't patch it after linting fails. Adapt to existing config; don't fight it. Never edit `eslint.config.*`, `tsconfig.json`, `package.json`, or compiler settings to make your code pass.

## 2. TypeScript

- Use real types (existing interfaces/DTOs/library types, Prisma-generated types) — no fabricated or incorrect types.
- `any` is allowed by ESLint config but is not a default choice. Priority order: existing types → DTOs → library types → `unknown` + narrowing → generics → `any` (only with real justification stated in a comment).
- Narrow `unknown` before use (`if (error instanceof Error)`), especially for caught errors, API responses, parsed JSON.
- No unsafe non-null assertions (`user!`) unless existence is truly guaranteed — prefer explicit checks. `no-non-null-asserted-optional-chain` is enforced as an error.

## 3. ESLint

- Frontend: `no-explicit-any` and `no-unused-vars` are off in config — but still avoid unused code by discipline, not because the rule allows it.
- Backend: `no-unused-vars` is `warn`; `_`-prefixed names are the convention for genuinely unused vars (e.g. destructured but intentionally unused).
- `prefer-const` is an error — use `let` only when a variable is actually reassigned.
- `no-empty` and `no-unused-expressions` are errors — no empty blocks, no dangling expressions like `condition && doSomething()`; use a real `if` statement.
- No `eslint-disable` comments without a legitimate, documented reason in the same comment — fix the underlying code first. If you genuinely believe a disable is warranted, state why and let Eric confirm before committing it.

## 4. React (frontend phases only — mainly Phase 7)

- Follow Rules of Hooks — no conditional/looped/nested hook calls (`rules-of-hooks` is an error).
- `exhaustive-deps` is disabled in this repo's config — don't add effect dependencies just to satisfy a lint rule that isn't even active; add them only when the effect actually needs them.
- `prop-types` is off — use TS interfaces/types for props.

## 5. Stack constraints

- Frontend: Next.js 16, React 19, TypeScript, ESLint 9 — don't reach for APIs from other major versions of these.
- Backend: NestJS 10, TypeScript, Prisma 5 — follow the existing DTO → service → repository → controller layering and existing guard/decorator patterns (`@Roles`, `AuditLogService.logAdminAction` fire-and-forget with `.catch(() => {})`, `assertReady` gating). Don't introduce a new architectural pattern when an existing one already fits — this repo has a consistent shape across ~40 modules, match it.

## 6. Error handling

- Never assume `catch (error)` is an `Error` instance — type as `unknown`, narrow with `instanceof`. Use library-specific error types where available (Prisma errors, NestJS HTTP exceptions, Axios errors on the frontend).

## 7. API / external / DB data

- Treat API responses, DB query results, and parsed JSON as unsafe until typed — don't invent properties that "should" be there. Use or define proper types.
- Prisma: use generated types, don't hand-roll model interfaces. Match `select`/`include` shapes to what you actually query — don't cast results to a wider type than what was selected.

## 8. Imports and variables

- No unused imports or variables. Underscore-prefix only for genuinely unused (backend convention) — don't manufacture a variable just to satisfy a rule.

## 9. Scope discipline

- Only fix errors your own changes introduce. Don't refactor unrelated code while you're in a file. If you find a pre-existing lint/type error unrelated to this phase, report it separately — don't silently fix it as a drive-by (that hides scope creep and makes the diff harder to review).

## 10. Validation priority (in order — never sacrifice a higher one for a lower one)

1. Runtime correctness — the feature actually works, per `overview.md` and the phase's spec.
2. TypeScript correctness — `tsc --noEmit` clean.
3. ESLint correctness — `npm run lint` clean.
4. Existing architecture — matches the patterns already in the repo.
5. Formatting/style.

Never use an unsafe cast or disable a rule just to make a gate pass — fix the actual code.

## 11. Definition of done for any phase

- Behavior implemented per the approved Plan Mode summary.
- Follows existing architecture (repository/service/controller, DTO validation, audit logging pattern).
- No unnecessary `any`, no stray `let` where `const` works, no unused code, no empty blocks, no meaningless expressions, no unsafe non-null assertions.
- React Hooks rules respected (frontend phases).
- Existing types/DTOs reused wherever they already exist.
- Config files untouched.
- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run test` (and `test:e2e` where relevant) passing, with real output pasted.
- Report back to Eric with: what was built, the actual gate output, and anything deferred or still open.

## 12. Retry discipline

Hard limit: 3 attempts per failing check within a phase. On the 3rd failure, stop — report the real error output and your analysis, don't keep guessing. Don't edit a test to match broken code; if a test is failing because the implementation is wrong, fix the implementation. If you believe the test itself is wrong, say so explicitly and ask before changing it.
