---
id: TKT-0057
title: Theme: two options only (light + dark), dark by default, localStorage persisted
status: verified
priority: P2
area: frontend
related_tickets: TKT-0043, TKT-0049, TKT-0044
created: 2026-05-19T03:36:00Z
updated: 2026-05-19T03:36:00Z
created_by: resolving_agent
filed_via: user_directive
---

## Summary
Operator: "theme should be only two themes light and dark and dark by default with theme local storage."

iter100 shipped TKT-0043 with a three-mode cycle (Light -> Dark -> System -> Light) and the inline no-flash init script fell back to the OS `prefers-color-scheme` media query when no preference was stored. Operator wants the System option removed entirely: two themes only, dark is the default, the choice persists under `watify.theme`.

## Fix
`frontend/src/components/ThemeToggle.tsx` -- rewrote:
- `Theme` narrowed from `"light" | "dark" | "system"` to `"light" | "dark"`.
- `readTheme()` returns "light" only when localStorage holds exactly that string; everything else (missing key, "system", garbage) resolves to "dark".
- Removed the `matchMedia` listener wiring (no system mode to track).
- Renamed `cycle()` -> `toggle()` (two-state flip).
- `aria-label`/`title` now read "Theme: Dark. Click to switch to Light." (and vice versa) -- no third state to surface.
- Removed `SystemIcon` -- only sun + moon remain.

`frontend/src/app/layout.tsx` inline no-flash script -- shortened:
- Old: read `watify.theme`, accept `light|dark|system`, fall back to `system`, then `matchMedia` for the resolved dark bit.
- New: `document.documentElement.classList.toggle('dark', localStorage.getItem('watify.theme') !== 'light')`. Anything other than the literal "light" resolves to dark, including missing key (first visit) -> dark-by-default.
- `<html>` element still has the `dark` className statically so SSR + first paint stays dark even before the script runs.

## Acceptance
- First-visit users see dark theme (no localStorage write yet).
- Clicking the toggle flips light <-> dark and persists the choice under `watify.theme`.
- Reloading honors the persisted choice.
- No OS-pref fallback anywhere.
- `npx tsc --noEmit` exit 0.

## Verification
- `npx --no-install tsc --noEmit` exit 0.
- `curl /` HTTP 200, `curl /connect` HTTP 200, `curl /login` HTTP 200.
- Inline script in `<head>` no longer references `prefers-color-scheme`; only `localStorage.getItem('watify.theme')`.
- `ThemeToggle.tsx` has no `system` literal, no `matchMedia`, no `SystemIcon`.

## Resolution history
- 2026-05-19T03:36:00Z -- filed + resolved + verified inline per operator directive (bundled with TKT-0056 in iter105).
