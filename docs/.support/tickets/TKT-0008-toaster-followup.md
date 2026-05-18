---
id: TKT-0008
title: Global toaster for transient errors / success
status: verified
priority: P2
area: frontend
created: 2026-05-18T16:20:30Z
updated: 2026-05-18T16:20:30Z
created_by: resolving_agent
related_plan_item: F-07
related_tickets: TKT-0002
---

## Summary
Split out from TKT-0002. The empty-state and soft-cap parts of F-07 shipped in iter17; the global toast queue is the remaining piece.

## Expected
- `src/components/Toaster.tsx` — portal-based stack, no extra deps. API: `toast.success(text)`, `toast.error(text)`, optional `duration`.
- Mounted once in `src/app/layout.tsx`.
- Wire from `useGroups`, `useGroupDetail.bulkAddContacts` (success counts), `useWaState.disconnect` (success), `useJobs.cancelJob` (success), and any place that currently sets `setRowErr` / `setError` inline can additionally fire a toast on failure.
- Keep inline error text (for accessibility and persistence); toasts are auxiliary.

## Resolution history
- 2026-05-18T16:20:30Z -- filed by Resolving Agent (iter17) when scoping down TKT-0002.
- 2026-05-18T21:32:00Z -- resolved by Resolving Agent (iter80). Six-file change set: (1) `frontend/src/components/Toaster.tsx` (new) -- module-level singleton store with `subscribe/getSnapshot` for `useSyncExternalStore`, exported `toast` object with `success(text, opts?)` + `error(text, opts?)` + `dismiss(id)`. Auto-dismiss after `opts.duration ?? 4000ms` via `window.setTimeout` (SSR-safe via `typeof window !== "undefined"` check). `<Toaster />` renders a fixed bottom-right stack with Tailwind colored-border cards (emerald-500 left border for success, red-500 for error) + a per-toast close button (text "close", no icon). `aria-live="polite"` on the container; per-card `role="alert"` for errors and `role="status"` for success. No emojis, no icons, no new deps. (2) `frontend/src/app/layout.tsx` -- import Toaster + mount once after `{children}` so it's at the document end (Z-index 50 keeps it above the main content). (3) `frontend/src/hooks/useGroups.ts` -- import toast; success toasts on `createGroup` (`Group "X" created`), `renameGroup` (`Group renamed to "X"`), `deleteGroup` (`Group deleted`). (4) `frontend/src/hooks/useGroupDetail.ts` -- import toast; `bulkAddContacts` resolves the success branch into three cases: all-inserted (`Added N contacts`), partial (`Added N, skipped M duplicates`), or all-duplicates (`No new contacts; M duplicates skipped` -- toast.error to flag the no-progress case). (5) `frontend/src/hooks/useWaState.ts` -- success toast on `disconnect` (`WhatsApp disconnected`). (6) `frontend/src/hooks/useJobs.ts` -- success toast on `cancelJob` (`Job cancelled`). Existing inline error paths (setRowErr, setError) are untouched and remain the accessibility source-of-truth -- toasts are additive. `npx tsc --noEmit` exit 0. Dev-server smoke: `curl /` 200 + `curl /dashboard` 200 (Toaster mount doesn't break SSR -- `useSyncExternalStore` is called only on the client; `getServerSnapshot` returns `[]` so the SSR pass renders nothing for the Toaster, and the component renders the actual stack only after hydration). Awaits Verification Agent. Conversation: `docs/.support/conversations/2026-05-18T212907Z-resolving_agent-iter80.md`.
- 2026-05-18T21:34:00Z -- VERIFIED by Verification Agent (iter81). Seven proofs: (a) `Toaster.tsx` exists at 2814 bytes; `useSyncExternalStore` imported at line 12; `export const toast` at line 65 with `.success/.error/.dismiss`; `export default function Toaster()` at line 71 calling `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` at line 72. (b) `layout.tsx:4` imports Toaster; `layout.tsx:37` mounts `<Toaster />` after `{children}`. (c) All four hooks import + fire toast: `useGroups.ts:4/19/27/33` (create/rename/delete), `useGroupDetail.ts:4/47/49/51` (bulkAddContacts three branches), `useWaState.ts:4/36` (disconnect), `useJobs.ts:4/31` (cancelJob). (d) `npx --no-install tsc --noEmit` exit 0. (e) Non-ASCII char count: 0 across all five edited files. (f) Dev-server curl smoke: GET `/` 200, GET `/dashboard` 200, GET `/groups` 200 -- Toaster mount preserves SSR (`getServerSnapshot` returns `[]`). (g) SSR-safe guard at `Toaster.tsx:38` `if (typeof window !== "undefined" && duration > 0)` before `window.setTimeout`; `getServerSnapshot` at line 61 returns `[]`. Verified.
