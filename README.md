# Watify

Single-user WhatsApp notification service for sending messages to curated friend watchlists.

Built by a multi-agent loop. Pipeline state and ticket trail live in `docs/.support/`.

## Stack
- Backend: Python 3.13+, FastAPI, SQLite, APScheduler, `wars` (WhatsApp client).
- Frontend: Next.js (latest, App Router), TypeScript, Tailwind.
- Tooling: `uv` for Python, `npm` for Node.

## Status
Bootstrapping. See `docs/.support/PIPELINE.md` for the current phase.

## Local run (once the loop scaffolds it)
```bash
# Backend
cd backend && uv sync && uv run uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:3000.

## Disclaimer
Uses the unofficial `wars` WhatsApp client. See `docs/wars.md` for the supply-chain and risk notes. Personal/low-volume usage only.
