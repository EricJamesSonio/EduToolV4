"use client";

const programs = [
  {
    name: "College",
    levels: ["First Year", "Second Year", "Third Year", "Fourth Year"],
  },
  {
    name: "Elementary",
    levels: ["Grade 1–6"],
  },
  {
    name: "Senior High School",
    levels: ["Grade 11–12"],
  },
  {
    name: "Technical & Vocational",
    levels: ["Custom structures"],
  },
  {
    name: "Custom Programs",
    levels: ["Configure your own hierarchy"],
  },
];

export function AcademicFlexibilitySection() {
  return (
    <section className="page-container py-16 md:py-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold">
          Built for Different Educational Structures
        </h2>
        <p className="text-lg text-muted-foreground">
          EduTool adapts to institutional workflows rather than forcing schools into rigid structures.
        </p>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program, index) => (
          <div
            key={index}
            className="bg-card border-2 border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="font-heading font-semibold text-lg mb-4">{program.name}</h3>
            <ul className="space-y-2">
              {program.levels.map((level, levelIndex) => (
                <li key={levelIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  {level}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}