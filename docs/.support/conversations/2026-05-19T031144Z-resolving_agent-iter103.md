# Iteration 103 -- Resolving Agent (TKT-0053 + TKT-0055 bundled)

- **Started**: 2026-05-19T03:11:44Z
- **Phase**: resolving (bundled with verification, operator-directive)
- **Active agent**: resolving_agent + verification_agent

## Tickets
- TKT-0053 (P2 backend+frontend) -- Unlink action that wipes session
- TKT-0055 (P3 frontend) -- test message timestamp local, not UTC (operator follow-up)

## Actions

1. **Backend WaSingleton.unlink()** added at `backend/app/whatsapp.py`. Stops the worker via "stop" command + `_worker.join(timeout=5s)`, clears `_worker = None` so the next `connect()` builds fresh, calls `session_crypto.clear_session()` on the encrypted wa_session row, sweeps legacy `whatsapp.db*` via `_delete_legacy_wa_db_files()`, and resets in-memory state (owner_phone cleared so dashboard does not show stale "Linked as ..."). Disconnect was also tightened to clear `owner_phone`.
2. **Backend route `POST /api/wa/unlink`** added at `backend/app/routers/whatsapp.py`. Auth + CSRF gated (inherits the global middleware stack). Returns the post-unlink WaState.
3. **Frontend api.ts** -- `wa.unlink()` helper.
4. **Frontend useWaState** -- `unlink()` method posts to `/api/wa/unlink`, mutates the SWR cache with the fresh state, fires `toast.success("Device unlinked. Session wiped.")`.
5. **Frontend connect/page.tsx ReadyPanel** -- new red-outlined "Unlink" button next to Disconnect. `handleUnlink()` confirms via `window.confirm`, sets AUTO_FLAG to suppress auto-pair, calls the hook's `unlink()`. ReadyPanel signature extended with `onUnlink: () => void`.
6. **TKT-0055 timestamp fix** -- `handleTestSelf` swapped `new Date().toISOString().replace("T"," ").slice(0,19)` + " UTC" for `new Date().toLocaleString()`. History page timestamps already used `toLocaleString` so no change there. The `send/page.tsx:83` `toISOString()` is the API-bound schedule field and stays UTC.
7. py_compile clean on whatsapp.py + routers/whatsapp.py; tsc --noEmit exit 0; restarted backend pid 51348; `POST /api/wa/unlink` no-cookie -> 401 confirming the route is wired and auth-gated.

## Outcome
TKT-0053 + TKT-0055 verified and bundled into one commit. Pipeline back to ticketing; TKT-0052 (delivery status tracking) remains the only open ticket.
