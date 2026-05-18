# Iteration 42 — Resolving Agent (TKT-0013)

- **Started**: 2026-05-18T18:17:32Z
- **Phase**: resolving
- **Active agent**: resolving_agent
- **Ticket**: TKT-0013 (P2 backend) -- lazy wars import + WarsNotInstalled sentinel

## Plan
1. Mark TKT-0013 `inprogress`.
2. `backend/app/whatsapp.py`:
   - Add `WarsNotInstalled(RuntimeError)` sentinel with a friendly message.
   - Add `_import_wars()` helper: caches the imported module, sets `RUST_LOG` (the existing setdefault from TKT-0012 moves here so it stays paired with the wars import), raises `WarsNotInstalled` if the wheel is missing or fails to build.
   - Replace the module-top `from wars import WhatsApp, qr_to_data_url` with a `TYPE_CHECKING` block for type hints. Runtime callers grab the module via `_import_wars()`.
   - `_build_wa` and the `_worker_loop` callbacks use the cached module reference.
   - On `WarsNotInstalled` inside the worker, set state to `error` with `last_error="wars_not_installed: <install hint>"` so the frontend ErrorPanel surfaces the fix.
3. `backend/scripts/pair.py`: wrap the import in the same lazy pattern with a clear stderr message + non-zero exit.
4. `py_compile`. Backend NOT restarted (live session preserved).
5. Mark TKT-0013 `resolved`.

## Actions
