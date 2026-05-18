---
id: TKT-0033
title: Track Next.js postcss XSS advisory (GHSA-qx2v-qp2m-jg93)
status: open
priority: P3
area: frontend
created: 2026-05-18T19:01:30Z
updated: 2026-05-18T19:01:30Z
created_by: ticketing_agent
related_plan_item: -
filed_via: security_audit_iter51
---

## Summary
`npm audit` flags 2 moderate vulnerabilities in `frontend/`:
- `postcss < 8.5.10` -- XSS via unescaped `</style>` in CSS Stringify output (GHSA-qx2v-qp2m-jg93).
- `next` (16.2.6) depends on the vulnerable postcss transitively.

`npm audit fix --force` would install `next@9.3.3` -- a catastrophic major downgrade from 16.x. **Do NOT run it.**

## Risk assessment
The advisory matters when an app generates CSS at runtime from untrusted input. Watify:
- Tailwind compiles at build time, statically.
- No runtime CSS-in-JS with user data.
- No `<style dangerouslySetInnerHTML>`.

Effective real-world impact for Watify: **near zero**. Tracking for visibility, not urgent.

## Expected
1. Wait for Next.js to bump its bundled postcss in a patch release; update with the next normal upgrade window.
2. As a near-term option: add an npm `overrides` block in `package.json`:
   ```json
   "overrides": { "postcss": "^8.5.10" }
   ```
   Smoke-test the build; if the override compiles clean, ship it.
3. Periodically re-run `npm audit` (e.g. in a CI step) and re-evaluate.

## Resolution history
- 2026-05-18T19:01:30Z -- filed by Ticketing Agent (iter51, npm audit).
