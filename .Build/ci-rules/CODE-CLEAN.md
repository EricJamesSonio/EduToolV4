# TypeScript and ESLint Codebase Rules

These rules apply to **all code you create, modify, refactor, or review** in this repository.

The goal is that newly written code should not introduce new errors when the project runs:

```bash
npx tsc --noEmit
```

and:

```bash
npm run lint
```

Treat both commands as mandatory quality gates.

---

## 1. General Rule

Before considering a coding task complete, ensure that the implementation is compatible with the repository's existing:

* TypeScript configuration
* ESLint configuration
* Prettier configuration where applicable
* Framework conventions
* Existing type definitions
* Existing project architecture

Do not intentionally introduce code that would create a new TypeScript error or ESLint error.

Do not solve lint errors by blindly disabling ESLint rules.

Prefer fixing the underlying code.

---

# 2. TypeScript Rules

All TypeScript code must be written so that:

```bash
npx tsc --noEmit
```

passes without new errors.

## Required practices

### Use correct types

Do not use incorrect, incomplete, or fabricated types merely to make TypeScript accept the code.

Prefer:

```ts
const user: User = ...
```

over:

```ts
const user: any = ...
```

Use existing project types whenever they already exist.

---

### Avoid unnecessary `any`

The repository currently allows explicit `any` from ESLint:

```text
@typescript-eslint/no-explicit-any: off
```

However, this does NOT mean `any` should be used by default.

Prefer:

1. Existing interfaces/types
2. DTO types
3. Library-provided types
4. `unknown` with proper narrowing
5. Generic types
6. `any` only when there is a legitimate reason

Do not introduce `any` simply because typing something is inconvenient.

---

### Handle `unknown` safely

When dealing with errors, external data, API responses, parsed JSON, or other unknown values, narrow the value before accessing properties.

Prefer:

```ts
if (error instanceof Error) {
  console.error(error.message);
}
```

or an appropriate project-specific type guard.

Do not assume an unknown value has a property without establishing its type.

---

### Respect nullability

Do not use unsafe non-null assertions merely to silence TypeScript.

Avoid:

```ts
const user = users.find(... )!;
```

unless the value is genuinely guaranteed to exist.

Prefer explicit handling:

```ts
const user = users.find(...);

if (!user) {
  throw new Error("User not found");
}
```

Do not use unsafe optional-chain non-null assertions.

The repository intentionally keeps:

```text
@typescript-eslint/no-non-null-asserted-optional-chain: error
```

---

# 3. ESLint Rules

Code must comply with the repository's ESLint configuration.

Do not assume every ESLint rule is strict.

The current project intentionally allows:

```text
@typescript-eslint/no-explicit-any: off
@typescript-eslint/no-unused-vars: off
```

on the frontend.

The backend currently treats unused variables as warnings:

```text
@typescript-eslint/no-unused-vars: warn
```

with variables beginning with `_` allowed to be unused.

Do not create unused variables unnecessarily even when the rule is relaxed.

---

# 4. Prefer `const`

The repository intentionally enforces:

```text
prefer-const: error
```

If a variable is never reassigned, use `const`.

Correct:

```ts
const app = await NestFactory.create(AppModule);
const db = app.get(DatabaseService);
```

Incorrect:

```ts
let app = await NestFactory.create(AppModule);
let db = app.get(DatabaseService);
```

Only use `let` when the variable is actually reassigned.

Do not use `let` merely out of habit.

---

# 5. No Empty Statements or Meaningless Expressions

The repository intentionally enforces:

```text
no-empty: error
@typescript-eslint/no-unused-expressions: error
```

Do not create empty blocks unless they are explicitly valid and handled according to the project's conventions.

Avoid meaningless expressions such as:

```ts
someValue;
```

or:

```ts
condition && doSomething;
```

when the expression has no intended purpose.

Use explicit control flow when appropriate:

```ts
if (condition) {
  doSomething();
}
```

---

# 6. React Rules

For frontend React code:

* Follow the Rules of Hooks.
* Never call hooks conditionally.
* Never call hooks inside loops.
* Never call hooks inside nested functions.
* Keep hooks at the top level of React components/custom hooks.

The project intentionally keeps:

```text
react-hooks/rules-of-hooks: error
```

The project intentionally disables:

```text
react-hooks/exhaustive-deps
```

Do not add dependencies to a React effect merely to satisfy a lint rule.

Instead, determine whether the dependency is actually required by the application's intended behavior.

---

# 7. React Prop Types

Do not add PropTypes solely to satisfy ESLint.

The project intentionally disables:

```text
react/prop-types: off
```

Use TypeScript interfaces/types for React component props.

Example:

```ts
interface UserCardProps {
  user: User;
  onSelect: (user: User) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  // ...
}
```

---

# 8. Frontend Environment

The frontend uses:

* Next.js 16
* React 19
* TypeScript
* ESLint 9
* typescript-eslint
* React ESLint plugins

Write code compatible with the versions actually installed in `package.json`.

Do not introduce APIs that belong to a different major version unless the project already supports them.

---

# 9. Backend Environment

The backend uses:

* NestJS 10
* TypeScript
* Prisma 5
* ESLint
* typescript-eslint
* Prettier

