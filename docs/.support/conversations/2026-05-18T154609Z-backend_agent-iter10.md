# Iteration 10 — Backend Agent (B-06)

- **Started**: 2026-05-18T15:46:09Z
- **Finished**: 2026-05-18T15:49:00Z
- **Phase**: scaffold (B-06)
- **Active agent**: backend_agent
- **PLAN item**: B-06 — test message endpoints

## Files modified
- `backend/app/routers/whatsapp.py` — added `WaTestSelfRequest`, `WaTestToRequest`, `WaSendResult` schemas plus `POST /api/wa/test/self` and `POST /api/wa/test/to` endpoints. Both call `_require_ready()` which raises 409 `{error: "not_ready", state: ...}` when the wa singleton is not in `ready`.

## Send dispatch flow
1. Endpoint validates body + state.
2. For `/test/to`, phone is normalized through `app.jid.normalize_phone` (422 on invalid).
3. `WaSingleton.send_self(text)` / `WaSingleton.send_to(phone, text)` (defined in iter8) push a tuple onto the wars-worker command queue.
4. Worker thread pulls and calls `wa.send(text)` / `wa.send(phone, text)`.
5. Endpoint returns immediately with `{queued: true, target: "self"|"number", phone_redacted: "91XXXXXX3210"|null}`.

## Smoke results
| Case | Expected | Got |
|---|---|---|
| POST /test/self while disconnected | 409 not_ready | confirmed |
| POST /test/to while disconnected | 409 not_ready | confirmed |
| POST /test/self body `text=""` | 422 string_too_short | confirmed |
| `redact_phone("919876543210")` | `91XXXXXX3210` | confirmed |

Live-send path while `ready` cannot be smoke-tested without scanning the QR with a real phone, which is out of scope for this iteration.

## Backend
- Killed iter9 PID 48980, respawned. New PID 43712.

## Security audit notes (preview for Ticketing Agent)
- Endpoint never returns the full phone number in any field — only `phone_redacted`. PASS.
- Send payload (text) is never logged (only the routing decision is in the access log). PASS.
- `_require_ready()` is the single ready-gate; state check is atomic via `WaSingleton.snapshot()`. PASS.
- 409 detail uses dict; per the still-open structural ticket idea about flat error shapes (`{detail: {error, ...}}` vs `{error, ...}`), leave for Ticketing.

## Commit
About to commit `feat(B-06): test message endpoints (send-to-self, send-to-number)`.

## Next iteration
**Frontend Agent** runs F-04 (Groups page: list, create, drill-in, contact CRUD with 20-cap, bulk modal).
