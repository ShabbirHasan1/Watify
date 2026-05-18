# Iteration 49 — Resolving Agent (TKT-0023)

- **Started**: 2026-05-18T18:50:59Z
- **Phase**: resolving
- **Active agent**: resolving_agent
- **Ticket**: TKT-0023 (P1 backend) -- Single-user auth model

## Plan
1. Mark TKT-0023 `inprogress`.
2. `uv add argon2-cffi` (smaller surface than passlib, no plaintext-in-memory risk via legacy hashers).
3. `app/models.py` -- add `User` SQLModel singleton (id=1).
4. `app/auth_crypto.py` -- `hash_password`, `verify_password`, `generate_refresh_secret` (+ `ArgonError` sentinel for callers).
5. `app/auth_repo.py` -- DAO: `count_users`, `create_admin`, `get_user`, `rotate_refresh_secret`, `touch_last_login`.
6. `backend/scripts/smoke_auth.py` -- round-trip: hash + verify (good and bad), create_admin once, second create raises, count_users == 1, rotate_refresh_secret changes the value.
7. py_compile + run smoke.
8. Mark resolved.

## Actions
