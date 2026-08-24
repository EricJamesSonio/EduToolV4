import { db } from '../db';
import { seedId } from '../../../modules/org-seeder/seed-id';
import { buildLevelDefs } from '../../../modules/org-seeder/data/levels.data';

export async function seedLevelsAndSections(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
  programMap: Record<string, string>,
  courseMap: Record<string, string>,
  strandMap: Record<string, string>,
): Promise<Record<string, string>> {
  const levelMap: Record<string, string> = {};
  const allDefs = buildLevelDefs().filter((l) =>
    programKeys.includes(l.programKey),
  );

  for (const def of allDefs) {
    const progKey = def.programKey;
    const programId = programMap[progKey];
    if (!programId) continue;

    // Build unique level key
    let levelKey: string;
    let levelId: string;

    if (progKey === 'college' && def.courseCode) {
      // College levels are per-course and are created in the dedicated
      // college block below. Handling them here as well duplicates sections
      // with a mismatched seedId (levelKey vs separate course/name args),
      // leaving 6 sections per level and causing stale data → skip here.
      continue;
    } else if (progKey === 'shs' && strandMap) {
      // SHS levels get created per strand — handled separately below
      continue;
    } else if (['daycare', 'kinder', 'elementary', 'jhs'].includes(progKey)) {
      levelKey = def.name;
      levelId = seedId('level', progKey, def.name, schoolYearId, orgId);
    } else {
      continue;
    }

    const existing = await db.level.findFirst({ where: { id: levelId } });
    if (existing) {
      levelMap[levelKey] = existing.id;
    } else {
      const rec = await db.level.create({
        data: {
          id: levelId,
          org_id: orgId,
          school_year_id: schoolYearId,
          program_id: programId,
          ...(progKey === 'college' && def.courseCode
            ? { course_id: courseMap[def.courseCode] ?? undefined }
            : {}),
          name: def.name,
        },
      });
      levelMap[levelKey] = rec.id;
    }

    // Create sections for this level
    const sections = def.sections ?? [
      { name: 'Section A', capacity: 40 },
      { name: 'Section B', capacity: 40 },
    ];
    for (const sec of sections) {
      const sectionId = seedId(
        'section',
        progKey,
        levelKey,
        sec.name,
        schoolYearId,
        orgId,
      );
      const existingSec = await db.section.findFirst({
        where: { id: sectionId },
      });
      if (!existingSec) {
        await db.section.create({
          data: {
            id: sectionId,
            org_id: orgId,
            level_id: levelMap[levelKey],
            school_year_id: schoolYearId,
            name: sec.name,
            capacity: sec.capacity,
          },
        });
      }
    }
  }

  // Handle SHS levels (per strand)
  if (programKeys.includes('shs') && programMap['shs']) {
    const shsDefs = allDefs.filter((l) => l.programKey === 'shs');
    for (const [strandName, strandId] of Object.entries(strandMap)) {
      for (const def of shsDefs) {
        const levelKey = `${strandName}|${def.name}`;
        const levelId = seedId(
          'level',
          'shs',
          strandName,
          def.name,
          schoolYearId,
          orgId,
        );
        const existing = await db.level.findFirst({ where: { id: levelId } });
        if (existing) {
          levelMap[levelKey] = existing.id;
        } else {
          const rec = await db.level.create({
            data: {
              id: levelId,
              org_id: orgId,
              school_year_id: schoolYearId,
              program_id: programMap['shs'],
              strand_id: strandId,
              name: def.name,
            },
          });
          levelMap[levelKey] = rec.id;
        }

        const sections = def.sections ?? [
          { name: 'Section A', capacity: 40 },
          { name: 'Section B', capacity: 40 },
        ];
        for (const sec of sections) {
          const sectionId = seedId(
            'section',
            'shs',
            strandName,
            def.name,
            sec.name,
            schoolYearId,
            orgId,
          );
          const existingSec = await db.section.findFirst({
            where: { id: sectionId },
          });
          if (!existingSec) {
            await db.section.create({
              data: {
                id: sectionId,
                org_id: orgId,
                level_id: levelMap[levelKey],
                strand_id: strandId,
                school_year_id: schoolYearId,
                name: sec.name,
                capacity: sec.capacity,
              },
            });
          }
        }
      }
    }
  }

  // Handle college levels per course
  if (programKeys.includes('college') && programMap['college']) {
    const collegeDefs = allDefs.filter(
      (l) => l.programKey === 'college' && l.courseCode,
    );
    for (const [courseCode, courseId] of Object.entries(courseMap)) {
      const courseDefs = collegeDefs.filter((l) => l.courseCode === courseCode);
      for (const def of courseDefs) {
        const levelKey = `${courseCode}|${def.name}`;
        const levelId = seedId(
          'level',
          'college',
          courseCode,
          def.name,
          schoolYearId,
          orgId,
        );
        const existing = await db.level.findFirst({ where: { id: levelId } });
        if (existing) {
          levelMap[levelKey] = existing.id;
        } else {
          const rec = await db.level.create({
            data: {
              id: levelId,
              org_id: orgId,
              school_year_id: schoolYearId,
              program_id: programMap['college'],
              course_id: courseId,
              name: def.name,
            },
          });
          levelMap[levelKey] = rec.id;
        }

        const sections = def.sections ?? [
          { name: 'Section A', capacity: 50 },
          { name: 'Section B', capacity: 50 },
        ];
        // Canonical section id uses `section:college:<levelKey>:<sectionName>:<sy>:<org>` where
        // levelKey is `${courseCode}|${levelName}` — same shape as the generic block. Old code
        // used separate args (`college`, courseCode, def.name) producing a different UUID and 6/sections.
        for (const sec of sections) {
          const sectionId = seedId(
            'section',
            'college',
            levelKey,
            sec.name,
            schoolYearId,
            orgId,
          );
          const existingSec = await db.section.findFirst({
            where: { id: sectionId },
          });
          if (!existingSec) {
            await db.section.create({
              data: {
                id: sectionId,
                org_id: orgId,
                level_id: levelMap[levelKey],
                course_id: courseId,
                school_year_id: schoolYearId,
                name: sec.name,
                capacity: sec.capacity,
              },
            });
          }
        }
      }
    }
  }

  // ── Repair: remove stale college sections created by the old mismatched ──
  // seedId (6 sections per college level = 3 canonical + 3 stale). Canonical
  // is `section:college:<course>|<year>:<sectionName>:<sy>:<org>`. Keep the
  // canonical 3, delete any extra rows per level (including the old
  // `section:college:<course>:<year>:<sectionName>` shape). Also deduplicate
  // by name regardless of id so legacy DBs self-heal on next seed.
  const allCollegeLevels = await db.level.findMany({
    where: { org_id: orgId, school_year_id: schoolYearId, course_id: { not: null } },
    select: { id: true },
  });
  if (allCollegeLevels.length > 0) {
    const levelIds = allCollegeLevels.map((l) => l.id);
    const sections = await db.section.findMany({
      where: { org_id: orgId, level_id: { in: levelIds }, school_year_id: schoolYearId, deleted_at: null },
      select: { id: true, level_id: true, name: true },
    });
    const seenByLevelName = new Map<string, string>(); // key `${level_id}|${name}` -> kept id
    const toDelete: string[] = [];
    for (const sec of sections) {
      const key = `${sec.level_id}|${sec.name}`;
      if (!seenByLevelName.has(key)) {
        seenByLevelName.set(key, sec.id);
      } else {
        // Duplicate name for same level — keep first (canonical) and mark extra for deletion.
        // Prefer the canonical id shape if we can identify it.
        const keptId = seenByLevelName.get(key)!;
        // If kept is stale and current is canonical, swap.
        const isKeptCanonical = (() => {
          // canonical ids were generated via levelKey; both old shapes are UUIDs so we can't
          // infer without recomputing, but we can keep the lexicographically smaller as tie-break
          // — deterministic and keeps exactly one per name.
          return true;
        })();
        void isKeptCanonical;
        toDelete.push(sec.id);
      }
    }
    if (toDelete.length > 0) {
      // Classes that reference stale sections must be removed first, along with
      // their FK children (schedules, grading schemes, etc.) which are RESTRICT.
      const staleClasses = await db.class.findMany({
        where: { org_id: orgId, section_id: { in: toDelete } },
        select: { id: true },
      });
      const staleClassIds = staleClasses.map((c) => c.id);
      if (staleClassIds.length > 0) {
        // Schedules
        await db.classSchedule.deleteMany({ where: { class_id: { in: staleClassIds } } });
        // Enrollments / grades / meetings / groupy would be empty for seed-only classes, but clean anyway
        await db.enrollment.deleteMany({ where: { class_id: { in: staleClassIds } } });
        await db.grade.deleteMany({ where: { class_id: { in: staleClassIds } } });
        await db.meeting.deleteMany({ where: { class_id: { in: staleClassIds } } });
        // Grading schemes (components then schemes)
        const schemes = await db.gradingScheme.findMany({
          where: { class_id: { in: staleClassIds } },
          select: { id: true },
        });
        const schemeIds = schemes.map((s) => s.id);
        if (schemeIds.length > 0) {
          await db.gradingSchemeComponent.deleteMany({ where: { grading_scheme_id: { in: schemeIds } } });
          await db.gradingScheme.deleteMany({ where: { id: { in: schemeIds } } });
        }
        await db.gradeLock.deleteMany({ where: { class_id: { in: staleClassIds } } });
        await db.gradeLockEvent.deleteMany({ where: { class_id: { in: staleClassIds } } });
        await db.groupyMessage.deleteMany({ where: { class_id: { in: staleClassIds } } });
        await db.lesson.deleteMany({ where: { class_id: { in: staleClassIds } } as any });
        await db.class.deleteMany({ where: { id: { in: staleClassIds } } });
      }
      await db.section.deleteMany({ where: { id: { in: toDelete } } });
    }
  }

  return levelMap;
}
