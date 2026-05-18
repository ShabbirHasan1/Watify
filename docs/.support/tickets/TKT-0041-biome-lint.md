---
id: TKT-0041
title: Biome lint + format on the frontend tree
status: open
priority: P3
area: frontend
created: 2026-05-18T22:53:00Z
updated: 2026-05-18T22:53:00Z
created_by: ticketing_agent
related_plan_item: -
filed_via: user_direct_request
---

## Summary
Frontend scaffold was created with `--no-eslint`. There is no linter or formatter. Add Biome (Rust-based, single binary, lint + format in one).

## Expected
- `frontend/package.json` adds devDep `@biomejs/biome` (latest stable). Adds scripts:
  - `"lint": "biome check ."`
  - `"format": "biome format --write ."`
- `frontend/biome.json` -- recommended Biome config with React + TypeScript rules. Disable any rule that fights Tailwind's class-string style.
- Run `biome check .` once; fix every error (or ignore via per-line `// biome-ignore` only when a rule is genuinely wrong for our pattern); commit.
- Document in README that `npm run lint` is the canonical pre-commit check.

## Acceptance
- `npm run lint` exits 0.
- `npx tsc --noEmit` still exits 0 (Biome's formatter doesn't break TypeScript).
- Existing components render unchanged.

## Resolution history
- 2026-05-18T22:53:00Z -- filed by Resolving Agent (iter95) at operator request.
