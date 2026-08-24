# Database Skill — Facts

<!--
Project-specific facts only. Permanent indexing/N+1/migration/query rules
live in shared/skills/database/MUST-HAVES.md — read that first.
shared/agents/onboarder.md is the only agent that writes to this file.
-->

Last verified: <!-- fill in --> UNKNOWN — needs onboarder run

## Database

Engine: <!-- e.g. PostgreSQL — fill in -->
ORM: <!-- e.g. Prisma / TypeORM — fill in -->

## Core entities

```
[EntityA]
[EntityB]
[EntityC]
```

## Key relationships

```
[EntityA] 1---N [EntityB]
[EntityB] N---1 [EntityC]
```

## Business constraints (project invariants, not schema)

<!-- e.g. "An Order belongs to exactly one Customer."
e.g. "Approved bookings cannot overlap for the same room."
e.g. "Soft-deleted rows are excluded from all default queries." -->
