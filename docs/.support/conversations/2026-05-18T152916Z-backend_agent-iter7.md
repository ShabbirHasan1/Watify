# Iteration 7 — Backend Agent (B-04)

- **Started**: 2026-05-18T15:29:16Z
- **Finished**: 2026-05-18T15:34:00Z
- **Phase**: scaffold (B-04)
- **Active agent**: backend_agent
- **PLAN item**: B-04 — bulk-add contacts with all-or-nothing validation

## Files modified
- `backend/app/schemas.py` — added `BulkContactsRequest` (list min_length=1, max_length=20), `BulkRejectedReason`, `BulkContactsResponse`.
- `backend/app/routers/groups.py` — added `POST /api/groups/{id}/contacts/bulk`.

## Algorithm
1. Read body (Pydantic already caps it at 20 entries).
2. Normalize every row's name/phone. If ANY row is invalid → 422 with `{"error":"bulk_rejected","reasons":[{"index":i,"reason":"..."}]}`.
3. Fetch existing phones in this group. Partition normalized rows into `to_insert` (new) vs `duplicates` (already-present in group OR repeated within the batch).
4. If `existing_count + len(to_insert) > 20` → 409 with `{"error":"group_full","max":20,"current":N,"would_add":M}`. The batch is rejected as a whole; partial inserts would violate the all-or-nothing semantics from the PLAN.
5. `add_all` + commit. Refresh each row, build response.
6. For each duplicate, also load and include the existing record under `skipped`.

## Acceptance — 5 curl smoke cases
| Case | Expected | Got |
|---|---|---|
| valid batch of 5 | 201, inserted=5, skipped=0 | inserted=5 skipped=0 |
| one bad phone in batch of 3 | 422 bulk_rejected listing index=1 | confirmed |
| batch w/ duplicate of existing phone | 201, inserted=1, skipped=1 | inserted=1 skipped=1 |
| batch that overflows the cap (6+15>20) | 409 group_full current=6 would_add=15 | confirmed |
| batch of 21 | 422 (Pydantic max_length=20) | "List should have at most 20 items" |
| final state | 6 contacts | 6 contacts |

## Backend
- Killed iter6 PID (11132), restarted with clean app.db.
- New PID 39988, recorded to `docs/.support/logs/backend.pid`.

## Security audit notes
- All bulk inputs go through `normalize_phone` before any DB write. PASS.
- Bulk response shape stays Pydantic-typed (`BulkContactsResponse`). PASS.
- Error responses use `HTTPException.detail` dicts (wrapped under `detail` key by FastAPI). Same shape concern as in iter6 — defer to Ticketing.

## Decisions
- Treated duplicates as `skipped`, not as errors. This is friendly bulk-import semantics: re-uploading the same CSV is a no-op for those rows.
- Overflow check uses `len(to_insert)` (de-duplicated), not raw batch length, so re-uploading the same CSV cannot trip the 20-cap.

## Commit
About to commit `feat(B-04): bulk-add contacts with all-or-nothing validation` and push.

## Next iteration
**Backend Agent** runs B-05 (wars singleton + connection endpoints — pairing state machine and QR data URL exposure).
