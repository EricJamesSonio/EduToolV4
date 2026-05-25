"use client";

const solutions = [
  {
    eyebrow: "School setup",
    heading: "Set Up Your Academic System with Ease",
    body: "Quickly configure programs, levels, sections, and subjects — all tailored to how your school actually operates.",
    points: [
      "Supports K–12, college, and custom programs",
      "Flexible academic hierarchy",
      "No rigid system limitations",
    ],
    video: "/videos/setup.mp4",
  },
  {
    eyebrow: "Class management",
    heading: "Organize Classes and Students Efficiently",
    body: "Easily manage enrollments, assign students to classes, and keep everything structured and accessible.",
    points: [
      "Simple student enrollment",
      "Clear class organization",
      "Centralized management dashboard",
    ],
    video: "/videos/classes.mp4",
  },
  {
    eyebrow: "Grading system",
    heading: "Streamline Grading and Evaluation",
    body: "Create grading schemes once and reuse them across subjects and programs — with full control over finalization.",
    points: [
      "Reusable grading schemes",
      "Custom grading scales",
      "Grade locking for accuracy",
    ],
    video: "/videos/grading.mp4",
  },
  {
    eyebrow: "Fast onboarding",
    heading: "Launch Your School Faster",
    body: "Use built-in templates and the organization seeder to skip repetitive setup and get started instantly.",
    points: [
      "Prebuilt templates",
      "Automated academic setup",
      "Consistent configurations",
    ],
    video: "/videos/seeder.mp4",
  },
];

function VideoPreview({ src }: { src: string }) {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-border bg-muted shadow-sm">
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-auto object-cover"
      />
    </div>
  );
}

export function SolutionSection() {
  return (
    <section
      id="solutions"
      className="page-container py-24 md:py-32 bg-white"
    >
      {/* HEADER */}
      <div className="text-center space-y-5 max-w-3xl mx-auto mb-20">
        <div className="flex justify-center">
          <div className="section-accent" />
        </div>

        <h2 className="font-bold">
          Everything You Need to Manage Your School
        </h2>

        <p className="text-lg text-muted-foreground">
          From setup to grading, EduTool helps administrators, educators,
          and students stay organized and in control.
        </p>
      </div>

      {/* CONTENT */}
      <div className="space-y-24">
        {solutions.map((item, index) => {
          const isReversed = index % 2 !== 0;

          return (
            <div key={index}>
              {index > 0 && <hr className="border-border mb-24" />}

              <div
                className={`flex flex-col md:flex-row items-stretch gap-14 ${
                  isReversed ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* TEXT */}
                <div className="flex-[0.9] space-y-6 flex flex-col justify-center">
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    {item.eyebrow}
                  </p>

                  <h3 className="font-semibold">{item.heading}</h3>

                  <p className="text-muted-foreground leading-relaxed text-lg">
                    {item.body}
                  </p>

                  <ul className="space-y-3">
                    {item.points.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-base text-muted-foreground"
                      >
                        <span className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* VIDEO */}
                <div className="flex-[1.4] w-full h-full self-stretch">
                  <VideoPreview src={item.video} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}