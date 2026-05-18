---
id: TKT-0009
title: DELETE /api/groups/{id} 500s when group has historical jobs; Chrome dev env collides with Strike Analytics service worker
status: open
priority: P2
area: backend
created: 2026-05-18T16:24:52Z
updated: 2026-05-18T16:24:52Z
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
