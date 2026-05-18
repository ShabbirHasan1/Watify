# Iteration 95 -- Resolving Agent (TKT-0006)

- **Started**: 2026-05-18T22:48:29Z
- **Phase**: resolving
- **Active agent**: resolving_agent
- **Ticket**: TKT-0006 (P3 backend) -- move test phone constant out of smoke_db.py

## Observed state on entry
Working tree has un-ticketed in-session edits from the operator's direct requests:
- `frontend/src/components/groups/BulkAddModal.tsx` -- placeholder strings `Alice/Bob` -> `Priya/Arjun`
- `frontend/src/app/groups/page.tsx` -- placeholder `Alice` -> `Priya`
- `frontend/src/lib/api.ts` -- added `WaSendResult` type + `wa.testSelf(text)` helper
- `frontend/src/app/connect/page.tsx` -- new "Test connection" button on the ReadyPanel
- `docs/.support/PIPELINE.md` -- iter94 update

These are not part of TKT-0006. They'll be filed as TKT-0037 (placeholder names) and TKT-0038 (test-connection button) by the next Ticketing iteration, so the Verification Agent can commit them under proper ticket fixes rather than slipping them into TKT-0006's narrow commit.

## Plan
1. Create `backend/scripts/_fixtures.py` (new) with `TEST_PHONE_E164` constant (E.164 form), plus a bare-digits derivative `TEST_PHONE_E164_DIGITS` for the smoke's existing call shape.
2. Edit `backend/scripts/smoke_db.py:30` to import the bare-digits form.
3. `uv run python -m py_compile` clean on both files.
4. Smoke `uv run python scripts/smoke_db.py` -- should run without error and print the fixture contact.
5. File TKT-0037 + TKT-0038 separately AFTER marking TKT-0006 resolved, so the queue carries the un-ticketed UX work explicitly.

## Actions

1. Marked TKT-0006 `inprogress`.
2. Wrote `backend/scripts/_fixtures.py` with module docstring + `TEST_PHONE_E164` + `TEST_PHONE_E164_DIGITS`.
3. Edited `backend/scripts/smoke_db.py`: added `from scripts._fixtures import TEST_PHONE_E164_DIGITS` at line 14; swapped inline `"911234567890"` at line 30 for the constant.
4. `uv run python -m py_compile scripts/_fixtures.py scripts/smoke_db.py` -> clean.
5. `uv run python scripts/smoke_db.py` -> exit 0; smoke contact still inserts with phone `911234567890`.
6. Confirmed the inline literal is removed (`grep 911234567890 scripts/smoke_db.py` empty).
7. Marked TKT-0006 `resolved`.
8. Filed TKT-0037 (placeholder names) and TKT-0038 (test connection button) as resolved follow-ons covering the un-ticketed iter91-94 in-session edits. Both will be verified + committed alongside TKT-0006 in the Verification Agent's next commit (single squashed commit is fine since they're three small independent fixes; or three commits in sequence is also valid).

## Outcome
TKT-0006 resolved. TKT-0037 + TKT-0038 filed and resolved to capture the in-session UX work formally. Next: Verification Agent picks the bundle (TKT-0006 + TKT-0037 + TKT-0038).

## Note on the operator's most-recent message
After this iteration's `## Plan` was already in motion, the operator asked for: Vite 8, Vitest, Biome, accessibility tests, ARIA labels, e2e tests, then commit + push. That request conflicts with the project's actual stack (Watify is Next.js + Tailwind, not Vite; no test framework is installed, no Biome). It is a multi-iteration tooling addition. The iter95 work is TKT-0006-focused per AGENTS.md `one ticket at a time`; the tooling ask is being addressed outside this conversation log -- the operator will see a separate response explaining the stack mismatch and proposing a ticket-by-ticket plan.
