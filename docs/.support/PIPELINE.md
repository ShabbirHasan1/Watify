# Watify Pipeline State

This file is the single source of truth for "what runs next". Each loop iteration reads this, executes one chunk as the named agent, then updates this file.

```yaml
phase: ticketing
agent: resolving_agent
iteration: 43
last_updated: 2026-05-18T18:21:57Z
last_conversation: docs/.support/conversations/2026-05-18T182157Z-verification_agent-iter43.md
servers:
  backend_running: true
  backend_pid: 48532
  backend_url: http://localhost:8000
  frontend_running: true
  frontend_pid: 42204
  frontend_url: http://localhost:3000
tickets:
  open: 7
  inprogress: 0
  resolved: 0
  verified: 13
ticket_index:
  TKT-0001: verified P2 backend Flat error envelope
  TKT-0002: verified P1 frontend UX polish
  TKT-0003: verified P2 infra Dev helper scripts + Makefile
  TKT-0004: verified P2 infra README expanded
  TKT-0005: open P2 backend Surface owner_phone after wars pairing
  TKT-0006: open P3 backend Move test phone constant out of smoke_db.py
  TKT-0007: verified P2 frontend /connect auto-pair guard
  TKT-0008: open P2 frontend Global toaster
  TKT-0009: verified P2 backend Cascade-delete groups
  TKT-0010: verified P1 frontend QR pair UX countdown + dim on expiry
  TKT-0011: verified P1 backend Encrypted session infrastructure
  TKT-0012: verified P2 backend RUST_LOG defaults silence wars noise
  TKT-0013: verified P2 backend Lazy wars import + WarsNotInstalled
  TKT-0014: open P2 backend Pair-code mode alongside QR
  TKT-0015: open P2 backend Rate-limit middleware on send
  TKT-0016: open P3 backend Pair state machine paired vs ready
  TKT-0017: open P3 backend JID helpers
  TKT-0018: open P3 frontend SSE push of QR
  TKT-0019: verified P2 backend wars auto-cycle watchdog
  TKT-0020: verified P1 backend wars on_connected fallback
  TKT-0021: verified P1 backend Encrypted wars session wired end-to-end
```

## Next Action
7 open tickets, all P2 or P3. Recommended order:
1. **TKT-0015** (P2 backend) -- slowapi rate limit on send endpoints. Defense in depth against runaway loops.
2. **TKT-0005** (P2 backend) -- owner_phone after pair. Small win for Ready panel.
3. **TKT-0008** (P2 frontend) -- global Toaster.
4. **TKT-0014** (P2 backend) -- pair-code mode.
5. **TKT-0016/TKT-0017/TKT-0018/TKT-0006** -- P3 polish.

Recommended for iter44: `agent: resolving_agent`, ticket **TKT-0015** (rate limiter).

## History (latest only)
- 2026-05-18T18:12:28Z iter41 verification | TKT-0012 VERIFIED + committed 14ccb0f
- 2026-05-18T18:17:32Z iter42 resolving | TKT-0013 lazy import + sentinel
- 2026-05-18T18:21:57Z iter43 verification_agent -> ticketing | TKT-0013 VERIFIED + committed: live boot logs "wars module loaded lazily (version=0.1.3)" + pair-from-blob unchanged; shadow-block of wars proves app.whatsapp imports without it and WarsNotInstalled raises with cached-failure short-circuit | log: docs/.support/conversations/2026-05-18T182157Z-verification_agent-iter43.md