Follow existing NestJS architecture.

Prefer the repository's existing:

* DTOs
* services
* repositories
* guards
* decorators
* Prisma types
* interfaces
* exception patterns

Do not introduce a new architectural pattern when an existing project pattern already handles the problem.

---

# 10. Error Handling

Do not write unsafe error handling such as assuming every caught value is an `Error`.

Avoid blindly doing:

```ts
catch (error) {
  console.log(error.message);
}
```

unless the type is known.

Prefer safe handling appropriate to the project:

```ts
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

For Axios, NestJS, Prisma, or other library-specific errors, use the appropriate existing/library type when available.

---

# 11. API and External Data

Treat API responses, request data, database results, parsed JSON, and external input as potentially unsafe.

Do not invent properties on objects.

Do not write:

```ts
const response = await api.get(...);

response.data.someProperty.someOtherProperty;
```

unless the response is correctly typed.

Prefer using the project's existing response interfaces/types.

When no type exists, define an appropriate type instead of defaulting to `any`.

---

# 12. Database and Prisma

Use Prisma-generated types whenever possible.

Do not manually recreate Prisma model types when an existing Prisma type can be used.

When selecting partial fields, ensure the resulting TypeScript type matches the actual Prisma query.

Do not access fields that are not included in the query.

Do not cast Prisma results to unrelated types simply to silence TypeScript.

---

# 13. Variables and Imports

Do not leave unnecessary imports.

Do not create variables that are never used.

If a value is genuinely intentionally unused and the backend ESLint configuration allows underscore-prefixed variables, use the repository convention:

```ts
const _unusedValue = value;
```

However, do not create unnecessary variables just to satisfy linting.

Prefer removing unused code entirely.

---

# 14. Do Not Disable Rules to Hide Problems

Never solve a code-quality problem by adding:

```ts
// eslint-disable
```

or:

```ts
// eslint-disable-next-line
```

unless there is a legitimate, documented reason.

If an ESLint rule is genuinely incompatible with the intended implementation, first determine whether:

1. The code can be written differently.
2. An existing project pattern solves the issue.
3. The rule is intentionally disabled globally.
4. A narrowly scoped exception is genuinely necessary.

Do not modify the ESLint configuration just to make newly generated code pass.

Do not weaken project-wide rules to hide errors introduced by your implementation.

---

# 15. Do Not Modify ESLint or TypeScript Configuration as a Shortcut

Do not change:

* `eslint.config.*`
* `tsconfig.json`
* `package.json`
* ESLint rules
* TypeScript compiler settings

just because your implementation produces errors.

Only modify configuration when the task explicitly requires a configuration change or when there is a demonstrated repository-wide configuration problem.

A code implementation should adapt to the existing project configuration whenever reasonably possible.

---

# 16. Before Finishing a Task

After implementing a change, mentally check the code against:

### TypeScript

```bash
npx tsc --noEmit
```

Check for:

* Incorrect types
* Missing properties
* Incorrect function arguments
* Incorrect return types
* Null/undefined issues
* Invalid imports
* Invalid Prisma types
* Invalid React types
* Invalid API response assumptions

### ESLint

```bash
npm run lint
```

Check for:

* `prefer-const`
* `no-empty`
* `@typescript-eslint/no-unused-expressions`
* `@typescript-eslint/no-non-null-asserted-optional-chain`
* React Hooks violations
* Unnecessary imports
* Unused variables
* Other enabled ESLint rules

---

# 17. Important: Do Not Fix Unrelated Existing Errors

When working on a task, distinguish between:

1. Errors introduced by your changes.
2. Errors that already existed before your changes.

Do not perform large unrelated refactors merely to clean the entire repository.

Your responsibility is to ensure your changes do not introduce new TypeScript or ESLint errors.

If you discover an existing error that blocks validation, report it separately rather than silently changing unrelated code.

---

# 18. Validation Priority

Use this priority:

```text
1. Correct runtime behavior
2. TypeScript correctness
3. ESLint correctness
4. Existing project architecture
5. Formatting/style
```

Never sacrifice runtime correctness simply to make ESLint happy.

Never use unsafe TypeScript casts merely to make `tsc` pass.

Never disable a lint rule merely to make `npm run lint` pass.

---

# 19. Definition of Done

A coding task is considered complete only when:

* The requested behavior is implemented.
* The implementation follows existing project architecture.
* No unnecessary `any` was introduced.
* No unnecessary `let` was introduced where `const` is appropriate.
* No unused code was introduced.
* No unsafe optional-chain non-null assertion was introduced.
* No meaningless expressions were introduced.
* No empty blocks were introduced unnecessarily.
* React Hooks rules are respected.
* Existing TypeScript types are reused where appropriate.
* ESLint configuration was not weakened to hide implementation problems.
* The implementation should pass:

```bash
npx tsc --noEmit
```

and:

```bash
npm run lint
```

without introducing new errors.

If either command would fail because of code written during the current task, fix the code before declaring the task complete.

---

# 20. Core Principle

**Write code that is correct by construction, not code that is written first and patched afterward until linting passes.**

Treat TypeScript and ESLint rules as part of the project's development contract.

Do not fight the configuration.

Write the implementation so that it naturally satisfies the existing configuration.
