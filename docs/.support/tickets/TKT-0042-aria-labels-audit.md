---
id: TKT-0042
title: ARIA labels and accessibility audit pass on the frontend
status: verified
priority: P3
area: frontend
created: 2026-05-18T22:53:00Z
updated: 2026-05-18T22:53:00Z
created_by: ticketing_agent
related_plan_item: -
filed_via: user_direct_request
---

## Summary
The frontend already has some ARIA wiring (`PairCodePanel` has `aria-label`, `Toaster` has `aria-live="polite"` + per-card `role="alert"`/`status`, the connect-mode tab-group has `role=tablist`/`tab`/`aria-selected`). But many other interactive elements rely only on visible text. A single focused pass to add the missing labels.

## Expected
Walk the frontend tree and add aria attributes where missing:

- **TopNav** (`components/TopNav.tsx`):
  - `<nav aria-label="Main navigation">` on the nav element.
  - Logout button has `aria-label="Sign out"` (or just keeps the visible text "Logout" -- text content acts as the label).

- **/connect ReadyPanel** (`app/connect/page.tsx`):
  - "Test connection" button -- already has visible text; add `aria-describedby` pointing at the result panel when present, so screen readers announce the outcome.
  - Disconnect button is fine.

- **/groups page**:
  - Group rows / contact rows -- add `aria-label="Group: {name}"` if the visual treatment is just an avatar bubble.
  - Delete buttons get `aria-label="Delete contact {name}"`.

- **/send page**:
  - The schedule date-time input gets a proper `<label htmlFor>` or `aria-label`.

- **/history JobRow**:
  - Cancel button gets `aria-label="Cancel job {id}"`.

- **Globally**: every `<button type="submit">` is fine; every `<button>` without visible icon-only text needs an `aria-label`.

## Acceptance
- Manual audit with axe-core dev tools (or installed `@axe-core/react`) reports zero "missing accessible name" violations on `/`, `/login`, `/register`, `/dashboard`, `/connect`, `/groups`, `/send`, `/history`.
- `npx tsc --noEmit` exit 0.
- No visual regression.

## Stretch
- Add `@axe-core/react` as a dev dep so violations surface in the dev console during normal development.

## Resolution history
- 2026-05-18T22:53:00Z -- filed by Resolving Agent (iter95) at operator request.
