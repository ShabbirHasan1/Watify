---
id: TKT-0009
title: DELETE /api/groups/{id} 500s when group has historical jobs; Chrome dev env collides with Strike Analytics service worker
status: verified
priority: P2
area: backend
created: 2026-05-18T16:24:52Z
updated: 2026-05-18T16:34:11Z
created_by: verification_agent
related_plan_item: B-03
---

## Summary
Two unrelated findings surfaced during verification of TKT-0002. Bundling them here so the Resolving Agent picks them up in one pass.

### Issue A (P2 backend): cascade-delete 500
`DELETE /api/groups/{id}` returns 500 when the group has any `SendJob` rows referencing it. The `FriendGroup.jobs` relationship has only `back_populates`, no cascade rule, and the FK constraint blocks the row delete.

Reproduction:
```
POST /api/groups -> id=1
POST /api/groups/1/contacts (any)
POST /api/send {group_id: 1, ...}
DELETE /api/groups/1 -> HTTP 500
```

Expected: cascade the jobs + attempts, or refuse with `409 group_has_jobs` and a clear error.

Fix sketch: add `sa_relationship_kwargs={"cascade":"all, delete-orphan"}` to `FriendGroup.jobs` in `models.py` (and ensure `SendJob.attempts` already cascades — it does). Document in the API response that delete cascades historical jobs.

### Issue B (P3 infra): Strike Analytics service worker collision on localhost:3000
A previously-loaded Strike Analytics app registered a service worker scoped to `localhost:3000/`. Once installed, that SW intercepts Watify pages from any Chrome tab on the same origin and serves Strike's `/404`. Curl bypasses the SW and confirms Watify is serving correctly; Chrome shows the Strike fallback.

Workaround (manual for the operator):
- Chrome DevTools -> Application -> Service Workers -> Unregister.
- Or visit `chrome://serviceworker-internals/` and stop the localhost SW.

Not a Watify code fix — but worth documenting in the README troubleshooting section (rolled into TKT-0004).

## Resolution history
- 2026-05-18T16:24:52Z — filed by Verification Agent (iter18).
- 2026-05-18T16:29:33Z — Resolving Agent (iter19) set status to inprogress; scoped fix to issue A (code) and deferred issue B (documentation) to TKT-0004's README scope.
- 2026-05-18T16:31:00Z — Resolving Agent (iter19) shipped:
  - `backend/app/models.py` — `FriendGroup.jobs` now uses `sa_relationship_kwargs={"cascade":"all, delete-orphan"}`, mirroring the existing rule on `FriendGroup.contacts`.
  - `backend/app/routers/groups.py` `delete_group()` — before deleting the FriendGroup, walks `SendJob` rows in `pending` or `scheduled` status for that group and calls `scheduler.remove_job(aps_job_id(id))` on each, since APScheduler's `apscheduler_jobs` table has no FK to `send_job` and would not be wiped by SQLAlchemy cascade.

  Backend respawned (pid 35788). Smoke:
  - Reproduced the original failure: had 1 group + 2 historical jobs. `DELETE /api/groups/1` now returns HTTP 204; `GET /api/groups` -> 0 groups; `GET /api/jobs` -> 0 jobs. PASS.
  - Lifecycle test: created `cascade-test` group + 1 contact + scheduled a future job (id=1). `DELETE` -> 204; both group + job removed. PASS.

  Status set to `resolved`; awaiting Verification Agent. Issue B (Strike Analytics service worker on localhost:3000) remains a documentation item, will be addressed when TKT-0004 expands the README.
- 2026-05-18T16:34:11Z — Verification Agent (iter20) PASSED with two independent reproductions on a clean DB:
  - Case 1 (terminal job): created `verify-A` + 1 contact + scheduled "now" job. After it failed (wa_not_ready as expected, no QR scanned), `DELETE /api/groups/1` returned HTTP 204; group + job + attempt rows gone.
  - Case 2 (future scheduled job): created `verify-B` + 1 contact + scheduled a 2030 job (status=scheduled). `DELETE /api/groups/1` returned HTTP 204; group + job gone; APScheduler entry removed by the scrub loop in `delete_group`.
  Final state: 0 groups, 0 jobs.
  Status set to `verified`. Committed as `fix(TKT-0009): cascade-delete groups with historical jobs` and pushed.
