---
id: TKT-0035
title: Pair-code frontend toggle + panel on /connect
status: verified
priority: P3
area: frontend
created: 2026-05-18T21:48:00Z
updated: 2026-05-18T21:48:00Z
created_by: resolving_agent
related_plan_item: F-03, A1
related_tickets: TKT-0014
filed_via: split_from_TKT-0014
---

## Summary
TKT-0014 shipped the backend half of pair-code mode in iter83: `POST /api/wa/connect` now accepts an optional `{"phone":"+CCXXXXXXXXX"}` body and the `WaState` response includes a `pair_code: str | None` field. The frontend still only renders the QR card. This ticket covers the matching UI.

## Expected
- `frontend/src/app/connect/page.tsx`:
  - Add a small mode-switch above the pairing card: "Scan QR" (default) vs "Use pair code instead".
  - When "Use pair code" is active:
    - Render a phone-input field with helper "Enter the phone number you will type the code on (E.164: +CC followed by digits)".
    - "Get pair code" button calls `auth-routed` `apiFetch` to `POST /api/wa/connect` with `{phone}`. Validate client-side: trim, must start with `+`, total length 8-16.
    - On 200, poll `/api/wa/state` (already happens via `useWaState` SWR refresh) and render `<PairCodePanel code={waState.pair_code} />` with "Open WhatsApp on your phone -> Settings -> Linked devices -> Link with phone number -> type this code:" and a large monospace 4-3 chunked display of the 8-char code (e.g. `ABCD-EFG1`).
    - On 422 invalid_phone: inline error toast.
  - When the mode-switch flips back to "Scan QR", call `POST /api/wa/connect` with no body so wars resumes the QR flow.

- `frontend/src/components/connect/PairCodePanel.tsx` (new) -- pure presentational; takes `{ code: string | null }`. When `code` is null, shows "Waiting for pair code...".

- `useWaState` already polls; no hook changes required other than reading `waState.pair_code`.

## Acceptance
- `npx tsc --noEmit` exit 0.
- The /connect page has a working mode-switch.
- Submitting a valid phone surfaces an 8-character code in `<PairCodePanel>` once wars returns it.

## Resolution history
- 2026-05-18T21:48:00Z -- filed by Resolving Agent (iter83) as the frontend follow-on to TKT-0014. Backend (worker pair_code state + WaState schema + /api/wa/connect body extension) is verified-in-place; frontend remains.
- 2026-05-18T22:01:00Z -- resolved by Resolving Agent (iter86). Four-file change set: (1) `frontend/src/lib/api.ts` -- extended `WaState` type with `pair_code: string | null` field; extended `wa.connect()` signature to accept an optional `phone?: string` and POST `{phone}` when provided, `{}` otherwise. (2) `frontend/src/hooks/useWaState.ts` -- threaded the optional `phone` through `connect(phone?: string)`. (3) `frontend/src/components/connect/PairCodePanel.tsx` (new) -- presentational `{code: string | null}`; renders the 8-char code in 4-3 chunks (`ABCD-EFG1`) in a centered monospaced block with `aria-label="Pair code"`; "Waiting for pair code..." when null; linked-devices instructions above; "codes expire after a short time" hint below. No emojis/icons, Tailwind only. (4) `frontend/src/app/connect/page.tsx` -- imported PairCodePanel + ApiError + toast; added `Mode = "qr" | "code"` local state + `phoneDraft` + `codeErr` state; new `<ModeSwitch>` tab-group component (role=tablist with two role=tab buttons "Scan QR"/"Use pair code instead", filled-dark active style); new `<PairCodeStarter>` form with E.164 phone input (`pattern` enforced as start-with-+, length 8-16 client-side); `handlePairCodeConnect()` calls `connect(phone)`, on `ApiError.status === 422` extracts `body.detail` -> inline error + `toast.error`; `handleModeChange()` resets the wars worker to QR flow when flipping back to QR mid-pairing; render branches: QR mode -> existing PairingPanel (QR card), pair-code mode + pairing state -> PairCodePanel showing waState.pair_code. Mode switch hidden when state is "ready" or "error" so the user doesn't accidentally re-pair an already-linked session. `npx --no-install tsc --noEmit` exit 0. Dev-server smoke: `curl /connect` HTTP 200 with `Loading...` skeleton (RequireAuth fires; the mode-switch + PairCodePanel render after the cookie-backed `useAuth` resolves -- confirmed visible in the bundled JS chunk). Conversation: `docs/.support/conversations/2026-05-18T215931Z-resolving_agent-iter86.md`.
- 2026-05-18T22:08:00Z -- VERIFIED by Verification Agent (iter87). Eight proofs: (a) `WaState.pair_code: string | null` at `lib/api.ts:113`. (b) `connect: (phone?: string) =>` signature at `:123`. (c) `async function connect(phone?: string)` at `useWaState.ts:28`. (d) `PairCodePanel.tsx` at 1970 bytes with `aria-label="Pair code"` (line 22), `formatChunks(code)` call (line 24), `Waiting for pair code...` fallback (line 28), `function formatChunks` helper (line 41). (e) `connect/page.tsx` imports `PairCodePanel` at line 4, declares `type Mode = "qr" | "code"` at line 20, has `handlePairCodeConnect()` at :82, `handleModeChange()` at :114, renders `<ModeSwitch>` at :146, `<PairCodeStarter>` at :165, `<PairCodePanel code={waState.pair_code} />` at :182, and defines the local helpers `function ModeSwitch` at :210 + `function PairCodeStarter` at :247. (f) `npx --no-install tsc --noEmit` exit 0. (g) Non-ASCII char count = 0 across all 4 edited files. (h) `curl /connect` HTTP 200; bundle search across 17 referenced chunks finds all four expected strings (`Use pair code instead`, `Pair with a code`, `Type this code on your phone`, `Waiting for pair code`) inside `/_next/static/chunks/_049tu0h._.js` (59308 bytes) -- the merged page chunk. Verified.
