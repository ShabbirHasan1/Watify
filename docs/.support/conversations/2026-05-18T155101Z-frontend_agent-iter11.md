# Iteration 11 — Frontend Agent (F-04)

- **Started**: 2026-05-18T15:51:01Z
- **Finished**: 2026-05-18T15:55:00Z
- **Phase**: scaffold (F-04)
- **Active agent**: frontend_agent
- **PLAN item**: F-04 — Groups page + bulk-add modal

## Files created
- `frontend/src/hooks/useGroups.ts` — list (SWR), create/rename/delete with cache invalidation.
- `frontend/src/hooks/useGroupDetail.ts` — single-group SWR + addContact / removeContact / bulkAddContacts; invalidates both the detail key and the list key.
- `frontend/src/components/groups/BulkAddModal.tsx` — paste textarea, live row count, GROUP_MAX (20) and remaining-slot guards, surfaces 422 `bulk_rejected.reasons` per row, shows inserted/skipped totals on success.

## Files modified
- `frontend/src/lib/api.ts` — added types `ContactRead`, `FriendGroupRead`, `FriendGroupDetail`, `BulkContactsResponse`, `BulkRejectedReason`; `groups.*` helper; `GROUP_MAX = 20` constant.
- `frontend/src/app/groups/page.tsx` — full UI:
  - Left column (280px on lg): groups list with `X/20` counter, New-group form below.
  - Right column: selected group detail panel — header with name + count + Bulk-add / Delete-group buttons; Add-contact form (disabled at 20); contacts table with per-row remove.
  - Auto-selects first group on load via `useEffect`.

## Bug caught + fixed in-iteration
Initial draft called `setSelectedId` inside the render body when the list arrived. React detects this as an unsafe state update during render. Refactored to a `useEffect` keyed on `[list, selectedId]`. (Caught before commit.)

## Verification
- `GET /groups` -> 200, Turbopack compiled cleanly.
- `GET /` / `/connect` / `/send` / `/history` still 200.
- The Connect page kept retriggering the wars connect on every hot-reload during dev; left the wars singleton in `pairing`. Called `/api/wa/disconnect` after the test pass to leave a clean state.

## Security audit notes (preview for Ticketing Agent)
- All API responses go through Pydantic on the backend and typed shapes on the client. PASS.
- Contact phones rendered inside `<td>` text nodes — React escapes by default. PASS.
- Bulk modal parses the textarea client-side as plain strings; nothing eval'd. PASS.
- No raw phone numbers logged from the frontend. PASS.

## Decisions
- Bulk modal closes on a clean batch after 600ms so the user sees "Inserted N, skipped 0" before it dismisses; if `skipped > 0` it stays open so the user can review.
- Rename UI not yet implemented (PATCH `/api/groups/{id}` exists). Left for F-07 polish iteration if needed; the in-line group click currently just selects. Filed as a future ticket candidate.

## Commit
About to commit `feat(F-04): groups + contacts UI with bulk-add modal`.

## Next iteration
**Backend Agent** runs B-07 (send-to-group orchestrator + APScheduler with SQLAlchemyJobStore).
