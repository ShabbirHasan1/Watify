---
id: TKT-0003
title: Add top-level dev helper scripts (I-02)
status: open
priority: P2
area: infra
created: 2026-05-18T16:14:48Z
updated: 2026-05-18T16:14:48Z
created_by: ticketing_agent
related_plan_item: I-02
---

## Summary
Currently the only way to run Watify is to recall the exact uv / npm commands. The dev servers should be one-liners.

## Expected
Top-level PowerShell scripts (Windows is primary) and a `Makefile` (POSIX fallback):

- `scripts/dev-backend.ps1` -> `uv run uvicorn app.main:app --reload --port 8000`
- `scripts/dev-frontend.ps1` -> `npm run dev`
- `scripts/pair.ps1` -> calls the wars CLI pair script
- `Makefile` mirrors for POSIX shells

Update README to point at them.

## Resolution history
- 2026-05-18T16:14:48Z — filed by Ticketing Agent (iter16).
