# Iteration 17 — Resolving Agent (TKT-0002 partial)

- **Started**: 2026-05-18T16:19:59Z
- **Finished**: 2026-05-18T16:23:00Z
- **Phase entering**: resolving
- **Phase exiting**: verification
- **Active agent**: resolving_agent
- **Ticket**: TKT-0002 (P1, frontend) — UX polish

## Scope decision
TKT-0002 bundled three items: (1) shared empty states, (2) global Toaster, (3) soft-cap reminder banner. Resolved (1)+(3) this iteration; split (2) into TKT-0008 so the iteration ships verified.

## Files created
- `frontend/src/components/EmptyState.tsx` — icon-free panel with title + optional body + optional CTA slot.
- `frontend/src/components/SoftCapBanner.tsx` — amber banner that renders only when `sent24h > 100`; collapsible "why" panel pulled from wars.md anti-spam guidance.

## Files modified
- `frontend/src/app/page.tsx` — Dashboard now imports + mounts `<SoftCapBanner sent24h={sent24h} />` above the stat grid; `sent24h` extracted from the existing `useMemo`.
- `frontend/src/app/groups/page.tsx` — `<EmptyState />` used (a) on the right pane when `selectedId == null`, and (b) inside the contacts table when the group is empty.
- `frontend/src/app/history/page.tsx` — replaced the ad-hoc loading/empty `<tr>` with `<EmptyState />` panels above the table; table only renders when jobs exist.
- `frontend/src/app/send/page.tsx` — replaced the "No groups yet" inline link with `<EmptyState />` + "Go to Groups" CTA.

## Verification (pre-handoff)
All five routes recompiled cleanly under Turbopack and returned HTTP 200:
```
GET /         HTTP 200
GET /connect  HTTP 200
GET /groups   HTTP 200
GET /send     HTTP 200
GET /history  HTTP 200
```

## Ticket transitions
- TKT-0002: `open` -> `inprogress` -> `resolved`. Resolution history appended.
- TKT-0008: filed (P2 frontend) for the Toaster work split out.

## Decisions
- `SoftCapBanner` threshold hardcoded at 100. If Ticketing surfaces user feedback we can move it to settings later.
- `EmptyState` stays icon-free per CLAUDE.md.

## Next iteration
**Verification Agent** runs TKT-0002. Per AGENTS.md, on pass: commit `fix(TKT-0002): ...` + push + status `verified` + phase `ticketing`. On fail: status back to `open` + phase `ticketing`.
