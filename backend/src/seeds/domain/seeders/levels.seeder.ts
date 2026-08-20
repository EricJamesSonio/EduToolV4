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
      levelKey = `${def.courseCode}|${def.name}`;
      levelId = seedId(
        'level',
        progKey,
        def.courseCode,
        def.name,
        schoolYearId,
        orgId,
      );
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
        for (const sec of sections) {
          const sectionId = seedId(
            'section',
            'college',
            courseCode,
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

  return levelMap;
}
