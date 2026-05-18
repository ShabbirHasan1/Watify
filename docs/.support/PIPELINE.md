# Watify Pipeline State

This file is the single source of truth for "what runs next". Each loop iteration reads this, executes one chunk as the named agent, then updates this file.

```yaml
phase: ticketing
agent: resolving_agent     # advance straight to resolving on the next-priority open
iteration: 20
last_updated: 2026-05-18T16:34:11Z
last_conversation: docs/.support/conversations/2026-05-18T163411Z-verification_agent-iter20.md
servers:
  backend_running: true
  backend_pid: 35788
  backend_url: http://localhost:8000
  frontend_running: true
  frontend_pid: 42204
  frontend_url: http://localhost:3000
tickets:
  open: 6
  inprogress: 0
  resolved: 0
  verified: 2
ticket_index:
  TKT-0001: open P2 backend Standardize API error response shape
  TKT-0002: verified P1 frontend UX polish
  TKT-0003: open P2 infra Add top-level dev helper scripts (I-02)
  TKT-0004: open P2 infra Expand README with local-run instructions (I-03)
  TKT-0005: open P2 backend Surface owner_phone after wars pairing
  TKT-0006: open P3 backend Move test phone constant out of smoke_db.py
  TKT-0007: open P2 frontend /connect re-triggers POST /api/wa/connect on every hot-reload
  TKT-0008: open P2 frontend Global toaster for transient errors / success
  TKT-0009: verified P2 backend Cascade-delete groups (issue A committed; issue B deferred to TKT-0004 README)
```

## Next Action
6 open tickets remain (all P2 or P3). Suggested order for the Resolving Agent:
1. **TKT-0007** (P2 frontend) — small, isolated `useRef` guard fix. Will leave dev cycles cleaner immediately.
2. **TKT-0001** (P2 backend) — flatten the 422/409 error envelope. Touches both backend (HTTPException handler) and frontend `ApiError.body` consumers; bigger blast radius. Defer until after TKT-0007.
3. **TKT-0003** + **TKT-0004** (P2 infra) — dev scripts + README. Both small, can land in one iteration.
4. **TKT-0005** (P2 backend) — owner_phone exposure. Needs wars API exploration; can split if it grows.
5. **TKT-0008** (P2 frontend) — global toaster.
6. **TKT-0006** (P3 backend) — smoke_db test phone — last because it's cosmetic.

Recommended for iter21: `agent: resolving_agent`, ticket **TKT-0007**.

## History
- 2026-05-18T00:00:00Z iter0 bootstrap | initial scaffold
- 2026-05-18T14:58:56Z iter1 planning | PLAN populated
- 2026-05-18T15:03:57Z iter2 backend | B-01 done
- 2026-05-18T15:08:22Z iter3 frontend | F-01 done
- 2026-05-18T15:13:09Z iter4 backend | B-02 done
- 2026-05-18T15:18:13Z iter5 frontend | F-02 done
- 2026-05-18T15:22:56Z iter6 backend | B-03 done
- 2026-05-18T15:29:16Z iter7 backend | B-04 done
- 2026-05-18T15:35:47Z iter8 backend | B-05 done
- 2026-05-18T15:41:22Z iter9 frontend | F-03 done
- 2026-05-18T15:46:09Z iter10 backend | B-06 done
- 2026-05-18T15:51:01Z iter11 frontend | F-04 done
- 2026-05-18T15:56:09Z iter12 backend | B-07 done
- 2026-05-18T16:00:23Z iter13 frontend | F-05 done
- 2026-05-18T16:05:14Z iter14 frontend | F-06 done
- 2026-05-18T16:10:14Z iter15 backend | B-08 done; scaffold complete
- 2026-05-18T16:14:48Z iter16 ticketing | 7 tickets filed
- 2026-05-18T16:19:59Z iter17 resolving | TKT-0002 partial; TKT-0008 split
- 2026-05-18T16:24:52Z iter18 verification | TKT-0002 VERIFIED + committed; TKT-0009 filed
- 2026-05-18T16:29:33Z iter19 resolving | TKT-0009 resolved (cascade + APScheduler scrub)
- 2026-05-18T16:34:11Z iter20 verification_agent -> ticketing | TKT-0009 VERIFIED + committed: 2 independent cascade smokes (terminal-job + future-scheduled-job) both 204; 6 open tickets remain | log: docs/.support/conversations/2026-05-18T163411Z-verification_agent-iter20.md
