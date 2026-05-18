# Watify Pipeline State

This file is the single source of truth for "what runs next". Each loop iteration reads this, executes one chunk as the named agent, then updates this file.

```yaml
phase: planning           # planning | scaffold | backend | frontend | ticketing | resolving | verification | done
agent: planning_agent     # which AGENTS.md role runs next
iteration: 0
last_updated: 2026-05-18T00:00:00Z
last_conversation: null
servers:
  backend_running: false
  frontend_running: false
tickets:
  open: 0
  inprogress: 0
  resolved: 0
  verified: 0
```

## Next Action
Run the **Planning Agent**:
- Read `REQUIREMENTS.md`.
- Produce `PLAN.md` with backend (`B-NN`) and frontend (`F-NN`) work items in dependency order, each with acceptance criteria.
- Advance `phase` to `scaffold` and set `agent` to whichever item is first on PLAN (typically `backend_agent` for `B-01` repo scaffold).

## History
(Append a one-liner per iteration: `<UTC> iter<N> <agent> -> <phase> | <one-line summary> | log: <path>`)

- 2026-05-18T00:00:00Z iter0 bootstrap -> planning | initial scaffold created by user | log: (none)
