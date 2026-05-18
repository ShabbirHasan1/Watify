---
id: TKT-0001
title: Standardize API error response shape
status: verified
priority: P2
area: backend
created: 2026-05-18T16:14:48Z
updated: 2026-05-18T17:12:13Z
created_by: ticketing_agent
related_plan_item: B-03, B-04, B-06, B-07
---

## Summary
Error responses come back wrapped under FastAPI's default `{"detail": ...}` envelope. When the handler uses a dict payload (group_full, bulk_rejected, not_ready), the client has to read `body.detail.error` rather than `body.error`. REQUIREMENTS S2 calls for "All API request/response bodies are typed Pydantic models" — the error shape is currently inconsistent across endpoints.

## Reproduction
```
POST /api/groups/1/contacts (21st contact)
-> 409 {"detail": {"error": "group_full", "max": 20}}

POST /api/wa/test/self while disconnected
-> 409 {"detail": {"error": "not_ready", "state": "disconnected"}}

POST /api/groups/{id}/contacts/bulk with one bad row
-> 422 {"detail": {"error": "bulk_rejected", "reasons": [...]}}
```

## Expected
A flat, predictable error envelope, e.g.:
```
{"error": "group_full", "detail": "...", "max": 20}
```
matching the `ApiError` Pydantic model already defined in `app/schemas.py`. Frontend `ApiError` parsing simplifies.

## Actual
FastAPI's `HTTPException.detail` is rendered under a `detail` key. Frontend has to peek into `e.body.detail.error`.

## Fix sketch
- Register a `@app.exception_handler(HTTPException)` that, when `exc.detail` is a dict, returns it as the top-level body and adds an `error` shim if missing.
- Or replace `raise HTTPException(409, detail={...})` calls with explicit `JSONResponse({...}, status_code=409)`.
- Update `BulkAddModal` and other frontend handlers to read the flat shape.

## Resolution history
- 2026-05-18T16:14:48Z — filed by Ticketing Agent (iter16).
- 2026-05-18T17:07:49Z — Resolving Agent (iter27) set status to inprogress.
- 2026-05-18T17:09:30Z — Resolving Agent (iter27) shipped:
  - `backend/app/main.py` — new `@app.exception_handler(StarletteHTTPException)` flattens:
    - dict detail -> dict body with `error` defaulted to `"http_error"`.
    - string detail -> `{"error": detail, "detail": detail}` (keeps back-compat).
    - other -> `{"error": "http_error", "detail": detail}`.
    RequestValidationError (Pydantic 422) is left to FastAPI's default per design.
  - `frontend/src/components/groups/BulkAddModal.tsx` — reads `body.reasons` directly instead of `body.detail.reasons`.
  - `frontend/src/app/send/page.tsx` — 422 branch simplified to use `e.message` (api.ts already extracts the flat `error` key into the message).

  Smoke (5 paths, backend pid 43260):
  | Case | Body |
  |---|---|
  | 404 group_not_found | `{"error":"group_not_found","detail":"group_not_found"}` |
  | 409 group_full | `{"error":"group_full","max":20}` |
  | 422 bulk_rejected | `{"error":"bulk_rejected","reasons":[{"index":1,"reason":"..."}]}` |
  | 409 not_ready | `{"error":"not_ready","state":"disconnected"}` |
  | 422 Pydantic validation | `{"detail":[{"type":"string_too_short",...}]}` (unchanged) |

  All 5 frontend routes recompiled clean and serve HTTP 200.

  Status set to `resolved`; awaiting Verification Agent.
- 2026-05-18T17:12:13Z — Verification Agent (iter28) PASSED with independent assert-based reproduction:
  - GET `/api/groups/99999` -> 404 `{"error":"group_not_found","detail":"group_not_found"}`.
  - 21st contact POST -> 409 `{"error":"group_full","max":20}`.
  - bulk with bad row -> 422 `{"error":"bulk_rejected","reasons":[{"index":1,"reason":"phone must be 6-15 digits..."}]}`.
  - `/api/wa/test/self` while not-ready -> 409 `{"error":"not_ready","state":"pairing"}` (state value is dynamic, envelope is exact).
  - Pydantic `text=""` -> 422 `{"detail":[{"type":"string_too_short",...}]}` (unchanged by design).
  - All 5 frontend routes still HTTP 200.
  Status set to `verified`. Committed `fix(TKT-0001): flat error envelope on HTTPException` and pushed.
