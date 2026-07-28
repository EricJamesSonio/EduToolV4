"use client";

const steps = [
  "Create your organization",
  "Add academic programs",
  "Enroll educators",
  "Register students",
  "Configure grading & assessments",
  "Start managing operations",
];

export function WorkflowSection() {
  return (
    <section className="page-container py-6 md:py-10 space-y-14">
      {/* Header */}
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="section-accent"></div>
        </div>
        <h2 className="font-bold not-interactive">
          Get Your School Running in Minutes
        </h2>
        <p className="text-lg text-muted-foreground not-interactive">
          From organization creation to full operation — a simple workflow designed for school administrators
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="max-w-2xl mx-auto relative">
        {/* Vertical connecting line */}
        <div className="hidden sm:block absolute left-[26px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary via-accent to-primary/20 rounded-full"></div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="relative flex items-start gap-6 group">
              {/* Step Number */}
              <div className="relative z-10 flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary to-accent text-white rounded-2xl flex items-center justify-center font-heading font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow duration-200 not-interactive">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* Step Content */}
              <div className="flex-grow pt-3">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200 not-interactive">{step}</p>
                <p className="text-base text-muted-foreground mt-0.5 not-interactive">
                  {index === 0 && "Set up your institution profile, add school details, and configure preferences"}
                  {index === 1 && "Define programs like College, SHS, Elementary with custom levels and sections"}
                  {index === 2 && "Create educator accounts and assign them to classes and subjects"}
                  {index === 3 && "Enroll students into programs, sections, and set up their academic records"}
                  {index === 4 && "Set up grading schemes, scales, and enable the assessment generator for automatic scoring"}
                  {index === 5 && "Monitor classes, track grades, hold video meetings, and manage day-to-day operations"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
