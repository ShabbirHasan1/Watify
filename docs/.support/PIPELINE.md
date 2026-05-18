# Watify Pipeline State

This file is the single source of truth for "what runs next". Each loop iteration reads this, executes one chunk as the named agent, then updates this file.

```yaml
phase: ticketing
agent: resolving_agent
iteration: 53
last_updated: 2026-05-18T19:10:00Z
last_conversation: docs/.support/conversations/2026-05-18T191000Z-verification_agent-iter53.md
servers:
  backend_running: true
  backend_pid: 47948
  backend_url: http://localhost:8000
  frontend_running: true
  frontend_pid: 42204
  frontend_url: http://localhost:3000
tickets:
  open: 15
  inprogress: 0
  resolved: 0
  verified: 17
ticket_index:
  TKT-0024: open P1 backend Auth endpoints + JWT cookies + auth rate limits
  TKT-0025: open P1 backend Auth middleware
  TKT-0026: open P1 frontend /login + /register pages
  TKT-0027: open P2 frontend Public hero page; move dashboard to /dashboard
  TKT-0028: open P2 frontend Auth-aware TopNav
  TKT-0029: open P2 frontend Route guards
  TKT-0030: open P1 infra install/install.sh + update.sh
  TKT-0031: verified P1 backend Per-install identity (APP_SECRET + API_KEY)
  TKT-0032: open P2 backend CSRF defense (X-Requested-With + Origin check)
  TKT-0033: open P3 frontend Track Next.js postcss XSS advisory
  TKT-0006: open P3 backend Move test phone constant out of smoke_db.py
  TKT-0008: open P2 frontend Global toaster
  TKT-0014: open P2 backend Pair-code mode alongside QR
  TKT-0016: open P3 backend Pair state machine paired vs ready
  TKT-0017: open P3 backend JID helpers
  TKT-0018: open P3 frontend SSE push of QR
  TKT-0022: open P3 frontend Job drawer cache drift
```

## Next Action
**Resolving Agent** picks **TKT-0024** (P1 backend) -- auth endpoints + JWT cookies + auth rate limits. Now that `settings.app_secret` is in place (TKT-0031) we have a real signing key. Build:
- `POST /api/auth/register` (3/min, register-once -> 409)
- `POST /api/auth/login` (5/min + sliding 5-fails-in-10min -> 15min lockout)
- `POST /api/auth/refresh` (30/min, signs with `app_secret + user.refresh_secret` composite key)
- `POST /api/auth/logout` (rotates `user.refresh_secret`)
- `GET /api/auth/me` (works once TKT-0025 middleware lands; for now exposes the user via a temporary dependency)

503 `auth_not_configured` returned by all five when `app_secret` is empty.

## History (latest only)
- 2026-05-18T19:00:59Z iter51 ticketing | security audit; 3 tickets filed
- 2026-05-18T19:05:15Z iter52 resolving | TKT-0031 app identity shipped
- 2026-05-18T19:10:00Z iter53 verification_agent -> ticketing | TKT-0031 VERIFIED + committed: 4 checks (fp=92523edb configured, deterministic b1fa18b6 for known secret, null + WARN unconfigured, compare_digest constant-time api_key_matches) all green | log: docs/.support/conversations/2026-05-18T191000Z-verification_agent-iter53.md
