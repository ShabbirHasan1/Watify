# Iteration 44 — Resolving Agent (TKT-0015)

- **Started**: 2026-05-18T18:26:50Z
- **Phase**: resolving
- **Active agent**: resolving_agent
- **Ticket**: TKT-0015 (P2 backend) -- rate-limit middleware on send endpoints

## Plan
1. Mark TKT-0015 `inprogress`.
2. `uv add slowapi`.
3. `app/settings.py` adds three env-overridable limit strings:
   - `rate_limit_test_self: str = "15/minute"`
   - `rate_limit_test_to: str = "10/minute"`
   - `rate_limit_send: str = "5/minute"`
4. `app/main.py`: install slowapi `Limiter` + custom 429 handler returning the flat envelope `{"error":"rate_limited", "detail": "...", "retry_after": N}` (TKT-0001 shape).
5. Decorate three handlers: `POST /api/wa/test/self`, `POST /api/wa/test/to`, `POST /api/send`. Each handler gets `request: Request` so slowapi can key by remote IP.
6. `backend/.env.example` documents the new env names.
7. `py_compile` + restart, smoke with a curl-storm to one endpoint.
8. Mark TKT-0015 `resolved`.

## Actions
