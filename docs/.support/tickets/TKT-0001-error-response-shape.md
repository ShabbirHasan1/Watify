---
id: TKT-0001
title: Standardize API error response shape
status: open
priority: P2
area: backend
created: 2026-05-18T16:14:48Z
updated: 2026-05-18T16:14:48Z
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
