export interface GuideStep {
  title: string;
  content: string;
}

export interface GuideContent {
  title: string;
  description: string;
  steps: GuideStep[];
}

const folder = (slug: string) => `/guides/admin/${slug.replace("admin_", "")}`;

function stepImage(folderPath: string, index: number): string {
  return `${folderPath}/step-${index + 1}.png`;
}

export const GUIDES: Record<string, GuideContent> = {
  admin_dashboard: {
    title: "Dashboard",
    description: "Overview of school statistics and enrollment data",
    steps: [
      { title: "Overview", content: "Dashboard shows key system metrics at a glance." },
      { title: "School Year Selector", content: "Switch between school years to view data." },
      { title: "Statistics Cards", content: "Shows students, educators, classes, and pending students." },
      { title: "Enrollment Breakdown", content: "Displays program, level, section, and student counts." },
    ],
  },

  admin_organization: {
    title: "Organization",
    description: "Manage school settings and configuration",
    steps: [
      { title: "Organization Details", content: "Update school name and description." },
      { title: "Email Extension", content: "Required before creating users (students/educators)." },
      { title: "Data Seeder", content: "Generate programs, levels, courses, sections, and strands." },
    ],
  },

  admin_academic_calendar: {
    title: "Academic Calendar",
    description: "Manage holidays and program schedules",
    steps: [
      { title: "Holiday Calendar", content: "Set global holidays for all programs." },
      { title: "Program Calendar", content: "Configure program-specific schedules and breaks." },
      { title: "School Year Switch", content: "Manage calendars per academic year." },
    ],
  },

  admin_audit_log: {
    title: "Audit Log",
    description: "Track all system activities",
    steps: [
      { title: "Admin Actions", content: "Tracks student, class, and system changes." },
      { title: "Educator Actions", content: "Tracks class activities and grading actions." },
      { title: "Filtering", content: "Filter logs by date, type, and entity." },
    ],
  },

  admin_classes: {
    title: "Classes",
    description: "Manage class assignments and schedules",
    steps: [
      { title: "Create Classes", content: "Assign subjects, educators, and schedules." },
      { title: "Filters", content: "Filter by semester, educator, and school year." },
      { title: "Archive Classes", content: "Hide or disable inactive classes." },
    ],
  },

  admin_educators: {
    title: "Educators",
    description: "Manage teacher accounts",
    steps: [
      { title: "Create Educators", content: "Add new teaching staff." },
      { title: "Reset Password", content: "Generate new credentials when needed." },
      { title: "Email Extension", content: "Required before creating accounts." },
    ],
  },

  admin_grade_lock: {
    title: "Grade Lock",
    description: "Control grade submission and locking",
    steps: [
      { title: "Templates", content: "Create reusable grade lock rules." },
      { title: "Apply Templates", content: "Assign locks to classes." },
      { title: "Overrides", content: "Manually unlock or override grades." },
    ],
  },

  admin_grading_scales: {
    title: "Grading Scales",
    description: "Define grading ranges",
    steps: [
      { title: "Create Scales", content: "Define grade ranges like Excellent, Good, etc." },
      { title: "Assign to Programs", content: "Link scales to academic programs." },
    ],
  },

  admin_grading_schemes: {
    title: "Grading Schemes",
    description: "Manage grading structure templates",
    steps: [
      { title: "Create Schemes", content: "Define weight distribution (e.g. 40/30/30)." },
      { title: "Assign to Classes", content: "Apply schemes to programs or classes." },
    ],
  },

  admin_programs: {
    title: "Programs",
    description: "Manage academic programs",
    steps: [
      { title: "Create Programs", content: "Add academic programs like STEM or ABM." },
      { title: "Delete Rules", content: "Cannot delete if linked to levels or courses." },
    ],
  },

  admin_school_years: {
    title: "School Years",
    description: "Manage academic years",
    steps: [
      { title: "Create School Year", content: "Define academic year range." },
      { title: "Activate Year", content: "Only one active year at a time." },
    ],
  },

  admin_sections: {
    title: "Sections",
    description: "Manage class sections",
    steps: [
      { title: "Create Sections", content: "Assign sections to levels." },
      { title: "Filters", content: "Filter by program, level, and course." },
    ],
  },

  admin_semester_settings: {
    title: "Semester Settings",
    description: "Configure semester structures",
    steps: [
      { title: "Templates", content: "Define semester structures per program type." },
      { title: "Assign", content: "Assign templates to programs." },
    ],
  },

  admin_students: {
    title: "Students",
    description: "Manage student accounts",
    steps: [
      { title: "Create Students", content: "Add or import students via CSV." },
      { title: "Filters", content: "Filter by status, section, and program." },
      { title: "Credentials", content: "Download or export login credentials." },
    ],
  },

  admin_subjects: {
    title: "Subjects",
    description: "Manage school subjects",
    steps: [
      { title: "Create Subjects", content: "Add new subjects with types and levels." },
      { title: "Categories", content: "Organize subjects by program, course, and strand." },
    ],
  },
};
