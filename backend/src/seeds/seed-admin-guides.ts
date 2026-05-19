import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

export async function seedAdminGuides() {
  console.log('\n▶ Seeding Admin Guides + Steps...\n')

  const guides = [
    // ─────────────────────────────────────────────
    // DASHBOARD
    // ─────────────────────────────────────────────
    {
      slug: 'admin_dashboard',
      title: 'Dashboard',
      description: 'Overview of school statistics and enrollment data',
      steps: [
        { order: 1, title: 'Overview', content: 'Dashboard shows key system metrics at a glance.' },
        { order: 2, title: 'School Year Selector', content: 'Switch between school years to view data.' },
        { order: 3, title: 'Statistics Cards', content: 'Shows students, educators, classes, and pending students.' },
        { order: 4, title: 'Enrollment Breakdown', content: 'Displays program, level, section, and student counts.' },
      ],
    },

    // ─────────────────────────────────────────────
    // ORGANIZATION
    // ─────────────────────────────────────────────
    {
      slug: 'admin_organization',
      title: 'Organization',
      description: 'Manage school settings and configuration',
      steps: [
        { order: 1, title: 'Organization Details', content: 'Update school name and description.' },
        { order: 2, title: 'Email Extension', content: 'Required before creating users (students/educators).' },
        { order: 3, title: 'Data Seeder', content: 'Generate programs, levels, courses, sections, and strands.' },
      ],
    },

    // ─────────────────────────────────────────────
    // ACADEMIC CALENDAR
    // ─────────────────────────────────────────────
    {
      slug: 'admin_academic_calendar',
      title: 'Academic Calendar',
      description: 'Manage holidays and program schedules',
      steps: [
        { order: 1, title: 'Holiday Calendar', content: 'Set global holidays for all programs.' },
        { order: 2, title: 'Program Calendar', content: 'Configure program-specific schedules and breaks.' },
        { order: 3, title: 'School Year Switch', content: 'Manage calendars per academic year.' },
      ],
    },

    // ─────────────────────────────────────────────
    // AUDIT LOG
    // ─────────────────────────────────────────────
    {
      slug: 'admin_audit_log',
      title: 'Audit Log',
      description: 'Track all system activities',
      steps: [
        { order: 1, title: 'Admin Actions', content: 'Tracks student, class, and system changes.' },
        { order: 2, title: 'Educator Actions', content: 'Tracks class activities and grading actions.' },
        { order: 3, title: 'Filtering', content: 'Filter logs by date, type, and entity.' },
      ],
    },

    // ─────────────────────────────────────────────
    // CLASSES
    // ─────────────────────────────────────────────
    {
      slug: 'admin_classes',
      title: 'Classes',
      description: 'Manage class assignments and schedules',
      steps: [
        { order: 1, title: 'Create Classes', content: 'Assign subjects, educators, and schedules.' },
        { order: 2, title: 'Filters', content: 'Filter by semester, educator, and school year.' },
        { order: 3, title: 'Archive Classes', content: 'Hide or disable inactive classes.' },
      ],
    },

    // ─────────────────────────────────────────────
    // EDUCATORS
    // ─────────────────────────────────────────────
    {
      slug: 'admin_educators',
      title: 'Educators',
      description: 'Manage teacher accounts',
      steps: [
        { order: 1, title: 'Create Educators', content: 'Add new teaching staff.' },
        { order: 2, title: 'Reset Password', content: 'Generate new credentials when needed.' },
        { order: 3, title: 'Email Extension', content: 'Required before creating accounts.' },
      ],
    },

    // ─────────────────────────────────────────────
    // GRADE LOCK
    // ─────────────────────────────────────────────
    {
      slug: 'admin_grade_lock',
      title: 'Grade Lock',
      description: 'Control grade submission and locking',
      steps: [
        { order: 1, title: 'Templates', content: 'Create reusable grade lock rules.' },
        { order: 2, title: 'Apply Templates', content: 'Assign locks to classes.' },
        { order: 3, title: 'Overrides', content: 'Manually unlock or override grades.' },
      ],
    },

    // ─────────────────────────────────────────────
    // GRADING SCALES
    // ─────────────────────────────────────────────
    {
      slug: 'admin_grading_scales',
      title: 'Grading Scales',
      description: 'Define grading ranges',
      steps: [
        { order: 1, title: 'Create Scales', content: 'Define grade ranges like Excellent, Good, etc.' },
        { order: 2, title: 'Assign to Programs', content: 'Link scales to academic programs.' },
      ],
    },

    // ─────────────────────────────────────────────
    // GRADING SCHEMES
    // ─────────────────────────────────────────────
    {
      slug: 'admin_grading_schemes',
      title: 'Grading Schemes',
      description: 'Manage grading structure templates',
      steps: [
        { order: 1, title: 'Create Schemes', content: 'Define weight distribution (e.g. 40/30/30).' },
        { order: 2, title: 'Assign to Classes', content: 'Apply schemes to programs or classes.' },
      ],
    },

    // ─────────────────────────────────────────────
    // PROGRAMS
    // ─────────────────────────────────────────────
    {
      slug: 'admin_programs',
      title: 'Programs',
      description: 'Manage academic programs',
      steps: [
        { order: 1, title: 'Create Programs', content: 'Add academic programs like STEM or ABM.' },
        { order: 2, title: 'Delete Rules', content: 'Cannot delete if linked to levels or courses.' },
      ],
    },

    // ─────────────────────────────────────────────
    // SCHOOL YEARS
    // ─────────────────────────────────────────────
    {
      slug: 'admin_school_years',
      title: 'School Years',
      description: 'Manage academic years',
      steps: [
        { order: 1, title: 'Create School Year', content: 'Define academic year range.' },
        { order: 2, title: 'Activate Year', content: 'Only one active year at a time.' },
      ],
    },

    // ─────────────────────────────────────────────
    // SECTIONS
    // ─────────────────────────────────────────────
    {
      slug: 'admin_sections',
      title: 'Sections',
      description: 'Manage class sections',
      steps: [
        { order: 1, title: 'Create Sections', content: 'Assign sections to levels.' },
        { order: 2, title: 'Filters', content: 'Filter by program, level, and course.' },
      ],
    },

    // ─────────────────────────────────────────────
    // SEMESTER SETTINGS
    // ─────────────────────────────────────────────
    {
      slug: 'admin_semester_settings',
      title: 'Semester Settings',
      description: 'Configure semester structures',
      steps: [
        { order: 1, title: 'Templates', content: 'Define semester structures per program type.' },
        { order: 2, title: 'Assign', content: 'Assign templates to programs.' },
      ],
    },

    // ─────────────────────────────────────────────
    // STUDENTS
    // ─────────────────────────────────────────────
    {
      slug: 'admin_students',
      title: 'Students',
      description: 'Manage student accounts',
      steps: [
        { order: 1, title: 'Create Students', content: 'Add or import students via CSV.' },
        { order: 2, title: 'Filters', content: 'Filter by status, section, and program.' },
        { order: 3, title: 'Credentials', content: 'Download or export login credentials.' },
      ],
    },
  ]

  for (const guide of guides) {
    let existing = await db.guide.findUnique({
      where: { slug: guide.slug },
    })

    if (!existing) {
      existing = await db.guide.create({
        data: {
          slug: guide.slug,
          portal: 'admin',
          title: guide.title,
          description: guide.description,
          is_active: true,
        },
      })

      console.log(`  OK GUIDE   ${guide.slug}`)
    } else {
      console.log(`  SKIP GUIDE ${guide.slug}`)
    }

    for (const step of guide.steps) {
      const exists = await db.guideStep.findUnique({
        where: {
          guide_id_order_index: {
            guide_id: existing.id,
            order_index: step.order,
          },
        },
      })

      if (exists) {
        console.log(`    SKIP STEP ${guide.slug}#${step.order}`)
        continue
      }

      await db.guideStep.create({
        data: {
          guide_id: existing.id,
          order_index: step.order,
          title: step.title,
          content: step.content,
        },
      })

      console.log(`    OK STEP   ${guide.slug}#${step.order}`)
    }
  }

  console.log('\n✅ Admin Guides Seeded\n')
}