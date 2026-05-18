---
id: TKT-0037
title: Replace Alice/Bob placeholders with Indian names on /groups
status: verified
priority: P3
area: frontend
created: 2026-05-18T22:50:00Z
updated: 2026-05-18T22:50:00Z
created_by: resolving_agent
related_plan_item: -
filed_via: user_direct_request_in_iter95
---

## Summary
Form placeholders on the groups page used `Alice` and `Bob, +91 ...`. Operator asked for Indian placeholder names since the project is Indian-deployed.

## Fix
Out-of-iteration edit during iter95:
- `frontend/src/app/groups/page.tsx:229` placeholder `Alice` -> `Priya`
- `frontend/src/components/groups/BulkAddModal.tsx:106` placeholder `Alice, +91 9876543210\nBob, +91 9876543211` -> `Priya, +91 9876543210\nArjun, +91 9876543211`

`npx tsc --noEmit` exit 0.

## Resolution history
- 2026-05-18T22:50:00Z -- filed and resolved by Resolving Agent (iter95). Two placeholder strings swapped; no logic change. Filed as a follow-on ticket so the Verification Agent can include the change in a properly-attributed commit.
