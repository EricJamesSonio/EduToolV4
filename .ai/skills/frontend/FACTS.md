# Frontend Skill — Facts

Last verified: 2026-08-26, commit 1f5fe24

## Framework

Framework: Next.js 16.2.1 App Router (see frontend/package.json next 16.2.1, next.config.ts). Rendering: Server Components default, Client Components opt-in via "use client" (e.g. frontend/src/app/student/academic-history/page.tsx:1, components/student/StudentAcademicHistoryPanel.tsx:1).

## Data fetching pattern

Primary: TanStack React Query 5.95.2 via `hooks/useAppQuery.ts` (root guard VALID_ROOTS admin|educator|student|auth|platform, meta.preset required — QUERY_PRESETS static|user|list|detail|realtime in lib/query-client.config.ts) and `hooks/hook-factory.utils.ts` (useAsyncQuery, useListQuery, useMutationWithInvalidation, etc.). Query keys centralized in `hooks/queryKeys.factory.ts` → `hooks/queryKeys/{admin,educator,student,auth,platform}.keys.ts` (see queryKeys.factory.ts:12 re-export). API layer: `api/client.ts` (axios, baseURL API_BASE_URL, JWT Bearer via Zustand auth.store, dedupe/overfetch guards) + per-domain `api/{admin,educator,student,platform}/*.api.ts`. Ad-hoc raw keys and direct apiClient calls exist in some educator/admin components — tracked as debt (see audit in ticket handoffs).

## State management

Local: useState/useReducer. Shared: Zustand 5 (`store/auth.store.ts` — user, accessToken, isLoading). Server state: TanStack Query (query-client.ts / query-client.config.ts). Context: AuthContext, MeetingContext. No Redux.

## Component conventions

Components in frontend/src/components/{admin,educator,student,shared,ui}. Pages in frontend/src/app/{admin,educator,student,platform,enroll,login,register}. Styling via Tailwind 4 + class-variance-authority + tailwind-merge, global tokens in app/globals.css. Icons lucide-react. Forms react-hook-form + @hookform/resolvers/zod. Tables @tanstack/react-table.

## Common pitfalls specific to this project

- All query keys must go through queryKeys factory — useAppQuery throws in dev on invalid root; hook-factory defaults preset to 'list' with warning if missing (useAsyncQuery:25). Missing factory registration causes stale UI without reload.
- Mutations should use useMutationWithInvalidation with invalidateKeys pointing at factory keys — direct apiClient.patch in components bypasses cache invalidation.
