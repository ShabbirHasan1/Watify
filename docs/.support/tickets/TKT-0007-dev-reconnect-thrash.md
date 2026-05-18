---
id: TKT-0007
title: /connect re-triggers POST /api/wa/connect on every hot-reload
status: open
priority: P2
area: frontend
created: 2026-05-18T16:14:48Z
updated: 2026-05-18T16:14:48Z
created_by: ticketing_agent
related_plan_item: F-03
---

## Summary
During dev, every Next.js hot-reload remounts `/connect`. The `useEffect([waState?.state])` fires and POSTs to `/api/wa/connect`, even if the wars singleton is already pairing. Backend ends up cycling pairing -> disconnected as the worker thread accepts new connect commands.

Observed across iter9, iter11, iter13, iter14 conversation logs — each one had to manually disconnect at the end to leave a clean state.

## Expected
The Connect page should only auto-pair when `state == "disconnected"` AND the user has not already initiated a connection in the same session. A `sessionStorage` flag or a single `useRef` guard suffices.

## Fix sketch
```tsx
const autoStarted = useRef(false);
useEffect(() => {
  if (autoStarted.current) return;
  if (waState?.state === "disconnected") {
    autoStarted.current = true;
    connect().catch(() => {});
  }
}, [waState?.state]);
```

## Resolution history
- 2026-05-18T16:14:48Z — filed by Ticketing Agent (iter16).
