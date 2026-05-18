---
id: TKT-0008
title: Global toaster for transient errors / success
status: open
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
- 2026-05-18T16:20:30Z — filed by Resolving Agent (iter17) when scoping down TKT-0002.
