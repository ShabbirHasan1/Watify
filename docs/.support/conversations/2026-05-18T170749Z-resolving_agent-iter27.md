# Iteration 27 — Resolving Agent (TKT-0001)

- **Started**: 2026-05-18T17:07:49Z
- **Finished**: 2026-05-18T17:10:00Z
- **Phase entering**: resolving
- **Phase exiting**: verification
- **Active agent**: resolving_agent
- **Ticket**: TKT-0001 (P2 backend) — flatten API error response shape

## Files modified
- `backend/app/main.py` — new `@app.exception_handler(StarletteHTTPException)` registered before the `Exception` catch-all. Maps:
  - dict detail -> dict body with `error` defaulted to `"http_error"` if missing.
  - string detail -> `{"error": detail, "detail": detail}` (back-compat).
  - any other -> `{"error": "http_error", "detail": detail}`.
  Preserves `exc.headers` (e.g. for 401 WWW-Authenticate). Does NOT touch `RequestValidationError`; Pydantic 422 keeps its per-field detail array.
- `frontend/src/components/groups/BulkAddModal.tsx` — reads `e.body.reasons` directly. Old `e.body.detail.reasons` indirection removed.
- `frontend/src/app/send/page.tsx` — 422 branch now relies on `e.message` (api.ts pulls the flat `error` key into the message).

## Smoke evidence (backend pid 43260)
| Path | Body |
|---|---|
| GET /api/groups/99999 -> 404 | `{"error":"group_not_found","detail":"group_not_found"}` |
| POST 21st contact -> 409 | `{"error":"group_full","max":20}` |
| POST bulk with one bad row -> 422 | `{"error":"bulk_rejected","reasons":[{"index":1,"reason":"phone must be 6-15 digits..."}]}` |
| POST /api/wa/test/self while disconnected -> 409 | `{"error":"not_ready","state":"disconnected"}` |
| POST /api/wa/test/self body text="" -> 422 | `{"detail":[{"type":"string_too_short",...}]}` (unchanged) |

All 5 frontend routes still HTTP 200 after edits (`/`, `/connect`, `/groups`, `/send`, `/history`).

## Decisions / Notes
- Pydantic validation errors deliberately keep their original shape. They are per-field arrays with `type`, `loc`, `msg` keys that the frontend can render verbatim; flattening would lose structure.
- The `detail` key is kept on the string-detail path so callers that still read `e.body.detail` (or that look at FastAPI docs) keep working. New code should prefer `e.body.error`.

## Ticket transition
- TKT-0001: `open` -> `inprogress` -> `resolved`.

## Next iteration
**Verification Agent** runs TKT-0001. On pass: commit `fix(TKT-0001): flat error envelope on HTTPException`, push.
