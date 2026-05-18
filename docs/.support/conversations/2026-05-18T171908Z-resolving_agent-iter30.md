# Iteration 30 — Resolving Agent (TKT-0010 follow-up)

- **Started**: 2026-05-18T17:19:08Z
- **Finished**: 2026-05-18T17:22:00Z
- **Phase entering**: resolving
- **Phase exiting**: verification
- **Active agent**: resolving_agent
- **Ticket**: TKT-0010 (P1 frontend) — durable code fix for stale-QR pair failure

## Files modified
- `frontend/src/hooks/useWaState.ts` — SWR pairing-phase refresh dropped 2000 -> 1000 ms so the countdown reads smoothly.
- `frontend/src/app/connect/page.tsx`:
  - Added `useMemo` import.
  - `PairingPanel` now accepts `lastEventAt` and tracks live age via a 500 ms `setInterval` tick.
  - Three colored badges: emerald (<20 s), amber (20-30 s), rose (>=30 s).
  - QR `<img>` dims to `opacity-30` when expired.
  - Help text mentions the "can't connect at this time" symptom directly.

## Verification (pre-handoff)
- All 5 routes 200.
- Single "Fast Refresh had to perform a full reload" warning emitted during the edit (normal when state-bearing components are restructured); subsequent compiles green.
- Current wars state: `pairing`, QR present, last_event_at age 51.7 s -> in the new UI this would render the rose "expired" badge with the QR dimmed, exactly the desired behavior on a stale window.

## Decisions
- Tick driver lives inside `PairingPanel` rather than the hook so the page can show fractional updates between SWR polls.
- Thresholds: 20 s stale, 30 s expired. WhatsApp's actual server-side expiry is documented as ~30 s; we surface the stale warning early so the user pauses on a fresh one.

## Side note: user asked for openalgo gap analysis
User dropped a working reference WhatsApp integration at `docs/.support/openalgo/`. Quick scan of `services/whatsapp_bot_service.py`, `blueprints/whatsapp.py`, and `docs/whatsapp.md` surfaces the following gaps vs Watify v1. These will be filed as proper tickets in a dedicated Ticketing pass after Verification of TKT-0010:

| # | Gap | Priority | Notes |
|---|---|---|---|
| A | wars session bytes stored plaintext in `whatsapp.db` on disk | P1 | openalgo: Fernet-encrypted blob in DB column, temp-file pair flow per wars.md §3. |
| B | Backend boots even if `wars` is missing (lazy `_import_wars()` + `WarsNotInstalled` sentinel) | P2 | Watify imports wars at module top -> missing wheel = boot fail. |
| C | `RUST_LOG` defaults to suppress 3 noisy wars protocol log targets | P2 | We see the same `wacore::send WARN` spam in backend.log; openalgo silences `wacore::send`, `whatsapp_rust::message`, `wacore_libsignal::protocol::session_cipher` at error level. |
| D | Pair-code mode (in addition to QR) | P2 | openalgo `start_pair(phone=...)` lets WhatsApp issue a code to type on the phone -- useful for headless / shared-screen scenarios. |
| E | Real rate limiter on send endpoints (Flask-Limiter / equivalent) | P2 | We have the soft-cap UI banner but no actual middleware. |
| F | Richer pair state machine: `idle | starting | awaiting_scan | paired | failed` distinguishes `paired (blob saved)` from `ready (wars connected)`. | P3 | Watify conflates these. |
| G | JID helpers `phone_to_jid` / `jid_to_phone` | P3 | Explicit `<digits>@s.whatsapp.net` construction for clarity. wars accepts plain digits today but explicit helpers age better. |
| H | Inbound message handling + bot-mode slash commands | out of scope v1 | openalgo accepts `/orderbook` etc. from operator's own phone with `is_from_me` filter. Watify is send-only by design. |
| I | Attachment path validation (deny-roots + allowlist) | out of scope v1 | text-only sends today. |
| J | SocketIO/SSE push of `whatsapp_qr` events instead of polling | P3 | Watify polls /api/wa/state at 1s while pairing -- functional but chattier. |

Highest immediate-value items for Watify: A (encrypt session at rest), C (silence wars log noise), B (graceful wars-missing boot).

## Ticket transition
- TKT-0010: `open` -> `inprogress` -> `resolved`.

## Next iteration
**Verification Agent** runs TKT-0010. On pass: commit + push. Then **Ticketing Agent** runs the openalgo gap-analysis sweep.
