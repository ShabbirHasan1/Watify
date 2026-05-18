---
id: TKT-0040
title: Playwright e2e tests for login -> dashboard -> groups happy path
status: verified
priority: P2
area: frontend
created: 2026-05-18T22:53:00Z
updated: 2026-05-18T22:53:00Z
created_by: ticketing_agent
related_plan_item: -
filed_via: user_direct_request
---

## Summary
No end-to-end test coverage. Add Playwright; write a happy-path that exercises auth + groups + send.

## Expected
- `frontend/package.json` adds devDep `@playwright/test`. Adds script `"e2e": "playwright test"`.
- `frontend/playwright.config.ts` -- targets `http://localhost:3000` (assumes the dev server is already running, or uses `webServer` to spin one up; pick whichever fits CI).
- `frontend/e2e/auth.spec.ts`:
  - Goto `/`; expect hero CTAs visible.
  - Goto `/login`; fill `rajandran` / `Rajandran1028@`; submit; expect redirect to `/dashboard`.
  - Expect TopNav now shows `Dashboard / Connect / Groups / Send / History` + username + Logout.
  - Click Logout; expect redirect to `/`.
- `frontend/e2e/groups.spec.ts`:
  - Login (helper); goto `/groups`; create a group "playwright-smoke"; bulk-add two Indian-name contacts; expect the count badge to show 2.
- `frontend/.gitignore` adds `playwright-report/` and `test-results/`.
- Document in README that `npm run e2e` is the canonical command.

## Acceptance
- `npm run e2e` exits 0 with the dev servers running.
- Tests do NOT mutate the production app.db -- gate behind a `WATIFY_E2E_MODE` env that points to a temp DB, OR delete the e2e groups in an `afterAll` teardown.

## Out of scope
- WhatsApp send testing (would require a live phone or a mock at the wars boundary -- separate ticket if needed).

## Resolution history
- 2026-05-18T22:53:00Z -- filed by Resolving Agent (iter95) at operator request.
