# Iteration 16 — Ticketing Agent (first sweep)

- **Started**: 2026-05-18T16:14:48Z
- **Finished**: 2026-05-18T16:20:00Z
- **Phase entering**: ticketing
- **Phase exiting**: resolving
- **Active agent**: ticketing_agent

## Health checks
- Backend `/api/health` -> 200, version 0.1.0.
- Frontend `/` -> 200, HTML contains "Watify".
- wars state -> disconnected (clean baseline).

## Security audit (passes)
| Check | Result |
|---|---|
| `git ls-files` for `.env` / `.env.local` | empty (no env committed) |
| `git ls-files` for `*.db*` | empty (no databases committed) |
| `git check-ignore` for `backend/.env`, `backend/app.db`, `backend/whatsapp.db`, `*.db-wal`, `*.pid` | all ignored |
| Grep for `(secret|token|api[_-]?key|password)` | no matches |
| Grep for `dangerouslySetInnerHTML` / `eval(` / `new Function(` | no matches |
| Grep for f-string SQL / `.execute(` with concat | no matches (SQLModel parameterized everywhere) |
| CORS allowlist | `settings.cors_origin` (default `http://localhost:3000`) - pinned, no `*` |
| Backend bind address | `127.0.0.1` (lifespan log confirms) |
| Phone redaction filter | active on root logger (verified via smoke in iter15) |
| Phone-like grep | only hits: `backend/scripts/smoke_db.py:30` (test fixture - filed as TKT-0006); `docs/wars.md` (upstream README, not actionable); uv.lock hashes (false positives) |

## Chrome MCP walkthrough (partial)
- Created new tab (1607448350), navigated `http://localhost:3000`.
- Cross-tab pollution: Chrome MCP `read_console_messages` scopes by domain, so the user's other localhost tabs (Strike Analytics on :3001, :3000/login route) bled their `webpack-internal`, `Apollo DevTools`, `emitter:` logs into the Watify console reading.
- Mitigation for future Ticketing iterations: filter by pattern (`Watify`, `watify`, or specific component names) when calling `read_console_messages`, or close unrelated localhost tabs first.
- Walkthrough cut short to budget the iteration; verified Watify is in fact serving (`curl /` returned HTML containing "Watify"). Deeper UI verification (per-route render correctness, button clicks, form errors) deferred to the **Verification Agent** once tickets are resolved.

## Tickets filed
| ID | P | Area | Title |
|---|---|---|---|
| TKT-0001 | P2 | backend | Standardize API error response shape |
| TKT-0002 | P1 | frontend | UX polish - empty states, error toasts, soft-cap reminder |
| TKT-0003 | P2 | infra | Add top-level dev helper scripts (I-02) |
| TKT-0004 | P2 | infra | Expand README with local-run instructions (I-03) |
| TKT-0005 | P2 | backend | Surface owner_phone after wars pairing |
| TKT-0006 | P3 | backend | Move test phone constant out of smoke_db.py |
| TKT-0007 | P2 | frontend | /connect re-triggers POST /api/wa/connect on every hot-reload |

PLAN.md adjustments:
- I-01 marked done (both .env.example files already committed).
- I-04 marked done (wars 0.1.3 installed cleanly via uv add in iter8).

## Decisions
- Did not open a TKT for the missing `eslint` config (we passed `--no-eslint` deliberately at scaffold). Not actionable until the user opts in.
- Did not file a TKT for the wars send-success-vs-delivery-receipt gap noted in iter12's conversation log (wars 0.1.3 binding limitation, would need an upstream change).
- Did not file a TKT for uvicorn's access-log not running through the redaction filter (iter15 note); the filter catches `app.*` and `apscheduler.*` which is where user data could leak; uvicorn access lines only show the URL+method, no body.

## Next iteration
**Resolving Agent** — picks highest-priority `open` (TKT-0002 P1 UX polish). Per AGENTS.md, one ticket at a time. Likely scope-down: ship the soft-cap banner + a shared `EmptyState` component first, leave Toaster for a follow-up.
