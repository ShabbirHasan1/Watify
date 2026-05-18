# Watify Pipeline State

This file is the single source of truth for "what runs next". Each loop iteration reads this, executes one chunk as the named agent, then updates this file.

```yaml
phase: scaffold           # planning | scaffold | backend | frontend | ticketing | resolving | verification | done
agent: backend_agent      # which AGENTS.md role runs next
iteration: 7
last_updated: 2026-05-18T15:29:16Z
last_conversation: docs/.support/conversations/2026-05-18T152916Z-backend_agent-iter7.md
servers:
  backend_running: true
  backend_pid: 39988
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
Run the **Backend Agent** on PLAN item **B-05** — wars singleton + connection endpoints:
- `cd backend && uv add wars` (if PyPI install fails, fall back to source build via maturin per wars.md; file I-04 ticket if so).
- `app/whatsapp.py` — lazy thread-safe singleton (per wars.md §7) with `db_path="whatsapp.db"`.
  - Internal state: `state: Literal["disconnected","pairing","ready","error"]`, `qr_data_url: str|None`, `owner_phone: str|None`, `last_error: str|None`.
  - Wires `@wa.on_qr` → caches `qr_to_data_url(code)`; clears on connect.
  - Wires `@wa.on_connected` → `state="ready"`, owner_phone resolved if possible.
  - Wires `@wa.on_disconnect` → `state="disconnected"`.
- `app/routers/whatsapp.py`:
  - `POST /api/wa/connect` — starts connect in background thread, returns current state.
  - `POST /api/wa/disconnect` — idempotent.
  - `GET /api/wa/state` — `{state, qr_data_url, owner_phone}`.
- Register router in `app/main.py`.
- Acceptance: `/api/wa/state` returns `disconnected` initially; calling `/api/wa/connect` flips state to `pairing` and surfaces a non-null `qr_data_url` within ~5s.
- Mark B-05 `[x]`. Set `agent: frontend_agent` next (F-03 — Connect / pairing UI).
- Commit: `feat(B-05): wars singleton + WhatsApp connection endpoints`.

## History
- 2026-05-18T00:00:00Z iter0 bootstrap -> planning | initial scaffold created by user | log: (none)
- 2026-05-18T14:58:56Z iter1 planning_agent -> scaffold | PLAN.md populated with 8 backend + 7 frontend + 4 infra items | log: docs/.support/conversations/2026-05-18T145856Z-planning_agent-iter1.md
- 2026-05-18T15:03:57Z iter2 backend_agent -> scaffold | B-01 done: backend/ scaffolded with uv, FastAPI 0.136.1, /api/health live on :8000 | log: docs/.support/conversations/2026-05-18T150357Z-backend_agent-iter2.md
- 2026-05-18T15:08:22Z iter3 frontend_agent -> scaffold | F-01 done: Next.js 16.2.6 + Tailwind 4 scaffold, top nav + 5 placeholder routes, dev server on :3000 | log: docs/.support/conversations/2026-05-18T150822Z-frontend_agent-iter3.md
- 2026-05-18T15:13:09Z iter4 backend_agent -> scaffold | B-02 done: SQLModel data layer + init_db lifespan + smoke_db.py green; AGENTS.md commit policy loosened; security audit added | log: docs/.support/conversations/2026-05-18T151309Z-backend_agent-iter4.md
- 2026-05-18T15:18:13Z iter5 frontend_agent -> scaffold | F-02 done: api.ts typed fetch + useHealth SWR + BackendStatus pill on Dashboard; useGroups deferred to F-04 | log: docs/.support/conversations/2026-05-18T151813Z-frontend_agent-iter5.md
- 2026-05-18T15:22:56Z iter6 backend_agent -> scaffold | B-03 done: friend groups CRUD + 20-cap enforced (HTTP 409 group_full), phone normalizer, schemas; backend pid 11132 | log: docs/.support/conversations/2026-05-18T152256Z-backend_agent-iter6.md
- 2026-05-18T15:29:16Z iter7 backend_agent -> scaffold | B-04 done: bulk-add contacts endpoint with all-or-nothing validation, dedupe, overflow guard; 5 curl cases verified; backend pid 39988 | log: docs/.support/conversations/2026-05-18T152916Z-backend_agent-iter7.md
