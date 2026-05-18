---
id: TKT-0002
title: UX polish - empty states, error toasts, soft-cap reminder
status: verified
priority: P1
area: frontend
created: 2026-05-18T16:14:48Z
updated: 2026-05-18T16:24:52Z
created_by: ticketing_agent
related_plan_item: F-07
---

## Summary
Implement the F-07 polish items deferred from the scaffold pass:

1. **Empty states** are inline-only right now. They should use a consistent illustration-free pattern (icon-free per CLAUDE.md) across `/groups` (no groups), `/groups detail` (no contacts), `/history` (no jobs), `/send` (no groups).
2. **Error toasts** — `BulkAddModal`, `/connect`, `/groups`, `/send` all surface errors inline today. A global `Toaster` would unify transient feedback (especially around send-failure and disconnect).
3. **Soft-cap reminder banner**: if `Sent (24h) > 100` on the Dashboard, render a banner with the WhatsApp anti-spam risk note from wars.md and a link to "Why" (a small `<details>` would do).

## Reproduction
Visit each page on a fresh DB. Empty states are functional but read like raw stubs.

## Expected
Polished, consistent empty / error / cap-reminder treatment.

## Actual
Inline ad-hoc messages.

## Fix sketch
- `src/components/EmptyState.tsx` — title + body + optional CTA, reusable.
- `src/components/Toaster.tsx` — a lightweight portal-based queue, no extra deps.
- Dashboard reads `sent24h` already; gate the banner at `> 100`.

## Resolution history
- 2026-05-18T16:14:48Z — filed by Ticketing Agent (iter16).
- 2026-05-18T16:19:59Z — Resolving Agent (iter17) set status to inprogress and scoped the fix to items (1) and (3); item (2) Toaster split out to TKT-0008.
- 2026-05-18T16:20:30Z — Resolving Agent (iter17) shipped:
  - `frontend/src/components/EmptyState.tsx` — title + optional body + optional CTA, icon-free.
  - Wired into `/groups` (no group selected), the group detail panel (no contacts), `/history` (loading + no jobs), `/send` (no groups).
  - `frontend/src/components/SoftCapBanner.tsx` — renders only when `sent24h > 100`; collapsible "why" pulled from wars.md anti-spam guidance.
  - Dashboard now mounts the banner above the stat grid.
  Five routes recompiled cleanly (GET / /connect /groups /send /history -> 200). Status set to `resolved`; awaiting Verification Agent.
- 2026-05-18T16:24:52Z — Verification Agent (iter18) PASSED:
  - File system confirms `EmptyState.tsx` and `SoftCapBanner.tsx` exist.
  - Imports confirmed in `/groups` (2 usages), `/history` (2 usages), `/send` (1 usage), `/` (SoftCapBanner mounted with `sent24h` prop).
  - All 5 routes still HTTP 200 after wiring.
  - Chrome MCP visual verification was blocked by a Strike Analytics service worker registered on localhost:3000 that intercepts navigations — filed as TKT-0009 issue B. Curl + filesystem evidence sufficient for this UI-component fix.
  - Status set to `verified`. Committed as `fix(TKT-0002): EmptyState + SoftCapBanner` and pushed.
