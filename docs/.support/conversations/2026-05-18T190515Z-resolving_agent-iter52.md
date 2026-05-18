# Iteration 52 — Resolving Agent (TKT-0031)

- **Started**: 2026-05-18T19:05:15Z
- **Phase**: resolving
- **Active agent**: resolving_agent
- **Ticket**: TKT-0031 (P1 backend) -- per-install identity (APP_SECRET + API_KEY) like openalgo

## Plan
1. Mark TKT-0031 `inprogress`.
2. `app/settings.py` -- add `app_secret: str = ""` and `api_key: str = ""`. Both default to empty so dev can run without; auth endpoints (TKT-0024) refuse when `app_secret` is empty.
3. `app/identity.py` -- `fingerprint()` returns `sha256(app_secret)[:8]` for safe diagnostics. `is_configured()` -> bool.
4. `app/main.py` lifespan startup -- log a clear WARN when `app_secret` is empty so the operator knows auth isn't ready.
5. `app/main.py` `/api/health` -- include `"app_fingerprint": "..."` when configured, else `null`.
6. `backend/.env.example` -- documents both vars + the `openssl rand -hex 32` generation snippet.
7. Smoke: import identity, generate two app_secrets via openssl-equivalent, confirm fingerprints differ; confirm null fingerprint when unset.
8. Restart backend, confirm /api/health surfaces the field, confirm live wars session survives.

## Actions
