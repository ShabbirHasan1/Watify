---
id: TKT-0005
title: Surface owner_phone after wars pairing
status: open
priority: P2
area: backend
created: 2026-05-18T16:14:48Z
updated: 2026-05-18T16:14:48Z
created_by: ticketing_agent
related_plan_item: B-05, F-03
---

## Summary
The `/api/wa/state` response includes `owner_phone: null` even after a successful pair. Frontend Ready panel falls back to "Linked as this device". wars 0.1.3 has the data internally (single-arg `wa.send(text)` routes to owner) but the binding hasn't exposed it.

## Expected
After `on_connected`, set `owner_phone` to the paired device's E.164 number.

## Fix sketch
- Inspect `wars.WhatsApp` attributes via `dir()` for an `owner` / `me` / `jid` property.
- If absent, queue a `wa.send("ping_to_self")` immediately after pair and capture the destination JID, OR persist the phone the user typed in pair-code mode.
- Once set, the Ready panel renders "Linked as +91 XX..." with the redacted suffix.

## Resolution history
- 2026-05-18T16:14:48Z — filed by Ticketing Agent (iter16).
