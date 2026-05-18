# Watify — Multi-Agent Roles

Each agent is a *role* the loop iteration plays. Only one agent runs per iteration. The active role is set in `PIPELINE.md` → `agent:`.

Every iteration MUST:
1. Read `PIPELINE.md` to learn the current phase, agent, and next action.
2. Read `REQUIREMENTS.md` and `PLAN.md` for context.
3. Open a fresh conversation log at `docs/.support/conversations/<UTC-ISO>-<agent>-iter<N>.md` and append everything the agent observes, decides, and does.
4. Execute one substantive chunk of work — do not try to finish multiple phases in one iteration.
5. Update `PIPELINE.md` (phase, agent, iteration++, next action, history append).
6. If the agent created or transitioned tickets, list them in the log and in `PIPELINE.md`.

Tickets live in `docs/.support/tickets/TKT-<NNNN>-<slug>.md`. Status one of: `open | inprogress | resolved | verified`. Status is in YAML frontmatter; the file is renamed when status changes is **not** required — change the frontmatter only.

---

## Planning Agent
**Trigger**: First iteration (`phase: planning`).

**Job**: Read `REQUIREMENTS.md` → produce `PLAN.md` with a numbered, dependency-ordered work list partitioned by Backend vs Frontend. Each item has an ID (e.g. `B-01`, `F-03`), a one-line description, and acceptance criteria.

**Done when**: `PLAN.md` is populated; `PIPELINE.md.phase` advances to `scaffold`.

---

## Backend Agent
**Trigger**: `phase: backend` or `phase: scaffold` with backend item next on PLAN.

**Stack rules**:
- Python 3.13+, dependencies via `uv` (`pyproject.toml`, `uv.lock`).
- FastAPI, SQLAlchemy 2 (or SQLModel), Pydantic v2, APScheduler with SQLAlchemyJobStore on `app.db`.
- `wars` library — file-backed session at `backend/whatsapp.db`. Singleton WhatsApp client (one process only, see wars.md §7).
- Server entry: `uv run uvicorn app.main:app --reload --port 8000`.
- Endpoints under `/api/*`, CORS allowlists `http://localhost:3000`.

**Job**: Implement next backend item from `PLAN.md`. Mark item done in `PLAN.md`.

---

## Frontend Agent
**Trigger**: `phase: frontend` or `phase: scaffold` with frontend item next on PLAN.

**Stack rules**:
- Next.js latest (App Router), TypeScript, Tailwind CSS.
- Scaffold via `npx create-next-app@latest frontend --ts --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm`.
- Dev server: `npm run dev` on port 3000.
- API base URL via `NEXT_PUBLIC_API_BASE=http://localhost:8000`.
- Pages: `/` (dashboard), `/connect` (QR pairing), `/groups` (friend lists), `/send` (compose + schedule), `/history`.
- **No emojis in UI or code.**

**Job**: Implement next frontend item from `PLAN.md`. Mark item done in `PLAN.md`.

---

## Ticketing Agent
**Trigger**: `phase: ticketing` (after a scaffold pass or after a verification failure).

**Job**: 
- Start backend + frontend dev servers in background if not running (see `docs/.support/SERVERS.md`).
- Use Chrome MCP to navigate `http://localhost:3000` and exercise the implemented pages. Read network requests and console messages.
- Tail backend logs at `docs/.support/logs/backend.log`.
- For every bug / missing feature / regression, file a ticket with status `open`.

**Ticket file format** (`TKT-NNNN-slug.md`):
```yaml
---
id: TKT-0001
title: Short title
status: open      # open | inprogress | resolved | verified
priority: P0|P1|P2|P3
area: backend | frontend | infra
created: 2026-05-18T12:34:56Z
updated: 2026-05-18T12:34:56Z
created_by: ticketing_agent
related_plan_item: B-03
---

## Summary
What is wrong.

## Reproduction
1. Step
2. Step

## Expected
...

## Actual
...

## Logs / Evidence
Relevant excerpts.

## Resolution history
(append-only — Resolving Agent and Verification Agent update this)
```

**Done when**: Either all features pass and no new tickets are filed (advance to `phase: done`), or N>0 tickets are open (advance to `phase: resolving`).

---

## Resolving Agent
**Trigger**: `phase: resolving` and at least one `open` ticket exists.

**Job**: 
- Pick the highest-priority `open` ticket. Set its status to `inprogress`.
- Fix the root cause in code (backend or frontend as needed).
- Update the ticket's Resolution history with what was changed and which files.
- Set ticket status to `resolved`.
- Advance phase to `verification`.

**One ticket at a time.** Do not touch other tickets in the same iteration.

---

## Verification Agent
**Trigger**: `phase: verification`.

**Job**: 
- Take the most recent `resolved` ticket.
- Restart dev servers if backend code changed.
- Reproduce the original failure case via Chrome MCP + network/console reads.
- If the fix works:
  - Set ticket status to `verified`.
  - Stage the relevant files, commit with message `fix(TKT-NNNN): <title>`, push to origin.
  - If no more `open` or `resolved` tickets remain and all PLAN items are done, advance to `phase: done`.
  - Otherwise advance to `phase: ticketing` for another round.
- If the fix does **not** work:
  - Set ticket status back to `open`.
  - Append a "Verification failed" entry to Resolution history with what was observed.
  - Advance to `phase: ticketing` so Ticketing Agent can re-triage with the new evidence.

**Commit & push rule**: Only the Verification Agent commits. Only verified tickets are committed. Never commit `whatsapp.db`, `.env`, or anything in `.gitignore`.

---

## Conventions
- All timestamps: UTC ISO 8601.
- No emojis in any file the agents create.
- The loop stops when `PIPELINE.md.phase == done`.
- If an iteration cannot make progress (e.g. dev server won't start, Chrome MCP unreachable), the agent writes a `BLOCKED` entry in `PIPELINE.md.history` and a P0 ticket. The next iteration's first job is to unblock.
