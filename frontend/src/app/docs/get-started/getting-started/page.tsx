import Link from "next/link";

export default function GettingStartedPage() {
  return (
    <article className="max-w-none">
      <div className="mb-12">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-4">
          2 min read
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Getting Started with Relief-ED
        </h1>
        <p className="text-lg text-muted-foreground">
          Set up your school structure and configure Relief-ED in minutes. This
          guide walks you through the initial setup process.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-12">
        {[
          { num: "1", title: "Create Organization", desc: "Set up your school details" },
          { num: "2", title: "Define Structure", desc: "Configure programs and levels" },
          { num: "3", title: "Use Seeder", desc: "Auto-generate academic setup" },
        ].map((step) => (
          <div key={step.num} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                {step.num}
              </span>
              <h3 className="font-heading font-semibold text-foreground">
                {step.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">{step.desc}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">
          Understanding the Multi-Tenant Model
        </h2>
        <p className="text-muted-foreground mb-4">
          Relief-ED is built on a three-tier system. Understanding this helps you
          set up your organization correctly:
        </p>

        <div className="space-y-3 mb-8">
          {[
            { role: "Platform Owner", desc: "Manages the entire Relief-ED system and creates school admin accounts" },
            { role: "School Admin", desc: "Has full control over one organization (your school). Creates educators and students, configures academic structure." },
            { role: "Educators & Students", desc: "Use the system within their specific school. All data is isolated and scoped to your organization." },
          ].map((item) => (
            <div key={item.role} className="rounded-xl border bg-card p-4">
              <h4 className="font-semibold text-foreground">{item.role}</h4>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="my-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Setup Steps
        </h2>

        {[
          {
            title: "1. Complete Your Organization Profile",
            content:
              "Go to Admin Dashboard to Organization Settings. Fill in your school name, address, and email extension (optional but recommended for auto-generated email addresses).",
          },
          {
            title: "2. Define Your Academic Structure",
            content:
              "Create your programs (e.g., College, Senior High School) and assign levels to each. This structure forms the foundation of your school's organization.",
          },
          {
            title: "3. Use the Organization Seeder (Optional)",
            content:
              "Don't want to set everything up manually? Use the Organization Seeder to quickly generate a complete school structure with predefined options. Perfect for fast, consistent setup.",
          },
          {
            title: "4. Configure Grading (Recommended)",
            content:
              "Set up grading scales and schemes before educators start entering grades. You can create global templates that are reused across programs.",
          },
        ].map((step, idx) => (
          <div key={idx} className="mb-5 rounded-xl border bg-card p-6 space-y-2">
            <h3 className="font-heading font-semibold text-foreground text-lg">
              {step.title}
            </h3>
            <p className="text-muted-foreground">{step.content}</p>
          </div>
        ))}
      </section>

      <section className="my-12 rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Next Steps
        </h2>
        <p className="text-muted-foreground">
          Once your organization is set up, you are ready to:
        </p>
        <div className="space-y-2">
          <Link
            href="/docs/get-started/enroll-students"
            className="block rounded-lg border bg-muted/30 px-4 py-3 hover:bg-primary/5 hover:border-primary/30 transition-all"
          >
            <span className="font-medium text-foreground text-sm">
              Learn how to enroll students
            </span>
          </Link>
          <Link
            href="/docs/get-started/grading-guide"
            className="block rounded-lg border bg-muted/30 px-4 py-3 hover:bg-primary/5 hover:border-primary/30 transition-all"
          >
            <span className="font-medium text-foreground text-sm">
              Set up grading schemes and scales
            </span>
          </Link>
        </div>
      </section>
    </article>
  );
}