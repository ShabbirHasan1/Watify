---
id: TKT-0004
title: Expand README with local-run instructions (I-03)
status: open
priority: P2
area: infra
created: 2026-05-18T16:14:48Z
updated: 2026-05-18T16:14:48Z
created_by: ticketing_agent
related_plan_item: I-03
---

## Summary
`README.md` is bootstrap-era; should cover:
- Prereqs (Python 3.13+ via `uv`, Node 20+).
- Setup: `cp backend/.env.example backend/.env`, `uv sync`, `npm install`.
- Run: backend + frontend commands (or the scripts from TKT-0003 once they land).
- Pair flow: visit /connect, scan QR.
- Where data lives: `backend/app.db`, `backend/whatsapp.db`, `docs/.support/logs/`.
- Pointer to `docs/.support/REQUIREMENTS.md` for the contract and `docs/.support/AGENTS.md` for how the loop builds the app.

## Resolution history
- 2026-05-18T16:14:48Z — filed by Ticketing Agent (iter16).
