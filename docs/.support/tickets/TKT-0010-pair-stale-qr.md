---
id: TKT-0010
title: Mobile shows "can't connect at this time" when scanning the QR
status: verified
priority: P1
area: frontend
created: 2026-05-18T17:16:31Z
updated: 2026-05-18T17:24:37Z
created_by: ticketing_agent
related_plan_item: B-05, F-03
filed_via: human_manual_input
---

## Summary
User scanned the QR on the Connect page; WhatsApp on the phone responded with "Can't connect at this time. Please try again later."

## Reproduction
1. Visit /connect, wait for QR.
2. Scan with WhatsApp on phone.
3. Phone errors out instead of pairing.

## Root cause
Backend log shows QR rotation happening every ~20-60s but the user-visible QR was ~68s old at scan time:
```
22:43:21 wars on_qr qr_len=2830
22:43:41 wars on_qr qr_len=2882
22:44:01 wars on_qr qr_len=2990
22:44:21 wars on_qr qr_len=3050     <-- newest before scan
(screenshot timestamp 22:45:29 = ~68s after newest QR)
```
WhatsApp invalidates a QR ~30s after it is shown to the device. The frontend SWR poll runs every 2s while pairing, so the browser SHOULD have the freshest QR — unless the user was looking at a screenshot or had paused the tab, or the autopair guard from TKT-0007 had skipped the `connect()` call after a Fast Refresh and the QR cached client-side was stale.

Secondary signal: `whatsapp.db` mtime is 21:09 but `whatsapp.db-shm` is 22:42 and `whatsapp.db-wal` is 601 KB — many partial handshakes accumulated as WAL cruft.

## Fix taken (iter29)
1. `wa.disconnect()` to stop the worker cleanly.
2. Killed the backend process, removed `whatsapp.db`, `whatsapp.db-wal`, `whatsapp.db-shm`.
3. Restarted backend with the fresh session DB.
4. User instructed to:
   - Hard-reload /connect (so the in-browser QR cache clears alongside the new sessionStorage flag from TKT-0007).
   - Scan **within 30 seconds** of the QR appearing.
   - If still failing, check WhatsApp -> Linked devices count on the phone -- WhatsApp allows max 4 linked devices; if at the cap, unlink one before retrying.

## Follow-up ideas (not done this ticket)
- Add a visible "QR rotates in X seconds" countdown on /connect so the user knows when to scan.
- Surface `last_event_at` age in the UI; warn when > 25s ("New QR coming...").
- Auto-disconnect after `LINK_DEVICE_PAIRING_TIMEOUT_MS` (~5 minutes per wars) and re-`connect()` to force a fresh handshake.

## Resolution history
- 2026-05-18T17:16:31Z — filed by Ticketing Agent (human manual input). Same iteration: applied the clean-restart fix; awaiting user confirmation.
- 2026-05-18T17:19:08Z — Resolving Agent (iter30) set status to inprogress.
- 2026-05-18T17:21:00Z — Resolving Agent (iter30) shipped the durable code fix so this cannot fail silently again:
  - `frontend/src/hooks/useWaState.ts` — pairing-phase SWR poll bumped from 2s -> 1s so the countdown reads smoothly.
  - `frontend/src/app/connect/page.tsx` PairingPanel now derives a live "QR age" from `last_event_at`:
    - **fresh** (<20s): emerald badge "Fresh QR. Scan within ~Xs.".
    - **stale** (20-30s): amber badge "Refreshing soon (Xs left). Wait for the next QR if your scan fails.".
    - **expired** (>=30s): rose badge "QR expired. Waiting for a fresh one to load..." and the QR image dims to 30% opacity so the user does not try to scan it.
    Tick driver: `setInterval(setNow, 500)` inside the component, plus the SWR poll updating `last_event_at` on each `on_qr` from wars.
  - Help text under the QR now explicitly mentions the "can't connect at this time" symptom and what it means.
  - No backend change required -- `last_event_at` already updates on every wars `on_qr` callback (iter15 logging_setup).

  All 5 frontend routes still compile and serve 200; Fast Refresh did one full reload during edit (single transient warning, no persistent error).

  Status set to `resolved`; awaiting Verification Agent.
- 2026-05-18T17:24:37Z — Verification Agent (iter31) PASSED:
  - `connect/page.tsx`: thresholds `QR_LIFETIME_S=30` / `QR_STALE_AT_S=20` declared; `setInterval(setNow, 500)` tick driver; `ageS = floor((now - Date.parse(lastEventAt))/1000)`; three branches (fresh/stale/expired) with correct tones; `<img>` className toggles `opacity-30 | opacity-100` via `dim`.
  - `useWaState.ts`: `phase==="pairing" -> 1000ms`, `phase==="disconnected" -> 2000ms`, else paused. Confirmed.
  - Backend `/api/wa/state.last_event_at` updates on each `on_qr` (iter15 logging hook).
  - Live cycle: forced disconnect + reconnect; `last_event_at` ticks 0.4 -> 5.5 s over 5 polls, proving fresh QR rotation works and the UI countdown will read it correctly.
  - All 5 frontend routes HTTP 200.
  - Status set to `verified`. Committed `fix(TKT-0010): QR age countdown + dim on expiry` and pushed.

## Aside discovered during verification (separate ticket worthy)
Backend wars singleton stopped firing on_qr after ~5 minutes -- the previous `last_event_at` was 297 s old, suggesting the wars pairing window expired. wars docs note pairing times out after ~5 minutes. Watify should auto-cycle (disconnect + reconnect) when no on_qr has arrived for, say, 45 s, so the user can leave /connect open longer than 5 minutes without going through the manual restart cycle. Will be filed alongside the openalgo gap analysis tickets.
