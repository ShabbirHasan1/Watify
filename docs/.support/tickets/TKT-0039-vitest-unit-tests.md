---
id: TKT-0039
title: Vitest unit tests for frontend helpers and stores
status: open
priority: P2
area: frontend
created: 2026-05-18T22:53:00Z
updated: 2026-05-18T22:53:00Z
created_by: ticketing_agent
related_plan_item: -
filed_via: user_direct_request
---

## Summary
No frontend test framework is installed. Add Vitest as the unit-test runner (works with Next.js 16 + Turbopack; uses jsdom for component tests).

## Expected
- `frontend/package.json` adds devDeps: `vitest`, `@vitest/ui` (optional), `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`. Adds script `"test": "vitest run"` and `"test:watch": "vitest"`.
- `frontend/vitest.config.ts` with `environment: "jsdom"`, `setupFiles: ["./vitest.setup.ts"]`.
- `frontend/vitest.setup.ts` imports `@testing-library/jest-dom`.
- Starter suites:
  - `src/app/login/__tests__/safeNextPath.test.ts` -- the 9-case unit test that iter75 ran in node, formalized as a Vitest table-driven test.
  - `src/components/__tests__/Toaster.test.ts` -- `toast.success` adds to store; `dismiss(id)` removes; `getServerSnapshot` returns stable reference.
  - `src/hooks/__tests__/useAuth.test.ts` -- 401 ApiError -> resolves null; success -> user object.
- `npm run test` exits 0.
- Document in README (or AGENTS.md) that `npm run test` is the canonical command.

## Acceptance
- `npm run test` exits 0.
- `npx tsc --noEmit` exit 0 (test files are typed).

## Resolution history
- 2026-05-18T22:53:00Z -- filed by Resolving Agent (iter95) at operator request.
