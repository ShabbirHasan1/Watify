---
id: TKT-0018
title: Push QR updates to the frontend via SSE instead of polling
status: verified
priority: P3
area: frontend
created: 2026-05-18T17:29:25Z
updated: 2026-05-18T17:29:25Z
created_by: ticketing_agent
related_plan_item: B-05, F-03
filed_via: gap_analysis
---

## Summary
`/connect` polls `/api/wa/state` every 1s while pairing (TKT-0010). With ~6 polls per QR rotation, this is fine for a single-user app, but Server-Sent Events would be cheaper and tighter -- the UI would learn about a new QR within ~50 ms instead of within 1 s.

openalgo uses Flask-SocketIO and emits a `whatsapp_qr` event from the pairing worker; the React frontend subscribes once and replaces the QR `<img>` on every event.

## Expected
- New endpoint `GET /api/wa/events` returns an SSE stream (`text/event-stream`).
- Worker thread publishes `qr`, `state_change`, `error` events into a `asyncio.Queue` consumed by the SSE handler.
- `useWaState` adds an `EventSource` subscription; the existing SWR poll stays as a fallback if the stream drops.

## Fix sketch
- `app/routers/whatsapp.py` adds `/api/wa/events` SSE route using `StreamingResponse`.
- Frontend `useWaState` creates `new EventSource('/api/wa/events')` and writes into the SWR cache on each event; bumps SWR refresh interval to 5s while EventSource is open.

## Out of scope
- WebSocket (full duplex) is overkill for one-way QR updates. SSE is enough.

## Resolution history
- 2026-05-18T17:29:25Z -- filed by Ticketing Agent (iter32).
- 2026-05-18T23:15:11Z -- closed as designed-not-implemented by Resolving Agent (iter100). Rationale: the current SWR poll runs at 1 s while pairing (already faster than the 30 s QR rotation cycle) and 2 s while disconnected. Sub-second push delivery would require a thread-safe pubsub bridging the wars worker thread (PyO3 !Send) and FastAPI's async event loop, plus EventSource auto-reconnect handling on the frontend -- meaningful infra for sub-second-vs-1-second user-visible gain. Decision: keep the polling pattern; revisit if a future ticket needs sub-100ms latency (e.g. a multi-tab broadcast use case that doesn't apply to single-user Watify).
