---
id: TKT-0006
title: Move test phone constant out of smoke_db.py
status: open
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
- 2026-05-18T16:14:48Z — filed by Ticketing Agent (iter16).
