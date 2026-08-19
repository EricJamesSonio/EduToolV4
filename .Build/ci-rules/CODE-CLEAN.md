# TypeScript & ESLint Rules

Applies to all code created/modified/reviewed in this repo. Goal: never introduce new errors in `npx tsc --noEmit` or `npm run lint` — both are mandatory gates.

## Core Principle

Write code correct by construction — don't patch it after linting fails. Adapt to existing config; don't fight it.

## TypeScript

- Use real types (existing interfaces/DTOs/library types) — no fabricated or incorrect types.
- `any` is allowed by ESLint (`no-explicit-any: off`) but not a default. Priority: existing types → DTOs → library types → `unknown` + narrowing → generics → `any` (only with real justification).
- Narrow `unknown` before use (e.g. `if (error instanceof Error)`), especially for errors, API responses, parsed JSON.
- No unsafe non-null assertions (`user!`) unless existence is guaranteed — prefer explicit checks. `no-non-null-asserted-optional-chain: error` is enforced.

## ESLint

- Frontend: `no-explicit-any` and `no-unused-vars` are off — but still avoid unused code by discipline, not rule.
- Backend: `no-unused-vars: warn`; `_`-prefixed names allowed for genuinely unused vars.
- `prefer-const: error` — use `let` only when reassigned.
- `no-empty` and `no-unused-expressions` are errors — no empty blocks, no dangling expressions like `condition && doSomething`; use real `if` statements.

## React (frontend)

- Follow Rules of Hooks (no conditional/looped/nested hook calls) — `rules-of-hooks: error`.
- `exhaustive-deps` is disabled — don't add effect deps just to satisfy lint; add them only if actually needed.
- `prop-types: off` — use TS interfaces/types for props instead.

## Stack

- Frontend: Next.js 16, React 19, TS, ESLint 9 — don't use APIs from other major versions unless already in use.
- Backend: NestJS 10, TS, Prisma 5 — follow existing DTO/service/repo/guard/decorator patterns; don't introduce new architecture when an existing pattern fits.

## Error Handling

- Never assume `catch (error)` is an `Error` — type as `unknown`, narrow with `instanceof`. Use library-specific error types (Axios/NestJS/Prisma) where available.

## API/External Data

- Treat API responses, DB results, parsed JSON as unsafe — don't invent properties. Use/define proper types instead of `any`.

## Prisma

- Use generated types; don't hand-roll model types. Match selected-fields types to actual queries. No casting results to unrelated types.

## Imports/Variables

- No unused imports or variables. Underscore-prefix only for genuinely unused (backend convention) — don't create unnecessary variables just to satisfy lint.

## Rule/Config Changes — Don't

- No `eslint-disable` comments without a legitimate, documented reason — fix the underlying code first.
- Don't edit `eslint.config.*`, `tsconfig.json`, `package.json`, or compiler settings to make your code pass.

## Scope Discipline

- Only fix errors your changes introduce. Don't refactor unrelated code. Report pre-existing blocking errors separately instead of silently fixing them.

## Validation Priority

1. Runtime correctness
2. TypeScript correctness
3. ESLint correctness
4. Existing architecture
5. Formatting/style

Never sacrifice #1 for lint/type-check compliance; never use unsafe casts or disable rules just to pass.

## Definition of Done

Behavior implemented, follows existing architecture, no unnecessary `any`/`let`/unused code/empty blocks/meaningless expressions, no unsafe non-null assertions, Hooks rules respected, existing types reused, config untouched — and `tsc --noEmit` + `npm run lint` pass clean for the code you wrote.
