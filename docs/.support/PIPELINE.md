# Watify Pipeline State

This file is the single source of truth for "what runs next". Each loop iteration reads this, executes one chunk as the named agent, then updates this file.

```yaml
phase: scaffold           # planning | scaffold | backend | frontend | ticketing | resolving | verification | done
agent: backend_agent      # which AGENTS.md role runs next
iteration: 6
last_updated: 2026-05-18T15:22:56Z
last_conversation: docs/.support/conversations/2026-05-18T152256Z-backend_agent-iter6.md
servers:
  backend_running: true
  backend_pid: 11132
  backend_url: http://localhost:8000
  frontend_running: true
  frontend_pid: 42204
  frontend_url: http://localhost:3000
tickets:
  open: 0
  inprogress: 0
  resolved: 0
  verified: 0
```

## Next Action
Run the **Backend Agent** on PLAN item **B-04** — Bulk upload endpoint:
- `POST /api/groups/{id}/contacts/bulk` body `{"contacts":[{"name","phone"},...]}` (max 20 entries).
- All-or-nothing semantics: if any row's phone is invalid, OR if `existing_count + batch_size > 20`, reject the entire batch with `422` body `{"error":"bulk_rejected","reasons":[{"index":i,"reason":"..."}]}`.
- On success: 201 with the list of inserted ContactRead.
- Idempotency: skip rows whose phone matches an existing contact in this group (return them in a `skipped` array, not as errors).
- Restart backend, smoke 3 cases: valid batch, batch containing one invalid row, batch that overflows the cap.
- Mark B-04 `[x]`. Set `agent: frontend_agent` next (F-03 — Connect/pairing UI, depends on B-05 which we'll run after F-03 since pairing UI can mount with mocked state).

  Actually: switch to **B-05** next (`wars` singleton + connect endpoints) so F-03 has a real backend to talk to in iter8. F-04 (groups UI + bulk) waits for B-04 to be wired through F-04.

  Plan for iteration after B-04: `agent: backend_agent`, item: B-05.
- Commit per new policy: `feat(B-04): bulk-add contacts with all-or-nothing validation`.

## History
- 2026-05-18T00:00:00Z iter0 bootstrap -> planning | initial scaffold created by user | log: (none)
- 2026-05-18T14:58:56Z iter1 planning_agent -> scaffold | PLAN.md populated with 8 backend + 7 frontend + 4 infra items | log: docs/.support/conversations/2026-05-18T145856Z-planning_agent-iter1.md
- 2026-05-18T15:03:57Z iter2 backend_agent -> scaffold | B-01 done: backend/ scaffolded with uv, FastAPI 0.136.1, /api/health live on :8000 | log: docs/.support/conversations/2026-05-18T150357Z-backend_agent-iter2.md
- 2026-05-18T15:08:22Z iter3 frontend_agent -> scaffold | F-01 done: Next.js 16.2.6 + Tailwind 4 scaffold, top nav + 5 placeholder routes, dev server on :3000 | log: docs/.support/conversations/2026-05-18T150822Z-frontend_agent-iter3.md
- 2026-05-18T15:13:09Z iter4 backend_agent -> scaffold | B-02 done: SQLModel data layer + init_db lifespan + smoke_db.py green; AGENTS.md commit policy loosened; security audit added | log: docs/.support/conversations/2026-05-18T151309Z-backend_agent-iter4.md
- 2026-05-18T15:18:13Z iter5 frontend_agent -> scaffold | F-02 done: api.ts typed fetch + useHealth SWR + BackendStatus pill on Dashboard; useGroups deferred to F-04 | log: docs/.support/conversations/2026-05-18T151813Z-frontend_agent-iter5.md
- 2026-05-18T15:22:56Z iter6 backend_agent -> scaffold | B-03 done: friend groups CRUD + 20-cap enforced (HTTP 409 group_full), phone normalizer, schemas; backend pid 11132 | log: docs/.support/conversations/2026-05-18T152256Z-backend_agent-iter6.md
