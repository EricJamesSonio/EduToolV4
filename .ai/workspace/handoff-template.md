# Agent Handoff — TICK-<DOMAIN>-<number>

This file documents work that is currently being handed from one agent
to another on this specific ticket. It should contain enough information
for the next agent to continue without repeating the previous
investigation.

Lives at `ticket-state/handoffs/<TICK-ID>.md`, written via the
`ticket-state` protocol (`shared/rules/git-workflow.md` §Ticket-state
protocol → "Writing a handoff") — never as a shared file across tickets.

## Ticket

- Ticket: TICK-<DOMAIN>-<number>
- Status:
- Assigned Agent:
- Date:
- Branch:
- Worktree:

## Objective

Describe what this ticket is intended to accomplish.

## Current State

Describe what has already been implemented or discovered.

## Completed

- [ ]

## Remaining

- [ ]

## Files Changed

- `path/to/file`
- `path/to/file`

## Important Discoveries

Record information discovered during implementation that another agent
would otherwise have to rediscover.

## Decisions Made

Record any implementation or architectural decisions made during this
work.

## Tests

### Tests Run

- Command:
- Result:

### Current Failures

Describe any failing tests and the known cause.

## Git

- Latest Commit:
- Commit Message:
- Branch:
- Uncommitted Changes:

## Known Problems

Describe anything that is currently unresolved.

## Do Not Repeat

Record approaches that were attempted and failed, including why they
failed.

## Next Steps

Provide the exact recommended next actions for the next agent.

## Handoff Notes

Any additional information that may help the next agent continue safely.

---

Transient file, scoped to this one ticket. Written by an agent stopping
mid-ticket (context limit, session end, deliberate handoff) so the next
agent doesn't repeat investigation. Delete it (via the ticket-state
protocol) once this ticket completes — not a permanent record. Permanent
history lives in the ticket's own Activity Log and in `changelog/`.
