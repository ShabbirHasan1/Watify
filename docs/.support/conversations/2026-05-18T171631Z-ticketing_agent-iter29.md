# Iteration 29 — Ticketing Agent (human manual input)

- **Started**: 2026-05-18T17:16:31Z
- **Finished**: 2026-05-18T17:18:00Z
- **Phase entering**: ticketing
- **Phase exiting**: ticketing (awaiting user re-test)
- **Active agent**: ticketing_agent (triggered by human manual input per AGENTS.md)

## Trigger
User reported via chat + screenshot (`c:\Users\Admin1\Desktop\2026-05-18_22-45-29.png`):
> when try to scan from mobile i got cannot be connect this time

## Diagnosis
Backend log timestamps show QR rotation:
```
22:43:21 wars on_qr qr_len=2830
22:43:41 wars on_qr qr_len=2882
22:44:01 wars on_qr qr_len=2990
22:44:21 wars on_qr qr_len=3050    <- newest before user scanned
(screenshot @ 22:45:29 ~= 68s after newest QR)
```
WhatsApp expires QRs after ~30s. Phone error matches expired-QR semantics.

Secondary: `whatsapp.db` mtime stuck at 21:09 with `-wal` ballooned to 601 KB -- many partial handshakes across the day's iterations had left WAL cruft.

## Action taken
1. Filed **TKT-0010** (P1 backend, filed_via: human_manual_input).
2. POST /api/wa/disconnect to stop the worker cleanly.
3. Killed backend pid 43260; removed `whatsapp.db`, `whatsapp.db-wal`, `whatsapp.db-shm`.
4. Restarted backend; new pid 19592.
5. POST /api/wa/connect; first fresh QR fired within ~1 second (last_event_at=2026-05-18T17:17:45Z).

User instructed:
- Hard-reload /connect in browser; the SWR 2s poll fetches the new QR.
- Scan within ~30s.
- If still failing, check WhatsApp Linked Devices count (max 4) and phone network.

## Follow-up ideas (recorded in TKT-0010, not yet implemented)
- Visible "QR rotates in X seconds" countdown on /connect.
- Surface `last_event_at` age in UI; warn at > 25s.
- Backend auto-cycle stale pairing windows beyond 5 min.

## Ticket transition
- TKT-0010 filed `open` (P1).

## Next iteration
Awaiting user feedback. If pair succeeds, TKT-0010 -> resolved -> verified -> commit `fix(TKT-0010): clean wars session + retry guidance`. If still failing, the follow-up improvements get scoped as a code fix (countdown UI + auto-retry).

Original next-action (Resolving Agent on TKT-0008 Toaster) is deferred until TKT-0010 is closed.
