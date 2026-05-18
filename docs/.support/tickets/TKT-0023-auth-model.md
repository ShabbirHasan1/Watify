---
id: TKT-0023
title: Single-user auth model (User table + argon2 + register-once lock)
status: verified
priority: P1
area: backend
created: 2026-05-18T18:41:55Z
updated: 2026-05-18T18:55:29Z
created_by: ticketing_agent
related_plan_item: B-09, A1, A2, A8
filed_via: human_manual_input
---

## Summary
Backend foundation for v1.1 auth. Adds the singleton `User` SQLModel, argon2 password hashing, and the register-once-lock helper that the auth endpoints will call.

## Expected
- `uv add argon2-cffi`.
- `app/models.py` adds:
  ```python
  class User(SQLModel, table=True):
      id: int | None = Field(default=1, primary_key=True)  # singleton: only id=1
      username: str = Field(unique=True, index=True, min_length=1, max_length=80)
      password_hash: str  # argon2 ($argon2id$...)
      refresh_secret: str  # bytes -> base64; rotated on logout
      created_at: datetime = Field(default_factory=_now)
      last_login_at: datetime | None = None
  ```
- `app/auth_crypto.py` (or extend `session_crypto.py`):
  - `hash_password(plain: str) -> str` -- argon2id, default time_cost/memory/parallelism.
  - `verify_password(plain: str, hashed: str) -> bool`.
  - `generate_refresh_secret() -> str` -- 32 random bytes -> base64.
- `app/auth_repo.py` thin DAO with:
  - `count_users(session) -> int`
  - `create_admin(session, username, password) -> User`
  - `get_user(session, username) -> User | None`
  - `rotate_refresh_secret(session, user) -> None`
  - `touch_last_login(session, user) -> None`
- Unit/smoke script `backend/scripts/smoke_auth.py` round-trips: hash + verify (good and bad), create_admin once, second create raises, count_users == 1.

Does NOT yet wire any endpoint -- that lands in TKT-0024.

## Resolution history
- 2026-05-18T18:41:55Z -- filed by Ticketing Agent (iter47, human input).
- 2026-05-18T18:50:59Z -- Resolving Agent (iter49) set status to inprogress.
- 2026-05-18T18:53:30Z -- Resolving Agent (iter49) shipped:
  - `uv add argon2-cffi` (argon2-cffi 25.1.0 + bindings).
  - `app/models.py` adds `User` singleton (`id=1`, UNIQUE `username`, `password_hash` argon2id, `refresh_secret` 32-byte url-safe base64, `created_at`, `last_login_at`).
  - `app/auth_crypto.py`:
    - `hash_password(plain) -> argon2id string` via `PasswordHasher().hash()`.
    - `verify_password(plain, stored) -> bool` -- `VerifyMismatchError` returns False, `InvalidHashError`/`VerificationError` raise `AuthCryptoError`.
    - `needs_rehash(stored)` for future parameter upgrades.
    - `generate_refresh_secret()` -- 32-byte url-safe base64.
  - `app/auth_repo.py`:
    - `count_users`, `get_user`, `get_singleton`.
    - `create_admin(username, password)` -- raises `RegistrationClosed` on second call. Caller commits.
    - `verify_credentials(username, password)` -- timing-safe (runs a dummy verify on unknown-username to keep response latency roughly constant).
    - `rotate_refresh_secret`, `touch_last_login`.
  - `backend/scripts/smoke_auth.py` -- 9 assertions, all pass:
    - argon2id round-trip good/bad.
    - refresh secret entropy.
    - create_admin once -> id=1 with 97-char hash.
    - second create raises `RegistrationClosed`.
    - `verify_credentials` happy / wrong-password / unknown-user (timing padded).
    - `rotate_refresh_secret` changes the value.
    - `touch_last_login` sets timestamp.
    - cleanup leaves table empty.

  Backend NOT restarted -- the live wars singleton is untouched. The new `user` table was created in `app.db` via the smoke's `init_db()` call. No production code consumes the model yet (TKT-0024 wires the endpoints).

  Status set to `resolved`. Awaiting Verification Agent.
- 2026-05-18T18:55:29Z -- Verification Agent (iter50) PASSED across 5 checks:
  1. `scripts/smoke_auth.py` re-ran -- 9/9 assertions PASS (hash round-trip, entropy, create+lock, verify good/bad/unknown timing-padded, rotate, touch, cleanup).
  2. `app.db` table list now includes `user` alongside the 6 existing tables.
  3. Public symbols importable: `auth_crypto` 5/5 (`hash_password`, `verify_password`, `needs_rehash`, `generate_refresh_secret`, `AuthCryptoError`); `auth_repo` 8/8 (`count_users`, `get_user`, `get_singleton`, `create_admin`, `verify_credentials`, `rotate_refresh_secret`, `touch_last_login`, `RegistrationClosed`).
  4. Live wars singleton untouched: `state == ready`.
  5. All 5 frontend routes still HTTP 200.
  Status set to `verified`. Committed `fix(TKT-0023): single-user auth model` and pushed.
