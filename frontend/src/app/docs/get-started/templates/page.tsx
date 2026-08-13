export default function TemplatesPage() {
  return (
    <article className="max-w-none">
      <div className="mb-12">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">
          6 min read
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Ready-Made Templates
        </h1>
        <p className="text-lg text-muted-foreground">
          Use pre-configured templates to quickly set up your school structure.
          Perfect for standard school types like SHS and colleges.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Why Use Templates?
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: "Save Time", desc: "Skip repetitive configuration. Get started in minutes instead of hours." },
            { title: "Best Practices", desc: "Templates follow proven school structures and grading practices." },
            { title: "Consistency", desc: "Ensure all departments follow the same structure and standards." },
            { title: "Reusable", desc: "Apply the same template across multiple departments or years." },
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-5 space-y-2">
              <h3 className="font-heading font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Available Templates
        </h2>

        <div className="mb-8 rounded-xl border bg-card p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Senior High School (SHS)
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Standard 3-year SHS curriculum structure with tracks and strands
              </p>
            </div>
            <span className="shrink-0 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
              Popular
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Structure:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Grade 11 (1st Year)</li>
                <li>- Grade 12 (2nd Year)</li>
                <li>- Grade 13 (3rd Year)</li>
                <li>- Pre-configured tracks (e.g., STEM, ABM, HUMSS)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Included:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Standard grading scheme (40-30-20-10)</li>
                <li>- 4-point grading scale (A-D/E)</li>
                <li>- 2-semester academic calendar</li>
                <li>- Pre-defined core subjects</li>
              </ul>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Use This Template
          </button>
        </div>

        <div className="mb-8 rounded-xl border bg-card p-6 space-y-5">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              College / University
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Flexible structure for degree departments with majors and specializations
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Structure:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- 1st Year through 4th Year</li>
                <li>- Department-specific courses</li>
                <li>- Flexible course grouping</li>
                <li>- Support for honors and regular sections</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Included:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Grade-based grading scheme</li>
                <li>- 5-point scale (A+ to F)</li>
                <li>- 2-semester calendar with final exams</li>
                <li>- Academic integrity settings</li>
              </ul>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Use This Template
          </button>
        </div>

        <div className="mb-8 rounded-xl border bg-card p-6 space-y-5">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              Elementary School
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Simplified structure for elementary education with integrated subjects
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Structure:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Grade 1 through Grade 6</li>
                <li>- Class-based organization</li>
                <li>- Integrated subject structure</li>
                <li>- Competency-based grading option</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Included:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Competency-based grading scheme</li>
                <li>- 3-level scale (Advanced, Proficient, Developing)</li>
                <li>- 4-quarter calendar</li>
                <li>- Parent communication templates</li>
              </ul>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Use This Template
          </button>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          How to Apply a Template
        </h2>
        <div className="space-y-3">
          {[
            { title: "Access Templates", desc: "Go to Admin Dashboard, Organization or School Year Settings" },
            { title: "Browse Available Templates", desc: "View all pre-made templates with descriptions and preview" },
            { title: "Select a Template", desc: "Choose the template that matches your school structure" },
            { title: "Review Configuration", desc: "See what will be created: departments, levels, grading scheme, etc." },
            { title: "Apply Template", desc: "Click 'Apply' to automatically create the entire structure" },
            { title: "Customize (Optional)", desc: "Fine-tune any settings after template is applied" },
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
          Customizing Templates
        </h2>
        <p className="text-muted-foreground mb-6">
          Templates are starting points. You can customize any part after
          applying:
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            "Add or remove levels",
            "Modify grading schemes",
            "Adjust academic calendar",
            "Add custom subjects",
            "Update grading scales",
            "Customize section structure",
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-4">
              <p className="text-sm text-foreground font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Common Questions
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-foreground">
              Can I create my own custom template?
            </h4>
            <p className="text-muted-foreground mt-1">
              Currently, templates are pre-designed. However, you can fully
              customize any template after applying it to fit your needs.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">
              Can I apply a template to an existing organization?
            </h4>
            <p className="text-muted-foreground mt-1">
              Templates are best used during initial setup. For existing
              organizations, you can manually add missing components or contact
              support.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">
              What if my school structure does not match any template?
            </h4>
            <p className="text-muted-foreground mt-1">
              You can start with the closest template and customize from there,
              or set up your structure manually using the admin interface.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}