---
id: TKT-0006
title: Move test phone constant out of smoke_db.py
status: verified
priority: P3
area: backend
created: 2026-05-18T16:14:48Z
updated: 2026-05-18T16:14:48Z
created_by: ticketing_agent
related_plan_item: B-02
---

## Summary
`backend/scripts/smoke_db.py:30` hardcodes the phone `"911234567890"`. While safe today (a smoke fixture), it triggers the security-audit phone-grep and arguably should live alongside other test data.

## Expected
A shared `backend/scripts/_fixtures.py` (or env-driven) holding canonical fake test numbers — clearly labeled so the redaction filter and security audit can allow-list it.

## Resolution history
- 2026-05-18T16:14:48Z -- filed by Ticketing Agent (iter16).
- 2026-05-18T22:49:00Z -- resolved by Resolving Agent (iter95). Two-file change set: (1) `backend/scripts/_fixtures.py` (new) -- module docstring states it's the audit-allowlistable home for test fixtures; defines `TEST_PHONE_E164 = "+911234567890"` (the E.164 normalized form per `app/jid.py`'s convention) and `TEST_PHONE_E164_DIGITS = "911234567890"` (the bare-digits derivative that matches the `contact.phone_e164` column shape). (2) `backend/scripts/smoke_db.py:14` adds `from scripts._fixtures import TEST_PHONE_E164_DIGITS`; line 30 swaps the inline `"911234567890"` for the imported constant. `uv run python -m py_compile scripts/_fixtures.py scripts/smoke_db.py` clean. Smoke: `uv run python scripts/smoke_db.py` exit 0; smoke contact still appears in group 'smoke' with phone=911234567890 (identical row, sourced from the constant). The `app/` runtime tree never imports from `scripts/` -- the fixture is test-only as the spec required.
