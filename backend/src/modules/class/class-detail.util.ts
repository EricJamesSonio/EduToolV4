import { DatabaseService } from '@/core/database/database.provider';

export async function loadClassDetail(
  db: DatabaseService,
  id: string,
  orgId: string,
) {
  const cls = await db.class.findFirst({
    where: { id, org_id: orgId, deleted_at: null },
    include: {
      schedules: { include: { room: { select: { name: true } } } },
      schoolYear: { select: { id: true, name: true } },
      educator: {
        select: {
          id: true,
          email: true,
          profile: { select: { full_name: true } },
        },
      },
      subject: {
        select: {
          id: true,
          name: true,
          program_id: true,
          course_id: true,
          strand_id: true,
          level_id: true,
          program: { select: { name: true } },
          course: {
            select: { name: true, program: { select: { name: true } } },
          },
          strand: {
            select: { name: true, program: { select: { name: true } } },
          },
          level: { select: { name: true } },
        },
      },
    },
  });

  if (!cls) return null;

  const [semester, section, activeCount] = await Promise.all([
    db.semester.findFirst({
      where: { id: cls.semester_id, org_id: orgId },
      select: { name: true, start_date: true, end_date: true },
    }),
    cls.section_id
      ? db.section.findFirst({
          where: { id: cls.section_id, org_id: orgId },
          select: { name: true, capacity: true },
        })
      : Promise.resolve(null),
    db.enrollment.count({
      where: { class_id: id, org_id: orgId, status: 'active' },
    }),
  ]);

  const subject = cls.subject;
  const educatorName = cls.educator?.profile?.full_name ?? null;

  return {
    ...cls,
    _count: { enrollments: activeCount },
    enrolled_count: activeCount,
    subject_name: subject?.name ?? null,
    educator_name: educatorName,
    educatorName,
    educator_email: cls.educator?.email ?? null,
    section_name: section?.name ?? null,
    section_capacity: section?.capacity ?? null,
    semester_name: semester?.name ?? null,
    semester_start_date: semester?.start_date ?? null,
    semester_end_date: semester?.end_date ?? null,
    school_year_title: cls.schoolYear?.name ?? null,
    program_id: subject?.program_id ?? null,
    program_name:
      subject?.program?.name ??
      subject?.course?.program?.name ??
      subject?.strand?.program?.name ??
      null,
    level_name: subject?.level?.name ?? null,
    course_name: subject?.course?.name ?? null,
    strand_name: subject?.strand?.name ?? null,
  };
}