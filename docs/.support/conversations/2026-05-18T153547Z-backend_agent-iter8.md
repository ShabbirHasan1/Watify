# Iteration 8 — Backend Agent (B-05)

- **Started**: 2026-05-18T15:35:47Z
- **Finished**: 2026-05-18T15:42:00Z
- **Phase**: scaffold (B-05)
- **Active agent**: backend_agent
- **PLAN item**: B-05 — wars singleton + WhatsApp connection endpoints

## Files created/modified
- `backend/app/whatsapp.py` — `WaSingleton` with `ClientState`, dedicated `wars-worker` thread, command queue, callbacks.
- `backend/app/routers/whatsapp.py` — `/api/wa/state`, `/api/wa/connect`, `/api/wa/disconnect`.
- `backend/app/main.py` — include `whatsapp.router`.
- `backend/pyproject.toml` / `uv.lock` — `wars==0.1.3`, plus `pillow==12.2.0` and `qrcode==8.2` as transitive deps.

## The PyO3 gotcha (first attempt failed)
Initial implementation built the `WhatsApp` instance on the FastAPI handler thread and called `connect()` from a spawned worker thread. wars panicked:

```
pyo3_runtime.PanicException: _wars::WhatsApp is unsendable,
but sent to another thread (left: ThreadId(5) right: ThreadId(4))
```

The PyO3 binding marks `WhatsApp` as `!Send` — every method call must come from the constructing thread. Refactored to a single long-lived `wars-worker` thread:
- Builds `WhatsApp(db_path)` and wires all three callbacks (`on_qr`, `on_connected`, `on_disconnect`) on that thread.
- Sits in a `queue.Queue` loop processing `connect` / `disconnect` / `send_self` / `send_to` commands.
- Callbacks fire from wars' internal Tokio thread; they only mutate `ClientState` under a state lock so they're not bound by the Send constraint.

Re-tested: QR appeared within ~4s. PASS.

## Decisions
- `disconnect()` optimistically flips state to `disconnected` synchronously in the API layer, then queues the actual `wars.disconnect()` to the worker. wars is idempotent and the user-visible state is immediate.
- Did not wire `on_pair_code` callback yet — phone-code auth is not a v1 UX goal; QR-only flow is sufficient. Will add when/if F-03 needs it.
- Owner phone resolution (`wa.owner` after pair) is not exposed yet — wars docs note it's read from the paired-device record, but the wars 0.1.3 binding API may need a follow-up. Filed as a future ticket idea; not blocking F-03 since QR is the primary connect UX.

## Acceptance
- `GET /api/wa/state` initially: `{state: "disconnected", qr_data_url: null}`.
- `POST /api/wa/connect`: returns `state: "pairing"`. Within 4s, `GET /api/wa/state.qr_data_url` is a `data:image/png;base64,...` URL.
- `POST /api/wa/disconnect`: returns `state: "disconnected"` immediately, `qr_data_url` cleared. State persists 1s later. PASS.
- `backend/whatsapp.db` (+ -shm/-wal) created locally on connect; covered by `.gitignore` (verified via `git check-ignore`). PASS.

## Backend
- Killed iter7 PID (39988). Restarted twice — first to land the worker-thread fix, second to land the optimistic-disconnect tweak. New PID 48980, recorded.

## Security audit notes (preview for Ticketing Agent)
- `whatsapp.db` is gitignored. PASS.
- `qr_data_url` is base64-encoded PNG inline in JSON — never written to disk by the backend. PASS.
- No phone numbers logged. `log.info("wars on_qr: state=pairing qr_len=%s", ...)` logs only the QR's base64 length, not the value. PASS.
- The wars session bytes (the wire keys) live ONLY in `whatsapp.db`. Never serialized into any conversation log or ticket.

## Commit
About to commit `feat(B-05): wars singleton + WhatsApp connection endpoints`.

## Next iteration
**Frontend Agent** runs F-03 (Connect page wired to /api/wa/state poll loop, QR image, Disconnect button).
