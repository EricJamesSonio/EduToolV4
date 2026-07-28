export default function GradingGuidePage() {
  return (
    <article className="max-w-none">
      <div className="mb-12">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">
          5 min read
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Grading Setup Guide
        </h1>
        <p className="text-lg text-muted-foreground">
          Configure grading schemes, scales, and grade locks. Everything you
           need to know about Relief-ED's flexible grading system.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-12">
        {[
          { title: "Grading Schemes", desc: "Define how grades are calculated (components, weights)" },
          { title: "Grading Scales", desc: "Map numerical scores to letter grades" },
          { title: "Grade Locks", desc: "Finalize grades and prevent changes" },
        ].map((item, idx) => (
          <div key={idx} className="rounded-xl border bg-card p-5 space-y-3">
            <h3 className="font-heading font-semibold text-foreground">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          1. Create a Grading Scheme
        </h2>
        <p className="text-muted-foreground mb-6">
          A grading scheme defines how student grades are calculated. It specifies
          the components (e.g., quizzes, exams) and their weights.
        </p>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Steps to Create a Scheme:
        </h3>
        <div className="space-y-3 mb-8">
          {[
            { title: "Access Grading Schemes", desc: "Go to Admin Dashboard, Grading Schemes" },
            { title: "Create New Scheme", desc: "Click 'Create Scheme' and give it a descriptive name (e.g., 'Standard Semester')" },
            { title: "Add Components", desc: "Define grade components like Participation (10%), Quizzes (20%), Midterm (30%), Final Exam (40%)" },
            { title: "Set Weights", desc: "Ensure weights add up to 100%. Component weights determine how each contributes to the final grade" },
            { title: "Save Scheme", desc: "Click 'Save'. The scheme is now available to assign to classes globally" },
          ].map((step, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                  {idx + 1}
                </span>
                <h4 className="font-semibold text-foreground">{step.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-9">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          2. Create a Grading Scale
        </h2>
        <p className="text-muted-foreground mb-6">
          A grading scale translates numerical scores into letter grades. For
          example: 90-100 = A, 80-89 = B, etc.
        </p>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Steps to Create a Scale:
        </h3>
        <div className="space-y-3 mb-8">
          {[
            { title: "Access Grading Scales", desc: "Go to Admin Dashboard, Grading Scales" },
            { title: "Create New Scale", desc: "Click 'Create Scale' and name it (e.g., 'Standard A-F Scale')" },
            { title: "Define Grade Ranges", desc: "Add grade ranges with letter grades and their corresponding score ranges" },
            { title: "Save Scale", desc: "Click 'Save'. The scale is now ready to assign to classes or educators" },
          ].map((step, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-4 space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                  {idx + 1}
                </span>
                <h4 className="font-semibold text-foreground">{step.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground pl-9">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-card p-5 mb-8 space-y-3">
          <h4 className="font-semibold text-foreground">
            Example Grading Scale
          </h4>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-foreground">A</span>
              <span className="text-muted-foreground">90 - 100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">B</span>
              <span className="text-muted-foreground">80 - 89</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">C</span>
              <span className="text-muted-foreground">70 - 79</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">D</span>
              <span className="text-muted-foreground">60 - 69</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">F</span>
              <span className="text-muted-foreground">Below 60</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          3. Assign Schemes and Scales to Classes
        </h2>
        <p className="text-muted-foreground mb-6">
          Once created, assign grading schemes and scales to specific classes or
          educators.
        </p>
        <div className="space-y-3">
          {[
            "Go to a Class or Educator's profile",
            "Navigate to Grading Settings",
            "Select a Grading Scheme and Scale",
            "Save the assignment",
            "Educators can now use these templates when entering grades",
          ].map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                {idx + 1}
              </span>
              <p className="text-foreground font-medium">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          4. Set Up Grade Locks
        </h2>
        <p className="text-muted-foreground mb-6">
          Grade locks finalize grades and prevent accidental changes. Use them
          when grades are submitted and reviewed.
        </p>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          How Grade Locks Work:
        </h3>
        <div className="space-y-3 mb-8">
          {[
            { title: "Lock Scope", desc: "Locks can be applied at different levels: entire school year, specific program, level, or section" },
            { title: "Prevent Editing", desc: "Once locked, educators cannot modify grades unless an admin grants override permission" },
            { title: "Override Option", desc: "Admins can override locks for specific grades if corrections are needed" },
            { title: "Audit Trail", desc: "All lock/unlock actions are logged for compliance and record-keeping" },
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-4 space-y-2">
              <h4 className="font-semibold text-foreground">{item.title}</h4>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          To Set Up Grade Locks:
        </h3>
        <div className="space-y-3">
          {[
            "Go to Admin Dashboard, Grade Locks",
            "Click 'Create Lock'",
            "Select the scope (school year, program, level, or section)",
            "Choose lock status: Active or Inactive",
            "Save the lock configuration",
          ].map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                {idx + 1}
              </span>
              <p className="text-foreground font-medium">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="my-12 rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Tips for Grading
        </h3>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-bold text-foreground">-</span>
            <span>
              <strong className="text-foreground">Create global templates early:</strong> Set up standard
              schemes and scales before classes start
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-foreground">-</span>
            <span>
              <strong className="text-foreground">Use descriptive names:</strong> Name schemes and scales
              clearly so educators know which to use
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-foreground">-</span>
            <span>
              <strong className="text-foreground">Communicate with educators:</strong> Let them know when
              grading configurations change
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-foreground">-</span>
            <span>
              <strong className="text-foreground">Lock at the right time:</strong> Lock grades after final
              submission and review, not before
            </span>
          </li>
        </ul>
      </section>
    </article>
  );
}