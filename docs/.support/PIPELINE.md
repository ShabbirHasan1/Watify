# Watify Pipeline State

This file is the single source of truth for "what runs next". Each loop iteration reads this, executes one chunk as the named agent, then updates this file.

```yaml
phase: scaffold           # planning | scaffold | backend | frontend | ticketing | resolving | verification | done
agent: frontend_agent     # which AGENTS.md role runs next
iteration: 4
last_updated: 2026-05-18T15:13:09Z
last_conversation: docs/.support/conversations/2026-05-18T151309Z-backend_agent-iter4.md
servers:
  backend_running: true
  backend_pid: 50004
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
Run the **Frontend Agent** on PLAN item **F-02** — API client + state hooks:
- `cd frontend && npm install swr`
- Create `src/lib/api.ts` — typed `fetch` wrapper reading `process.env.NEXT_PUBLIC_API_BASE`, throwing on non-2xx with parsed body.
- Create `src/hooks/useHealth.ts` and `src/hooks/useGroups.ts` (groups list only — write/CRUD hooks added in F-04) using SWR with 3s refresh on health.
- Add a small `BackendStatus` component used on the Dashboard that calls `useHealth` and renders ok/down.
- Acceptance: Dashboard shows "Backend: ok" when running, no console errors, TypeScript compiles.
- Mark F-02 `[x]`. Set `agent: backend_agent` next (B-03 — Friend Groups CRUD endpoints).

## History
- 2026-05-18T00:00:00Z iter0 bootstrap -> planning | initial scaffold created by user | log: (none)
- 2026-05-18T14:58:56Z iter1 planning_agent -> scaffold | PLAN.md populated with 8 backend + 7 frontend + 4 infra items | log: docs/.support/conversations/2026-05-18T145856Z-planning_agent-iter1.md
- 2026-05-18T15:03:57Z iter2 backend_agent -> scaffold | B-01 done: backend/ scaffolded with uv, FastAPI 0.136.1, /api/health live on :8000 | log: docs/.support/conversations/2026-05-18T150357Z-backend_agent-iter2.md
- 2026-05-18T15:08:22Z iter3 frontend_agent -> scaffold | F-01 done: Next.js 16.2.6 + Tailwind 4 scaffold, top nav + 5 placeholder routes, dev server on :3000 | log: docs/.support/conversations/2026-05-18T150822Z-frontend_agent-iter3.md
- 2026-05-18T15:13:09Z iter4 backend_agent -> scaffold | B-02 done: SQLModel data layer (FriendGroup/Contact/SendJob/SendAttempt), init_db lifespan hook, smoke_db.py green; AGENTS.md commit policy loosened so scaffold agents commit per item | log: docs/.support/conversations/2026-05-18T151309Z-backend_agent-iter4.md
