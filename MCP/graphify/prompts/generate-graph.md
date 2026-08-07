# Graphify — AI Knowledge Book Generator

Graphify generates an AI-friendly knowledge book for **any target repository**.

Instead of forcing AI agents to repeatedly scan the repository, Graphify produces
structured knowledge that helps them quickly understand the architecture,
features, relationships, and important implementation details while minimizing
context usage.

The source code always remains the source of truth.

This prompt is a **template**. It is intentionally repo-agnostic: every section
that references domain concepts, folder names, or frameworks is an example to be
replaced with whatever fits the repository you are actually analyzing.

---

# Goal

Analyze the repository and generate a synchronized AI knowledge book consisting of
multiple artifacts so future AI agents can:

1. Understand the repository architecture.
2. Locate relevant implementation areas.
3. Read only the necessary source files.
4. Avoid repeatedly scanning the entire repository.
5. Minimize token usage while maintaining accuracy.

The generated knowledge is a navigation layer between the AI and the source code.

---

# Output Files (where everything lives)

Graphify stores its own artifacts under a fixed `MCP/graphify/` location at the
root of the repository being analyzed, regardless of that repository's own
structure:

```
MCP/graphify/
├── symbol-index-storage/
│   └── symbols.json          <- INPUT: the raw symbol index
├── graphify-storage/
│   ├── graph.json            <- OUTPUT: the structured knowledge graph
│   └── graph.md              <- OUTPUT: human-readable report
└── prompts/
    ├── generate-graph.md     <- THIS prompt (re-run for regeneration)
    ├── AI-Manual.md          <- navigation TOC into graph.json
    └── graphify-cheatsheet.md
```

## graph.json (the knowledge book)

Every concept should be independent and self-contained. Each concept includes:

- Stable identifier
- Title
- Overview
- Detailed description
- Keywords
- Responsibilities
- Architecture notes
- Related concepts
- Important files
- Important symbols
- Implementation notes

The graph should focus on explaining the repository, not merely listing files.

The machine schema is `graphify/graphify-storage/graph.json` with:

- Top-level: `id`, `title`, `description`, `repoName`, `repoPath`, `exportedAt`,
  `generatedAt`, `graphVersion`, `stats`, `nodes[]`, `edges[]`, `features{}`, `concepts{}`.
- A **node** represents one source file:
  - `id` = `file-<path>`, `type` = `file`, `filePath`, `label`, `language`
  - `summary`, `responsibilities[]`, `features[]`, `tags[]`
  - `stats` = `{ totalSymbols, exportedSymbols, functions, classes, methods, variables }`
  - `symbols[]` = `{ name, type, line, signature, purpose, role }`
  - `summarySource` = `"ai"`, `graphVersion` = 2, `generationMode` = `"ai_generated"`
  - `centrality` = `{ fanIn, fanOut, degree, centrality, importCount, inDegree, outDegree, importedByCount }`
- An edge: `{ source, target, type, weight, description }`
  with types: `IMPORTS | PROVIDES_TO | USES | COLLABORATES_WITH | DEPENDS_ON | IMPLEMENTS`.
- A feature: `{ id, description, color, files[], fileCount }`.
- A concept: `{ id, description, keywords[], locations[] }`.

> **Concept source of truth:** authored concepts live in
> `graphify-storage/_build_graph.py` under `concepts_raw`. This script is what
> actually writes `graph.json` and `graph.md`. The `AI-Manual.md` TOC must mirror
> the same identifiers, descriptions and keywords. Locations in `concepts_raw`
> are automatically filtered at build time to paths that exist in the repo, so
> new concepts will automatically appear in future regenerations.

## AI-Manual.md (AI navigation guide)

`prompts/AI-Manual.md` is the table of contents into graph.json. It is **not**
documentation. For every concept it lists:

- Concept name, stable identifier, short description, keywords,
  location inside graph.json (e.g. `graph.json -> concepts.<concept-id>`),
  and related concepts (optional).

Never duplicate the repository explanation from graph.json.

## symbols.json (input)

Contains `files`, `symbols`, `imports`, `exportedAt`. One entry per symbol with
`name`, `type`, `line`, `column`, `isExported`, `className`, `signature`, `filePath`.
Every symbol references its source file.

## fileSummaries.json (optional)

One concise summary per source file: purpose, responsibilities, important exports,
dependencies, related concepts. Do not duplicate implementation details.

---

# Context Optimization Rules

Future AI agents should follow this order:

