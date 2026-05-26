export default function EnrollStudentsPage() {
  return (
    <article className="max-w-none">
      <div className="mb-12">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">
          8 min read
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          How to Enroll Students
        </h1>
        <p className="text-lg text-muted-foreground">
          Learn the step-by-step process to add students to programs, levels,
          sections, and classes in EduTool.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 mb-12 space-y-2">
        <h3 className="font-heading font-semibold text-foreground">
          Understanding Enrollment Flow
        </h3>
        <p className="text-sm text-muted-foreground">
          Students are enrolled in a hierarchy: Program to Level to Section to
          Class. Each level represents a different scope of enrollment.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-6">
          Enrollment Methods
        </h2>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Method 1: Single Student Enrollment
          </h3>
          <p className="text-muted-foreground mb-4">
            For adding individual students one at a time:
          </p>
          <div className="space-y-3 mb-6">
            {[
              "Go to Admin Dashboard, Students",
              "Click 'Add Student' button",
              "Fill in student details (name, email, ID)",
              "Select program, level, and section",
              "Optionally assign to specific classes",
              "Click 'Save'",
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                  {idx + 1}
                </span>
                <p className="text-foreground font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Method 2: Bulk Import (CSV)
          </h3>
          <p className="text-muted-foreground mb-4">
            For enrolling multiple students at once using a CSV file:
          </p>

          <div className="rounded-xl border bg-card p-5 mb-6 space-y-3">
            <h4 className="font-semibold text-foreground">
              CSV File Format
            </h4>
            <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded overflow-x-auto">
              student_id,first_name,last_name,email,program,level,section<br />
              S001,John,Doe,john@school.edu,College,1st Year,A<br />
              S002,Jane,Smith,jane@school.edu,SHS,Grade 11,B
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>- All fields are required</li>
              <li>- Email must be unique</li>
              <li>- Program and level must already exist in your system</li>
            </ul>
          </div>

          <div className="space-y-3 mb-6">
            {[
              "Go to Admin Dashboard, Students, Import",
              "Download the CSV template",
              "Fill in student data",
              "Upload the CSV file",
              "Review and confirm",
              "Students are enrolled automatically",
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                  {idx + 1}
                </span>
                <p className="text-foreground font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Method 3: Class-Level Enrollment
          </h3>
          <p className="text-muted-foreground mb-4">
            Enroll students directly into a specific class:
          </p>
          <div className="space-y-3 mb-6">
            {[
              "Go to Admin Dashboard, Classes",
              "Select a class",
              "Click 'Enroll Students' tab",
              "Search and select students",
              "Click 'Enroll'",
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                  {idx + 1}
                </span>
                <p className="text-foreground font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="my-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Best Practices
        </h2>
        <div className="space-y-3">
          {[
            { title: "Set up structure first", desc: "Ensure all programs, levels, and sections exist before enrolling students." },
            { title: "Use bulk import for scale", desc: "CSV import is much faster for schools with 100+ students." },
            { title: "Verify emails", desc: "Make sure email addresses are unique. Duplicate emails will cause import failures." },
            { title: "Plan class assignments", desc: "Decide early which educators teach which classes to make assignments smoother." },
          ].map((tip, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-4 space-y-1">
              <h4 className="font-semibold text-foreground">{tip.title}</h4>
              <p className="text-sm text-muted-foreground">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="my-12 rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Common Questions
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-foreground">
              Can a student be in multiple classes?
            </h4>
            <p className="text-muted-foreground mt-1">
              Yes, students can be enrolled in multiple classes within the same
              level or section.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">
              What if I enroll a student incorrectly?
            </h4>
            <p className="text-muted-foreground mt-1">
              You can edit or remove student enrollments from their profile or
              the class page anytime.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">
              Do students get auto-generated credentials?
            </h4>
            <p className="text-muted-foreground mt-1">
              Yes, students are created with temporary credentials and can reset
              their password on first login.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}