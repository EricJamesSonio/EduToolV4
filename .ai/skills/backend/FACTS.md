# Backend Skill — Facts

<!--
Project-specific facts only. The permanent rules this project always
follows regardless of stack live in shared/skills/backend/MUST-HAVES.md —
read that first. shared/agents/onboarder.md is the only agent that writes
to this file; everyone else reads it.
-->

Last verified: <!-- fill in --> UNKNOWN — needs onboarder run

## Framework

Framework: <!-- e.g. NestJS — fill in -->

## Structure

```
modules/
├── <domain>/
│   ├── <domain>.controller.ts
│   ├── <domain>.service.ts
│   ├── <domain>.repository.ts
│   └── dto/
│       ├── create-<domain>.dto.ts
│       └── update-<domain>.dto.ts
```

## Project-specific conventions

<!-- e.g. naming, module boundaries, shared modules. -->

## Common pitfalls specific to this project

<!-- e.g. "Do not import the ORM client directly in services — always go
through the repository." / "Pagination must always use cursor-based
pagination, not offset." -->
