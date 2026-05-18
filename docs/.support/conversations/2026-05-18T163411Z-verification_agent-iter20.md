# Iteration 20 — Verification Agent (TKT-0009)

- **Started**: 2026-05-18T16:34:11Z
- **Finished**: 2026-05-18T16:36:00Z
- **Phase entering**: verification
- **Phase exiting**: ticketing
- **Active agent**: verification_agent
- **Ticket under test**: TKT-0009

## Result: PASS

## Independent reproduction (clean DB baseline: 0 groups, 0 jobs)

### Case 1 — cascade with a terminal (failed) job
```
POST /api/groups {name:"verify-A"}            -> id=1
POST /api/groups/1/contacts {a1, +1 415 555 7001}
POST /api/send {group_id:1, schedule:"now", min/max=1}
... wait 4s for the job to finish ...
job statuses: ['failed']    (wa_not_ready as expected)
DELETE /api/groups/1        -> HTTP 204
jobs for group 1 after delete: 0
```

### Case 2 — cascade with a future scheduled job (exercises the APScheduler scrub)
```
POST /api/groups {name:"verify-B"}            -> id=1
POST /api/groups/1/contacts {b1, +1 415 555 7002}
POST /api/send {group_id:1, schedule:"2030-12-01T00:00:00+00:00"}  -> job id=1 status=scheduled
DELETE /api/groups/1        -> HTTP 204
jobs for group 1 after delete: 0
```

### Final state
```
groups = 0
jobs   = 0
```

## Both cascade paths verified. Original 500 cannot reproduce.

## Ticket transition
- TKT-0009 -> `verified`. Resolution history appended with reproduction details.

## Commit + push
About to commit `fix(TKT-0009): cascade-delete groups with historical jobs` covering:
- `backend/app/models.py` (one-line cascade on FriendGroup.jobs)
- `backend/app/routers/groups.py` (APScheduler scrub in delete_group)
- `docs/.support/tickets/TKT-0009-*.md` (status -> verified, full resolution history)
- `docs/.support/PIPELINE.md` (iter19 + iter20 history)
- `docs/.support/conversations/2026-05-18T162933Z-resolving_agent-iter19.md`
- `docs/.support/conversations/2026-05-18T163411Z-verification_agent-iter20.md`

## Next iteration
Per PIPELINE: **Resolving Agent** on **TKT-0007** (P2 frontend) — the `/connect` auto-pair re-trigger guard. Small `useRef` change.