```
AI-Manual.md
  ↓
Relevant concept inside graph.json
  ↓
fileSummaries.json (if present)
  ↓
symbols.json
  ↓
Relevant source files
```

- Never read the whole repository before consulting the knowledge.
- Identify the relevant concept first; only read the implementation files it references.

---

# Knowledge Organization

Organize graph.json into high-level, independent concepts instead of per-file entries.

Concepts must reflect the **actual domain of the repository being analyzed** —
do not reuse a fixed list across projects. Derive concept names from what the
codebase actually does. Typical categories to look for (adapt names/identifiers
to the real domain found in the repo):

- Auth & session handling
- Access control / permissions
- API / client architecture (how the app talks to external services or a backend)
- Data fetching & caching layer (if a caching or query library is used)
- Core domain workflows (the primary thing the app/service does — e.g. checkout,
  onboarding, scheduling, whatever is central to this repo)
- Admin / management surfaces, if present
- Payments or billing, if present
- Any review/rating/feedback system, if present
- CRUD or management of the repo's core entities
- Any comparison, planning, or multi-step selection flows, if present
- Geolocation or maps, if present
- Public-facing browsing/discovery surfaces, if present
- Routing
- State management (whatever library the repo uses, if any)
- Styling system
- Server/backend assets (if the repo has a backend component, in whatever
  language/framework it actually uses)
- Background jobs, queues, or scheduled tasks, if present
- Testing infrastructure, if notable

This list is illustrative, not prescriptive. Add, remove, rename, split, or merge
concepts so they match the actual architecture and domain of the repo under
analysis. A repo with no payments system should have no payments concept; a repo
built around, say, a data pipeline or a CLI tool should have concepts reflecting
that instead.

Every concept that maps to a graph identifier must also be authored in
`_build_graph.py` (the `concepts_raw` list) so it survives regeneration.

Each concept explains **what** it is, **why** it exists, **how** it works,
which files implement it, which symbols matter and which concepts it depends on.

---

# Enrichment Guidelines

Do not just describe code; enrich the repository by explaining data flow, request
flow, architecture decisions, component interactions, design patterns, common
extension points, and relationships between features.

---

# Synchronization Rules

Whenever a concept is added/renamed/removed/split/merged/reorganized you must update
**graph.json**, **AI-Manual.md**, **graph.md**, and **`_build_graph.py`** (the
`concepts_raw` list is the authoritative definition). Whenever symbols change update
**symbols.json** and the node `symbols[]` in **graph.json**. Whenever a file's
responsibilities change update **graph.json** node + **fileSummaries.json**. Never
update one artifact without the others. Coverage check before finishing: every
queryable domain of the actual repo (whatever those domains turn out to be — e.g.
auth, payments, admin, background jobs, or anything else present) must be
represented by a concept, or an existing concept that mentions it in its keywords —
otherwise agents fall back to scanning the whole repo.

---

# Stable Identifiers

Concepts and locations use stable identifiers (not line numbers):

- Good: `graph.json -> concepts.<concept-id>`
- Bad: `graph.json lines 150-210`

Line numbers are unstable and must never be used.

---

# Source of Truth

The generated knowledge is a guide. The source code always overrides the generated
knowledge. If implementation details are needed, read the referenced source files.

---

# Quality Requirements

Minimize future AI context usage, reduce repeated scanning, help locate code quickly,
explain architecture clearly, keep concepts independent, use stable identifiers, stay
synchronized, and be understandable by any AI coding assistant.

---

# Regeneration Instructions

To regenerate the knowledge book for the target repository:

1. Regenerate the symbol index into `MCP/graphify/symbol-index-storage/symbols.json`.
2. Re-run the graph builder:
   `python MCP/graphify/graphify-storage/_build_graph.py`
3. Re-derived enrichment (summaries, symbol purpose/role, features, concepts) should be
   re-authored or merged — do not drop previously verified descriptions.
   Concepts are regenerated from the `concepts_raw` list in `_build_graph.py`; keep that
   list as the canonical set and only add/rename identifiers there.
4. Update `MCP/graphify/prompts/AI-Manual.md` to match any concept additions/renames.
5. Validate that `graph.json` parses and that counts match `symbols.json`.

Reference data used: the index at `MCP/graphify/symbol-index-storage/symbols.json`
(source of truth for symbols), and the actual source directories of the repo being
analyzed (identify these first — e.g. `src/`, `client/`, `server/`, `app/`, `lib/`,
or whatever the repo actually uses) — always read the real code before describing
a file or symbol.