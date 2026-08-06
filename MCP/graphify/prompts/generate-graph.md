# Graphify — AI Knowledge Book Generator

Graphify generates an AI-friendly knowledge book for any repository.

Instead of forcing AI agents to repeatedly scan the repository, Graphify produces
structured knowledge that helps them quickly understand the architecture,
features, relationships, and important implementation details while minimizing
context usage.

The source code always remains the source of truth.

---

# Goal

Your objective is to analyze the repository and generate a synchronized AI
knowledge book consisting of multiple artifacts.

These artifacts should allow future AI agents to:

1. Understand the repository architecture.
2. Locate relevant implementation areas.
3. Read only the necessary source files.
4. Avoid repeatedly scanning the entire repository.
5. Minimize token usage while maintaining accuracy.

The generated knowledge should serve as a navigation layer between the AI and
the source code.

---

# Output Files

You must generate and keep synchronized the following files.

```
mcp/
│
├── graph.json
├── Manual.md
├── symbols.json
└── fileSummaries.json
```

---

## graph.json

The repository knowledge book.

Contains enriched knowledge extracted from the repository.

Every concept should be independent and self-contained.

Each concept should include:

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

The graph should focus on explaining the repository rather than simply listing
files.

---

## Manual.md

The AI navigation guide.

Its purpose is NOT to explain the repository.

Its only purpose is helping AI agents locate the correct section of graph.json.

The manual should be concise.

For every concept inside graph.json include:

- Concept name
- Stable identifier
- Short description
- Keywords
- Location inside graph.json
- Related concepts (optional)

Example:

Authentication

Identifier:
authentication

Description:
Handles login, JWT authentication, middleware and user session.

Keywords:
login
jwt
middleware
guards
session

Location:
graph.json → concepts.authentication

---

Booking

Identifier:
booking

Description:
Booking workflow including reservation, pricing and checkout.

Keywords:
booking
reservation
payment
calendar

Location:
graph.json → concepts.booking

---

Never duplicate the detailed explanations from graph.json.

The manual is only a table of contents for AI agents.

---

## symbols.json

Contains repository symbols.

Include:

- classes
- interfaces
- functions
- methods
- enums
- exports
- components

Every symbol should reference its source file.

---

## fileSummaries.json

Generate one concise summary for every source file.

Each summary should include:

- Purpose
- Responsibilities
- Important exports
- Dependencies
- Related concepts

Do not duplicate implementation details.

---

# AI Knowledge Philosophy

Graphify is NOT documentation.

Graphify is NOT source code.

Graphify is an AI navigation layer.

The source code remains the final authority.

Graphify exists only to help AI agents quickly locate the correct knowledge
before reading implementation.

---

# Context Optimization Rules

Future AI agents should follow this order.

```
Manual.md

↓

Relevant Concept inside graph.json

↓

fileSummaries.json

↓

symbols.json

↓

Relevant source files
```

Never read the entire repository before consulting the generated knowledge.

Never read the entire graph.json unless explicitly required.

Always identify the relevant concept first.

Only read implementation files referenced by that concept.

---

# Knowledge Organization

Organize graph.json into high-level concepts instead of files.

Examples:

- Authentication
- Authorization (RBAC)
- User Management
- Booking
- Payments
- Resort Management
- Item Management
- Package Management
- Dashboard
- API Client
- Routing
- State Management
- Query Caching
- Components
- Styling
- Forms
- Database
- Services
- Background Jobs
- File Storage
- Notifications
- Search
- Maps
- Analytics
- Testing
- Configuration

Each concept should explain:

- What it is
- Why it exists
- How it works
- Which files implement it
- Which symbols are important
- Which concepts it depends on

---

# Enrichment Guidelines

Do not simply describe code.

Enrich the repository knowledge by explaining:

- Feature responsibilities
- Data flow
- Request flow
- Architecture decisions
- Component interactions
- Design patterns
- Important implementation notes
- Common extension points
- Relationships between features

The goal is to help future AI agents understand the repository without needing
to repeatedly inspect the same files.

---

# Synchronization Rules

The generated artifacts must always remain synchronized.

Whenever a concept is:

- added
- renamed
- removed
- split
- merged
- reorganized

you MUST update:

- graph.json
- Manual.md

Whenever symbols change:

Update:

- symbols.json

Whenever a file's responsibilities change:

Update:

- fileSummaries.json

Never update one artifact without updating the others when required.

---

# Stable Identifiers

Every concept must have a stable identifier.

Example:

authentication

booking

payments

dashboard

api-client

query-caching

role-based-access-control

state-management

These identifiers should remain stable across regenerations whenever possible.

Manual.md should reference concepts using these identifiers instead of line
numbers.

Good:

graph.json → concepts.authentication

Bad:

graph.json lines 150-210

Line numbers are unstable and must never be used.

---

# Source of Truth

The generated knowledge is a guide.

If implementation details are needed, the AI should always read the relevant
source files referenced by graph.json.

The source code always overrides the generated knowledge.

---

# Quality Requirements

The generated knowledge should:

- Minimize future AI context usage.
- Reduce repeated repository scanning.
- Help AI quickly locate relevant code.
- Explain architecture clearly.
- Keep concepts independent.
- Use stable identifiers.
- Remain synchronized across all generated artifacts.
- Be understandable by any AI coding assistant.

The goal is to make repository understanding fast, deterministic, and
token-efficient while preserving the source code as the ultimate source of
truth.
