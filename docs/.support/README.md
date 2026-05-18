# `.support/` — Watify Agent Workspace

This directory is the **operational state** of the multi-agent loop building Watify. Humans can read it; only agents write to it.

## Layout
```
.support/
├── README.md             # this file
├── REQUIREMENTS.md       # the contract — what we're building
├── PLAN.md               # the work breakdown (Planning Agent populates)
├── PIPELINE.md           # current phase, agent, iteration counter
├── AGENTS.md             # role definitions for every agent
├── SERVERS.md            # how dev servers are run
├── tickets/              # one .md per ticket — status in frontmatter
├── conversations/        # one .md per loop iteration — full agent transcript
└── logs/                 # dev server stdout/stderr
```

## How to read what's happening
- `PIPELINE.md` — what's running right now and what's queued.
- `conversations/` — chronological transcripts. Latest file is the latest iteration.
- `tickets/` — grep by `status:` in frontmatter.
- `logs/backend.log` / `logs/frontend.log` — raw server output.

## How to intervene (Human manual input)
You can edit any file in this directory. Useful interventions:
- Add or update a ticket in `tickets/` with `status: open` — the next Ticketing or Resolving Agent iteration will pick it up.
- Edit `PIPELINE.md` to force a phase switch (e.g. set `phase: done` to stop the loop).
- Append a `[HUMAN]` line to the conversation log of the currently-running iteration.
