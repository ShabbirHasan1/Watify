# Watify Pipeline State

This file is the single source of truth for "what runs next". Each loop iteration reads this, executes one chunk as the named agent, then updates this file.

```yaml
phase: scaffold           # planning | scaffold | backend | frontend | ticketing | resolving | verification | done
agent: frontend_agent     # which AGENTS.md role runs next
iteration: 10
last_updated: 2026-05-18T15:46:09Z
last_conversation: docs/.support/conversations/2026-05-18T154609Z-backend_agent-iter10.md
servers:
  backend_running: true
  backend_pid: 43712
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
Run the **Frontend Agent** on PLAN item **F-04** — Groups page (CRUD + bulk):
- `src/hooks/useGroups.ts` — SWR list + `createGroup`, `renameGroup`, `deleteGroup`, `addContact`, `deleteContact`, `bulkAddContacts` mutators using the api wrapper.
- `src/app/groups/page.tsx`:
  - Left column: list of groups with `name (X/20)` counter; "New group" form below.
  - Click a group -> right column shows contact table.
  - Add Contact form (disabled at 20). Each row has a Delete (trash) action — text button labeled "remove", no icons.
  - Bulk modal: textarea pasting `name,phone` lines, preview, submit -> shows `inserted`/`skipped` counts. Surfaces row-level errors from 422 `bulk_rejected`.
- Disable bulk submit when paste would exceed 20.
- Acceptance: visual creation of a group; 21st contact gets disabled UI + surfaces server 409 on a forced attempt; bulk with one bad row leaves the group untouched.
- Mark F-04 `[x]`. Set `agent: backend_agent` next (B-07 — send-to-group + APScheduler).
- Commit: `feat(F-04): groups + contacts UI with bulk-add modal`.

## History
- 2026-05-18T00:00:00Z iter0 bootstrap -> planning | initial scaffold created by user | log: (none)
- 2026-05-18T14:58:56Z iter1 planning_agent -> scaffold | PLAN.md populated with 8 backend + 7 frontend + 4 infra items | log: docs/.support/conversations/2026-05-18T145856Z-planning_agent-iter1.md
- 2026-05-18T15:03:57Z iter2 backend_agent -> scaffold | B-01 done: backend/ scaffolded with uv, FastAPI 0.136.1, /api/health live on :8000 | log: docs/.support/conversations/2026-05-18T150357Z-backend_agent-iter2.md
- 2026-05-18T15:08:22Z iter3 frontend_agent -> scaffold | F-01 done: Next.js 16.2.6 + Tailwind 4 scaffold, top nav + 5 placeholder routes, dev server on :3000 | log: docs/.support/conversations/2026-05-18T150822Z-frontend_agent-iter3.md
- 2026-05-18T15:13:09Z iter4 backend_agent -> scaffold | B-02 done: SQLModel data layer + init_db lifespan + smoke_db.py green; AGENTS.md commit policy loosened; security audit added | log: docs/.support/conversations/2026-05-18T151309Z-backend_agent-iter4.md
- 2026-05-18T15:18:13Z iter5 frontend_agent -> scaffold | F-02 done: api.ts typed fetch + useHealth SWR + BackendStatus pill on Dashboard; useGroups deferred to F-04 | log: docs/.support/conversations/2026-05-18T151813Z-frontend_agent-iter5.md
- 2026-05-18T15:22:56Z iter6 backend_agent -> scaffold | B-03 done: friend groups CRUD + 20-cap enforced (HTTP 409 group_full), phone normalizer, schemas; backend pid 11132 | log: docs/.support/conversations/2026-05-18T152256Z-backend_agent-iter6.md
- 2026-05-18T15:29:16Z iter7 backend_agent -> scaffold | B-04 done: bulk-add contacts endpoint with all-or-nothing validation, dedupe, overflow guard; 5 curl cases verified; backend pid 39988 | log: docs/.support/conversations/2026-05-18T152916Z-backend_agent-iter7.md
- 2026-05-18T15:35:47Z iter8 backend_agent -> scaffold | B-05 done: wars singleton on dedicated worker thread (PyO3 !Send), /api/wa/state|connect|disconnect, QR data-url surfaced within ~4s; backend pid 48980 | log: docs/.support/conversations/2026-05-18T153547Z-backend_agent-iter8.md
- 2026-05-18T15:41:22Z iter9 frontend_agent -> scaffold | F-03 done: useWaState SWR hook, Connect page with auto-pair on mount, QR display, Disconnect button, error/retry path; Dashboard WhatsApp tile uses live state | log: docs/.support/conversations/2026-05-18T154122Z-frontend_agent-iter9.md
- 2026-05-18T15:46:09Z iter10 backend_agent -> scaffold | B-06 done: /api/wa/test/self|to endpoints; 409 not_ready when state!=ready; phone redaction in response; backend pid 43712 | log: docs/.support/conversations/2026-05-18T154609Z-backend_agent-iter10.md
