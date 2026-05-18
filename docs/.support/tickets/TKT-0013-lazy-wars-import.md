---
id: TKT-0013
title: Backend should boot even if the wars wheel is missing
status: verified
priority: P2
area: backend
created: 2026-05-18T17:29:25Z
updated: 2026-05-18T18:21:57Z
created_by: ticketing_agent
related_plan_item: B-05, I-04
filed_via: gap_analysis
---

## Summary
`backend/app/whatsapp.py` imports `from wars import WhatsApp, qr_to_data_url` at module top. If the wars wheel is missing or fails to build (Rust toolchain, maturin, platform mismatch), the entire FastAPI app fails to boot -- the operator gets a stack trace and no /api/health, no /api/groups, nothing.

openalgo handles this with a lazy `_import_wars()` helper raising a `WarsNotInstalled` sentinel; the rest of the Flask app boots and the /whatsapp UI surfaces a friendly install hint.

## Reference
`docs/.support/openalgo/services/whatsapp_bot_service.py` lines 224-239:
```python
class WarsNotInstalled(RuntimeError):
    def __init__(self) -> None:
        super().__init__(
            "wars package is not installed. Run `uv sync` or `uv pip install wars` "
            "to enable the WhatsApp integration."
        )

def _import_wars():
    try:
        import wars
        return wars
    except Exception as e:
        raise WarsNotInstalled() from e
```

## Expected
- `app/whatsapp.py` exposes the same `WarsNotInstalled` sentinel + `_import_wars()` helper.
- `WaSingleton._worker_loop` and `WaSingleton._build` call `_import_wars()` inside, not at module top.
- `app/routers/whatsapp.py` catches `WarsNotInstalled` and returns a clear 503 (`{"error":"wars_not_installed","detail":"..."}`).
- Frontend `/connect` page renders the install hint when state stays disconnected and `last_error == "wars_not_installed"`.

## Fix sketch
- Move `from wars import WhatsApp, qr_to_data_url` out of module scope into `_import_wars()`.
- Routers wrap calls to `WaSingleton.connect()` in `try/except WarsNotInstalled`.
- Add `last_error = "wars_not_installed: <pip install instructions>"` propagation.

## Resolution history
- 2026-05-18T17:29:25Z -- filed by Ticketing Agent (iter32).
- 2026-05-18T18:17:32Z -- Resolving Agent (iter42) set status to inprogress.
- 2026-05-18T18:19:00Z -- Resolving Agent (iter42) shipped lazy wars import in `backend/app/whatsapp.py`:
  - **`WarsNotInstalled(RuntimeError)`** sentinel with the friendly install hint as its message; preserves the original ImportError as `__cause__` for debugging.
  - **`_import_wars()`** helper with module-level cache + threading lock. Two-level cache (`_wars_module` on success, `_wars_attempt_failed` on permanent failure so we don't retry on every connect call). RUST_LOG `setdefault` from TKT-0012 moved here so it stays paired with the import attempt.
  - Module-top `from wars import WhatsApp, qr_to_data_url` replaced with a `TYPE_CHECKING` block (type-only). All runtime callers grab the module via `_import_wars()` and use `wars.WhatsApp(...)` / `wars.qr_to_data_url(...)`.
  - `_worker_loop` outer try now catches `WarsNotInstalled` distinctly and sets state to `error` with `last_error="wars_not_installed: <hint>"` so the frontend ErrorPanel surfaces the fix instead of crashing the worker.
  - `backend/scripts/pair.py` updated to use the same `_import_wars()` path; prints the error message and exits 3 on missing wheel.

  Verified via three sanity checks:
  1. With `sys.meta_path` blocking `wars`, `import app.whatsapp` SUCCEEDS (the FastAPI app would boot).
  2. Calling `_import_wars()` then raises `WarsNotInstalled` with the friendly message.
  3. In the live env (wars 0.1.3 present), `_import_wars()` loads + caches; second call is a cache hit.

  `py_compile app/whatsapp.py scripts/pair.py` clean. Backend NOT restarted (live session preserved); Verification Agent will respawn to confirm normal pair path still works and try a wars-blocked launch.

  Status set to `resolved`.
- 2026-05-18T18:21:57Z -- Verification Agent (iter43) PASSED:
  1. Backend restart with live wars 0.1.3 present: `wars module loaded lazily (version=0.1.3)` logged at boot, followed by `encrypted mode -- booting from WaSession row (499712B plaintext, in-memory)` and `on_connected: state=ready`. Pair-from-blob path unchanged.
  2. Shadow-import (wars blocked via `sys.meta_path` ImportError): `import app.whatsapp` succeeded. `_import_wars()` raised `WarsNotInstalled` with the friendly install hint. A second call short-circuited via the cached-failure path -- no retry storm.
  3. All 5 frontend routes still HTTP 200.
  Status set to `verified`. Committed `fix(TKT-0013): lazy wars import + WarsNotInstalled sentinel` and pushed.
