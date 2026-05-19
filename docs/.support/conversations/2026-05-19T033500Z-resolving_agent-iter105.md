# Iteration 105 -- Resolving Agent + Verification Agent (TKT-0056 + TKT-0057 bundle, operator-directive)

- **Started**: 2026-05-19T03:35:00Z
- **Phase**: resolving (bundled with verification, operator-directive)
- **Active agent**: resolving_agent + verification_agent

## Tickets
- TKT-0056 (P1 frontend) -- Disconnect button = full unlink + confirm via modal, no soft disconnect, no alert box.
- TKT-0057 (P2 frontend) -- two themes only (light + dark), dark by default, localStorage persisted, no system-mode fallback.

## Operator directive (verbatim)
- "I dont want any alert box and disconnect should be the unlink right? I dont want any temporary disconnect"
- "keep only disconnect it should permanently unlink the session"
- "and the alert box instead provide modal box"
- "while unlinking"

Iter103 had shipped two affordances on the Ready panel: a soft Disconnect (runtime teardown, session blob preserved) and a nuclear Unlink (full session wipe). The Unlink confirmation used `window.confirm`. The operator wants a single Disconnect button that performs the full session wipe, gated by a styled modal with a "Disconnecting..." progress state.

## Actions

1. **`frontend/src/app/connect/page.tsx`** -- restructured ReadyPanel + ConnectInner:
   - Removed `disconnect` from `useWaState()` destructure (kept `connect` + `unlink`).
   - Removed `handleDisconnect` (soft path) and `handleUnlink` (window.confirm path).
   - Added `requestDisconnect()` which opens the modal, and `confirmDisconnect()` which calls the hook's `unlink()` with `setUnlinking(true)` so the modal button shows "Disconnecting...". Sets `AUTO_FLAG` to suppress auto-pair, same as the previous Unlink handler.
   - Added two pieces of local state: `confirmOpen` (modal visibility) and `unlinking` (round-trip progress).
   - Dropped the `onUnlink` prop from ReadyPanel; only `onDisconnect` remains. The button is red-outlined and titled "Disconnect WhatsApp and wipe the saved session. Next pairing requires a fresh QR / pair-code."
   - Added a new `DisconnectModal` function component at the bottom of the file. Renders a centered dialog with `role="dialog"`, `aria-modal="true"`, `aria-labelledby="disconnect-title"`, backdrop `bg-black/60 backdrop-blur-sm`, Cancel + Disconnect buttons both disabled while `unlinking`, Disconnect button text flips to "Disconnecting..." mid-round-trip.
2. **`frontend/src/hooks/useWaState.ts`** -- `disconnect()` stays exported (no longer called from /connect, but cheap to keep for future consumers). `unlink()` already shipped in iter103.
3. **`backend/app/routers/whatsapp.py`** -- `/api/wa/disconnect` route stays for the same reason; no change.

## Verification proofs
- `npx --no-install tsc --noEmit` exit 0.
- `curl http://localhost:3000/connect` HTTP 200, Loading skeleton renders (RequireAuth fires; full UI loads after login).
- Code inspection at `connect/page.tsx`:
  - `useWaState()` destructure at line 23 includes `unlink`, NOT `disconnect`.
  - `confirmOpen` + `unlinking` state at lines 28-29.
  - `requestDisconnect()` at lines 73-75 only opens the modal.
  - `confirmDisconnect()` at lines 77-92 calls `unlink()`, sets AUTO_FLAG, toggles `unlinking`.
  - ReadyPanel callsite at line 201 passes only `ownerPhone` + `onDisconnect={() => requestDisconnect()}`.
  - ReadyPanel signature at line 466-471 has no `onUnlink` prop.
  - Single red-outlined Disconnect button at lines 527-534 (no separate Unlink button).
  - `DisconnectModal` component at lines 221-274 with all required ARIA attrs and the "Disconnecting..." flip.
- Operator-directive bundle: resolving+verification run by the same agent, same pattern as iter98/iter100/iter103.

## TKT-0057 -- theme cleanup (mid-iteration operator directive)

Operator follow-up: "theme should be only two themes light and dark and dark by default with theme local storage."

iter100 shipped a three-mode ThemeToggle (Light -> Dark -> System) with the inline init script reading the OS `prefers-color-scheme` media query as a fallback. Operator wants the System option removed entirely.

1. `frontend/src/components/ThemeToggle.tsx` -- rewrote:
   - `Theme` narrowed to `"light" | "dark"`. Removed `system` from the union.
   - `readTheme()` returns "light" only on exact-match; otherwise "dark" (default).
   - Removed the matchMedia listener wiring (no system mode to track).
   - `cycle()` -> `toggle()` (two-state flip).
   - Removed `SystemIcon`.
   - `aria-label`/`title` reads "Theme: Dark. Click to switch to Light." (and vice versa).
2. `frontend/src/app/layout.tsx` inline no-flash script -- shortened to: `document.documentElement.classList.toggle('dark', localStorage.getItem('watify.theme') !== 'light')`. Anything that isn't the literal "light" -> dark. `<html>` keeps `className="...dark"` so SSR + first paint stays dark before the script runs.

### Verification proofs (TKT-0057)
- `npx --no-install tsc --noEmit` exit 0.
- `curl /` 200, `curl /connect` 200, `curl /login` 200.
- Inline script no longer references `prefers-color-scheme` or `matchMedia`.
- ThemeToggle.tsx no longer references `system`, `matchMedia`, or `SystemIcon`.

## Outcome
TKT-0056 + TKT-0057 verified inline. Single Disconnect button now performs the full session wipe via a styled modal with progress feedback (no more `window.confirm`, no more soft-disconnect ambiguity). ThemeToggle reduced to a clean two-state flip with dark as the default.

Pipeline: bump iter to 105, phase=ticketing, queue stays at TKT-0052 (the only remaining open ticket). Verified count 54 -> 56.
