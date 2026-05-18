# Iteration 19 — Resolving Agent (TKT-0009)

- **Started**: 2026-05-18T16:29:33Z
- **Finished**: 2026-05-18T16:33:00Z
- **Phase entering**: resolving
- **Phase exiting**: verification
- **Active agent**: resolving_agent
- **Ticket**: TKT-0009 (P2 backend) — cascade-delete groups + SW collision

## Scope decision
TKT-0009 bundled two findings. Resolved issue A (code) in this iteration; issue B (Strike Analytics service-worker collision on localhost:3000) is dev-env-only and folds into TKT-0004's README work.

## Files modified
- `backend/app/models.py` — `FriendGroup.jobs` relationship gains `sa_relationship_kwargs={"cascade":"all, delete-orphan"}`. Mirrors the existing cascade on `FriendGroup.contacts`. `SendJob.attempts` already had cascade.
- `backend/app/routers/groups.py` — `delete_group()` now walks `pending`/`scheduled` SendJob rows for the target group and calls `scheduler.remove_job(aps_job_id(id))` on each before deleting the FriendGroup. Required because APScheduler's `apscheduler_jobs` table has no foreign key to `send_job` — SQLAlchemy cascade wouldn't clean it up.

## Smoke results
Backend respawned (pid 35788).

1. **Original failure path**: had 1 group (`jobs-smoke`) + 2 historical jobs from iter12 (one `failed`, one `cancelled`).
   ```
   DELETE /api/groups/1 -> HTTP 204
   GET /api/groups -> 0 groups
   GET /api/jobs   -> 0 jobs
   ```
   Cascade cleaned both `send_job` + `send_attempt` rows.

2. **Lifecycle path** (future-scheduled job):
   ```
   POST /api/groups {name: "cascade-test"}        -> id=1
   POST /api/groups/1/contacts {alice, +1...}     -> 201
   POST /api/send {group_id:1, schedule:"2030..."} -> id=1 status=scheduled
   DELETE /api/groups/1                            -> HTTP 204
   GET /api/groups -> 0 groups
   GET /api/jobs   -> 0 jobs
   ```
   APScheduler entry pre-removed; cascade then dropped the SendJob row cleanly.

## Decisions / Notes
- `pending_jobs` selection uses `SendJob.status.in_(...)` — `running` is excluded because the worker is already executing and we don't want to remove its scheduler entry mid-flight. A running job will see its `SendJob` row cascade-deleted from under it; its next loop iteration will hit `s.get(SendJob, job_id) is None` and return cleanly (already coded in `sender.run_send_job`).
- `completed`/`failed`/`cancelled` jobs have no APScheduler entry to clean (already fired or never scheduled), so they're left to the cascade.

## Ticket transition
- TKT-0009: `open` -> `inprogress` -> `resolved`. Resolution history appended with the smoke evidence.

## Next iteration
**Verification Agent** runs TKT-0009 verification. On pass: `verified`, commit `fix(TKT-0009): cascade-delete groups with historical jobs`, push.
