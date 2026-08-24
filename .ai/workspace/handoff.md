# Agent Handoff — moved

Handoffs no longer live here as a single shared file. Two agents finishing
different tickets in the same session would silently overwrite each other's
context in a single `handoff.md` — the same class of race the `ticket-state`
branch exists to prevent everywhere else.

Handoffs are now per-ticket files at `ticket-state/handoffs/<TICK-ID>.md`,
written through the same fetch/reset/commit/push sequence as any other
ticket-state write. See `shared/rules/git-workflow.md` §Ticket-state
protocol → "Writing a handoff."

The template to use for each per-ticket handoff file is
`workspace/handoff-template.md` in this folder — copy its structure into
`ticket-state/handoffs/<TICK-ID>.md` when you need to hand off mid-ticket.

If you're an agent and you find yourself about to write to this file
directly: stop — this file is a pointer only, not a live handoff. Go create
or update `ticket-state/handoffs/<TICK-ID>.md` instead.
