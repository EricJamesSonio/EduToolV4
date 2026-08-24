# .ai — this project's index

The full reference map (what every `rules/`, `skills/`, and `agents/` file
covers, and how they fit together) lives in the shared submodule, not here:

→ `.ai/shared/INDEX.md`

This file stays a one-paragraph pointer on purpose — duplicating that map
locally would just be one more copy to drift out of sync every time
`ai-skills` changes. What's actually local to this project:

- `.ai/rules/CORE.md` — Part 1/2 mirror the shared `CORE-template.md`;
  Part 3 (domain codes) is this project's own.
- `.ai/rules/project.md` — this project's stack/purpose/scope.
- `.ai/skills/*/FACTS.md` — this project's stack facts per domain.
- `.ai/workspace/` — this project's current state, known issues, roadmap,
  decisions, changelog.
- Ticket coordination — not in this folder at all; see the `ticket-state`
  branch, per `.ai/shared/rules/git-workflow.md` §Ticket-state protocol.

Every agent's actual entry point every ticket is still just
`.ai/rules/CORE.md` — this file is a map, not something read per ticket.
