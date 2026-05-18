# Dev Server Management

The Ticketing Agent and Verification Agent need backend + frontend running. Both start in the background of the loop iteration that needs them; logs go to `docs/.support/logs/`.

## Backend
- Cwd: `backend/`
- Start: `uv run uvicorn app.main:app --reload --port 8000 > ../docs/.support/logs/backend.log 2>&1`
- Health: `GET http://localhost:8000/api/health` returns `{"ok": true}`.
- Stop: kill PID from `docs/.support/logs/backend.pid`.

## Frontend
- Cwd: `frontend/`
- Start: `npm run dev > ../docs/.support/logs/frontend.log 2>&1`
- Health: `GET http://localhost:3000/` returns 200.
- Stop: kill PID from `docs/.support/logs/frontend.pid`.

## Rules
- Before starting, check the health endpoint. If it answers, do not relaunch — reuse.
- After a backend code change, the Verification Agent restarts the backend.
- Frontend dev server hot-reloads; only restart if `package.json` changed.
- One process per service. If a port is in use by something else, file a P0 ticket and BLOCK.
