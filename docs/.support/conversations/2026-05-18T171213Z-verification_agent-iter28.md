# Iteration 28 — Verification Agent (TKT-0001)

- **Started**: 2026-05-18T17:12:13Z
- **Finished**: 2026-05-18T17:14:00Z
- **Phase entering**: verification
- **Phase exiting**: ticketing
- **Active agent**: verification_agent
- **Ticket under test**: TKT-0001

## Result: PASS

## Independent assert-based reproduction
Each case constructs the request from Python and asserts the response shape, not just status.

| Case | Expected envelope | Got | Result |
|---|---|---|---|
| GET /api/groups/99999 | error=`group_not_found`, detail=`group_not_found` | 404 `{"error":"group_not_found","detail":"group_not_found"}` | PASS |
| 21st contact insert | error=`group_full`, max=20 | 409 `{"error":"group_full","max":20}` | PASS |
| bulk w/ bad row at index 1 | error=`bulk_rejected`, reasons list with index=1 | 422 `{"error":"bulk_rejected","reasons":[{"index":1,...}]}` | PASS |
| /api/wa/test/self when not ready | error=`not_ready`, state in {disconnected,pairing} (not `ready`) | 409 `{"error":"not_ready","state":"pairing"}` | PASS |
| Pydantic text="" | detail=list, no `error` key | 422 `{"detail":[{"type":"string_too_short",...}]}` | PASS (shape preserved) |

The wars singleton state was `pairing` (not `disconnected`) at the time of case 4 because of Fast Refresh activity in another tab earlier; the envelope shape and `error` key are exact. The relaxed assertion accepts any non-`ready` value for `state`.

## Frontend
All 5 routes still HTTP 200 (Dashboard, /connect, /groups, /send, /history).

## Ticket transition
- TKT-0001 -> `verified`.

## Commit + push
About to commit `fix(TKT-0001): flat error envelope on HTTPException`.

## Next iteration
Per PIPELINE: **Resolving Agent** on **TKT-0008** (global Toaster).
