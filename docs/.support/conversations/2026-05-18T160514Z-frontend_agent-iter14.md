# Iteration 14 — Frontend Agent (F-06)

- **Started**: 2026-05-18T16:05:14Z
- **Finished**: 2026-05-18T16:09:00Z
- **Phase**: scaffold (F-06)
- **Active agent**: frontend_agent
- **PLAN item**: F-06 — `/history` page + Dashboard live counts

## Files created
- `frontend/src/components/StatusBadge.tsx` — single tinted pill used for both `JobStatus` and `AttemptStatus`. Tones: pending (zinc), scheduled (sky), running (amber), completed/sent (emerald), failed (rose), cancelled (zinc-200).
- `frontend/src/components/history/JobRow.tsx` — table row with an expandable attempts drawer. Drawer lazily mounts a `useJobDetail(id)` only when the row is opened (no detail-fetch storm). Renders message + delay window + a sub-table of attempts (contact name, redacted phone, status badge, sent_at, error).

## Files modified
- `frontend/src/app/history/page.tsx` — full table built on `useJobs()` with empty/loading states + "New send" link header. Per-row cancel action (only when status is `pending | scheduled | running`).
- `frontend/src/app/page.tsx` — Dashboard pulled into a client component; tiles now compute counts in `useMemo` from `useGroups()` + `useJobs()`. Four tiles: groups, total contacts (summed `contact_count`), jobs today (created today client-local), sent (24h) summing `counts.sent` across recent jobs.

## Verification
- `GET /history` -> 200; `GET /` -> 200; Turbopack compiled cleanly.
- Backend has 2 jobs from iter12 (failed, cancelled). They will render in the table on a real browser load.
- The dashboard tiles will populate as soon as the page mounts via SWR.

## Decisions
- `useJobDetail` is mounted only when a row is `open`, so we don't fire a fetch per row on load. The detail-poll itself is bounded (2s while not terminal, paused otherwise).
- Date formatting uses `toLocaleString()` for browser-local display. Phone redaction comes from the backend (`contact_phone_redacted`), so the client never has the raw number.
- "Sent (24h)" sums `counts.sent` across jobs created in the last 24h. Not perfectly aligned with delivery time but acceptable for a soft signal; precision can come later if Ticketing asks.

## Security audit notes (preview for Ticketing Agent)
- All phone displays come pre-redacted from the backend. No raw `phone_e164` anywhere in this iteration's frontend. PASS.
- Job messages render in `<span>` text nodes (React escaped). PASS.
- No `dangerouslySetInnerHTML`, no `eval`, no string-templated URLs. PASS.

## Commit
About to commit `feat(F-06): history table with per-job drawer and live dashboard counts`.

## Next iteration
**Backend Agent** runs B-08 (pydantic-settings + structured logging with phone redaction filter + global JSON error handler). After B-08, the scaffold phase finishes and the pipeline advances to **ticketing**.
