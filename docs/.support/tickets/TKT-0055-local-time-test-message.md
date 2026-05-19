---
id: TKT-0055
title: Test message timestamp uses local time, not UTC
status: verified
priority: P3
area: frontend
related_tickets: TKT-0038
created: 2026-05-19T03:13:00Z
updated: 2026-05-19T03:13:00Z
created_by: resolving_agent
filed_via: user_report
---

## Summary
Operator: "the time should be the local time not utc -- Watify test message at 2026-05-19 03:12:40 UTC."

The Test connection message body was generated from `new Date().toISOString().replace("T"," ").slice(0,19)` and suffixed " UTC". That reads in UTC even though the operator's WhatsApp will display the message at local time.

## Fix
`frontend/src/app/connect/page.tsx` ReadyPanel handleTestSelf:
- Before: `const ts = new Date().toISOString().replace("T"," ").slice(0,19)` -> `Watify test message at <ts> UTC`
- After:  `const ts = new Date().toLocaleString()` -> `Watify test message at <ts>` (no "UTC" suffix; the format is the operator's locale).

History page timestamps (`components/history/JobRow.tsx:13`) already use `toLocaleString()` -- no change needed there. The only other `toISOString()` in `frontend/src` is in `app/send/page.tsx:83` where it formats the schedule field for the API (which must stay UTC -- backend stores UTC).

## Resolution history
- 2026-05-19T03:13:00Z -- filed + resolved + verified inline per operator report.
