# Phase 2 — Backend: Section Capacity Floor Validation

## Goal
Nobody — admin or registrar — can lower a section's capacity below its current enrolled student count. This is a universal data-integrity rule, enforced once, server-side.

## What to change

**`backend/src/modules/section/section.service.ts` → `update()`**

Current implementation applies `dto.capacity` directly with no floor check. Add a guard before calling `sectionRepository.update()`:

```ts
async update(id: string, orgId: string, dto: UpdateSectionDto, actorId: string) {
  const section = await this.sectionRepository.findById(id, orgId);
  if (!section) throw new NotFoundException('Section not found.');

  if (dto.capacity !== undefined) {
    const enrolledCount = await this.sectionRepository.countStudentsInSection(id);
    if (dto.capacity < enrolledCount) {
      throw new ConflictException(
        `Cannot set capacity to ${dto.capacity} — this section currently has ${enrolledCount} enrolled student(s). Lower the enrollment first, or set capacity to at least ${enrolledCount}.`,
      );
    }
  }

  const updated = await this.sectionRepository.update(id, {
    name: dto.name,
    capacity: dto.capacity,
  });

  // ...existing audit log call unchanged
}
```

`countStudentsInSection` already exists on `SectionRepository` (used by `SectionService.countStudentsInSection()`), so this reuses existing plumbing — no new query logic needed.

`ConflictException` is already imported in this file (used in `remove()`), so no new import needed either.

## Acceptance check
- Section with 30 enrolled students, attempt to set capacity to 20 → `409 Conflict` with the message above.
- Same section, set capacity to 30 or higher → succeeds.
- Section with 0 enrolled students → any capacity value succeeds.

---

## AI Prompt

```
Context: EduTool backend (NestJS). File: backend/src/modules/section/section.service.ts

Task: In the `update()` method, add a validation guard before the capacity is
persisted: if `dto.capacity` is provided and is less than the section's current
enrolled student count (use the existing `countStudentsInSection` repository
method), throw a ConflictException with a clear message stating the current
enrolled count and that capacity cannot go below it.

Do not change the method signature, do not touch the audit log call, and do not
add a new repository method — countStudentsInSection already exists and is used
elsewhere in this same file. ConflictException is already imported in this file.

This rule applies to ALL callers (admin and registrar alike) — it is not
role-specific, so do not add any role checks here.

Show me the diff before applying.
```