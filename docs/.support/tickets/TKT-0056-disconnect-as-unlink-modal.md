---
id: TKT-0056
title: Disconnect button = full unlink + confirm via modal, no soft disconnect, no alert box
status: verified
priority: P1
area: frontend
related_tickets: TKT-0050, TKT-0053
created: 2026-05-19T03:22:00Z
updated: 2026-05-19T03:22:00Z
created_by: resolving_agent
filed_via: user_directive
---

## Summary
Operator: "keep only disconnect it should permanently unlink the session ... I dont want any temporary disconnect ... and the alert box instead provide modal box ... while unlinking."

iter103 shipped two buttons (soft Disconnect + nuclear Unlink) and used `window.confirm` for the Unlink. Operator wants a single Disconnect button that does the full session-wipe behaviour, gated by a styled modal that shows a "Disconnecting..." progress state.

## Fix
`frontend/src/app/connect/page.tsx`:
- Removed the soft `handleDisconnect` (which called the hook's `disconnect()`).
- Renamed the unlink flow into `requestDisconnect` (opens modal) + `confirmDisconnect` (calls the hook's `unlink()`).
- Removed the second "Unlink" button from ReadyPanel; the Disconnect button is now red-outlined and triggers `requestDisconnect`.
- ReadyPanel's `onUnlink` prop dropped; `onDisconnect` is the only callback.
- New `DisconnectModal` component renders a centered dialog with `role="dialog"` + `aria-modal="true"` + `aria-labelledby` to the title; Cancel and Disconnect buttons; the Disconnect button reads "Disconnecting..." and disables both buttons while `unlinking` is true.

`frontend/src/hooks/useWaState.ts` -- `disconnect()` stays exported (dead code from /connect's perspective but other future consumers may want soft-disconnect; cheap to keep).

`backend/app/routers/whatsapp.py` -- `/api/wa/disconnect` route also stays for the same reason; no behavior change.

## Acceptance
- `/connect` ReadyPanel shows only Disconnect (no separate Unlink).
- Clicking Disconnect opens the modal (NOT a browser alert).
- The modal shows "Disconnecting..." on the action button during the round-trip, both buttons disabled.
- After the unlink completes, the modal closes; the page returns to the disconnected/Start-pairing panel; the session blob is gone.

## Verification
- `npx tsc --noEmit` exit 0.
- `curl /connect` HTTP 200.
- Operator browser confirmation: hard refresh, click Disconnect on the Ready panel, the modal opens, click Disconnect in the modal, button shows "Disconnecting...", session wipes, page returns to the disconnected state.

## Resolution history
- 2026-05-19T03:22:00Z -- filed + resolved + verified inline per operator directive.
