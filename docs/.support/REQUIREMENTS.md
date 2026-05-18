# Watify — Requirements

Captured from the initial user conversation on 2026-05-18. This document is the contract the agents build against. Any change requires explicit user approval.

## Product
A single-user WhatsApp notification service for sending messages to curated friend watchlists.

## Tech Stack
- **Backend**: Python 3.13+ via `uv`, FastAPI, SQLite, APScheduler, `wars` library for WhatsApp.
- **Frontend**: Next.js (latest stable, App Router), React, TypeScript, Tailwind CSS.
- **WhatsApp**: `wars` library — file-backed session at `backend/whatsapp.db`.
- **Repo**: GitHub `marketcalls/Watify`.

## Functional Requirements

### F1. WhatsApp Connection
- F1.1 — Pair via QR scanned on phone. QR rendered in the browser as a data URL (see `docs/wars.md` §4).
- F1.2 — Session persists across restarts via SQLite file `backend/whatsapp.db`.
- F1.3 — UI shows connection state: `disconnected`, `pairing`, `ready`, `error`.
- F1.4 — Disconnect / re-pair button.

### F2. Test Messaging
- F2.1 — Send a test message to self (owner number, single-arg `wa.send(text)`).
- F2.2 — Send a test message to an arbitrary WhatsApp number.

### F3. Friend Groups (Watchlists)
- F3.1 — User can create multiple named friend groups.
- F3.2 — **Hard cap: 20 contacts per group.** Backend enforces; frontend disables Add at 20.
- F3.3 — CRUD on groups and contacts (name + E.164 phone number).
- F3.4 — Bulk upload: CSV / paste — max 20 rows per upload; rejects the whole file if any row is invalid.
- F3.5 — Phone number normalization (digits / +CC / spaces — see wars JID normalization).

### F4. Sending Messages
- F4.1 — Compose message → pick target group → send.
- F4.2 — **One message at a time** (no parallel sends to a group).
- F4.3 — **Random per-recipient delay between min/max seconds. Default 3–30s. User-configurable per send.**
- F4.4 — Live progress UI: sent / pending / failed per recipient.
- F4.5 — Each send produces a job record visible in history.

### F5. Scheduling
- F5.1 — Send Now (immediate dispatch).
- F5.2 — Schedule one-time send at a future date+time (user's local TZ).
- F5.3 — APScheduler with SQLite jobstore so jobs survive restart.
- F5.4 — Cancel a pending scheduled job.

### F6. Safety
- F6.1 — No bulk-marketing patterns. Daily send-count surfaced in UI as a soft cap reminder.
- F6.2 — `whatsapp.db` is gitignored. Never commit session bytes.
- F6.3 — Treat all phone numbers as sensitive; no logging of full numbers in conversation logs.

## Non-functional
- Single-user, runs locally. No auth UI.
- Backend on `http://localhost:8000`, frontend on `http://localhost:3000`.
- Dev servers stay running in the background while the loop iterates so the Verification Agent can hit them via Chrome MCP.

## Out of scope (v1)
- Multi-user / auth.
- Receiving messages / bot mode.
- Group chats (WhatsApp groups, distinct from friend groups).
- Recurring cron-style schedules.
- Media attachments (text only for v1).
