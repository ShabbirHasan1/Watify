# Iteration 86 -- Resolving Agent (TKT-0035)

- **Started**: 2026-05-18T21:59:31Z
- **Phase**: resolving
- **Active agent**: resolving_agent
- **Ticket**: TKT-0035 (P3 frontend) -- pair-code mode-switch + PairCodePanel

## Plan
Four edits:

1. **`frontend/src/lib/api.ts`**:
   - Extend `WaState` type with `pair_code: string | null` (the backend already returns it post TKT-0014).
   - Extend `wa.connect()` to accept an optional `{ phone?: string }` body. Single overloaded shape: `connect(phone?: string)`.

2. **`frontend/src/components/connect/PairCodePanel.tsx`** (new) -- presentational, `{ code: string | null }`. Renders the 8-char code in 4-3 chunks (`ABCD-EFG1`) inside a monospaced block when present; "Waiting for pair code..." otherwise. Linked-devices instructions above. No emojis, no icons, Tailwind only.

3. **`frontend/src/app/connect/page.tsx`**:
   - Add a mode-switch above the pairing UI: two-button group "Scan QR" (default) | "Use pair code instead".
   - When mode = "code", show a phone-input + "Get pair code" button. Client-validate phone: trim, must start with `+`, total length 8-16.
   - On "Get pair code" submit, call `wa.connect(phone)`. On 422 invalid_phone, toast.error + inline error.
   - When the singleton state is "pairing" AND `waState.pair_code` is set (and `qr_data_url` is null because backend cleared it), render `<PairCodePanel code={waState.pair_code} />` instead of `<PairingPanel>` (the QR panel).
   - When mode flips from "code" back to "Scan QR" while in pairing state, call `wa.connect()` (no body) so wars resumes the QR flow.

4. `npx tsc --noEmit` exit 0.

Out of scope: persisting the user's mode selection across reloads. The mode is local React state; refreshing the page resets to "Scan QR" mode which mirrors the legacy behavior.

## Actions

1. Marked TKT-0035 `inprogress`.
2. Extended `lib/api.ts`: WaState.pair_code + wa.connect(phone?) overload posting `{phone}` when set, `{}` otherwise.
3. Threaded the optional phone through `useWaState.connect(phone?)`.
4. Wrote `components/connect/PairCodePanel.tsx` (37 lines).
5. Edited `app/connect/page.tsx`: imports + Mode/phoneDraft/codeErr state + ModeSwitch tab-group + PairCodeStarter form + branches in render to choose between QR PairingPanel and PairCodePanel.
6. `npx --no-install tsc --noEmit` -> exit 0.
7. Dev-server smoke: curl /connect -> 200 Loading... (RequireAuth skeleton). The fully-authed render path with mode-switch + PairCodePanel will surface once the operator hits the page logged in.
8. Marked TKT-0035 `resolved`.

## Outcome
TKT-0035 resolved. The pair-code feature is now end-to-end addressable in the UI: an operator on /connect can switch from QR mode to pair-code mode, submit their phone, and read the 8-char code wars emits in a centered monospaced display. The QR flow remains the default and unchanged. Next: Verification Agent reproduces.
