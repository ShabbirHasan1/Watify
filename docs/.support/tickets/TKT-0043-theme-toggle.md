---
id: TKT-0043
title: Dark/light theme toggle (explicit override of system preference)
status: open
priority: P3
area: frontend
created: 2026-05-18T22:54:00Z
updated: 2026-05-18T22:54:00Z
created_by: ticketing_agent
related_plan_item: -
filed_via: user_direct_request
---

## Summary
Watify's UI already supports dark mode via Tailwind's `dark:` class variants -- every panel, button, input, and toast has both light and dark styling. What's missing is an **explicit toggle** so the user can override the browser's `prefers-color-scheme` (e.g. force dark even on a light-mode OS).

## Current behavior
- `frontend/src/app/layout.tsx` does NOT set the `dark` class on `<html>` -- Tailwind's `dark:` variants currently fire only when `media (prefers-color-scheme: dark)` matches.
- No theme state is persisted.

## Expected
- New `frontend/src/components/ThemeToggle.tsx` -- a small button rendered in TopNav with text "Light" / "Dark" / "System" cycling on click (or a 3-segment radio if preferred).
- Theme state stored in `localStorage` under `watify.theme` with values `"light" | "dark" | "system"`. Default `"system"`.
- On mount, an effect reads `localStorage.watify.theme` and toggles `document.documentElement.classList` accordingly: `add("dark")` for dark, `remove("dark")` for light, follow `matchMedia("(prefers-color-scheme: dark)")` for system.
- Initial server render must not flash the wrong theme. Either:
  - Inline `<script>` in `layout.tsx`'s `<head>` that reads localStorage and sets `<html class="dark">` BEFORE React hydrates, OR
  - Accept a one-frame flash for simplicity (operator-visible only on first load).
- Tailwind: switch from `darkMode: "media"` (the implicit default in Tailwind v4 with `@tailwindcss/postcss`) to `darkMode: "class"` if needed. Verify the existing `dark:` variants still fire under the new mode.

## Acceptance
- Click the ThemeToggle three times: cycles Light -> Dark -> System -> Light.
- Refresh the page: theme persists across reloads.
- A logged-out visitor on `/` sees their chosen theme just like an authed user.
- `npx tsc --noEmit` exit 0.
- No emojis, no icons (per CLAUDE.md). Use the text labels "Light" / "Dark" / "System".

## Resolution history
- 2026-05-18T22:54:00Z -- filed by Ticketing Agent on operator request.
