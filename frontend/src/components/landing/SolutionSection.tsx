"use client";

const solutions = [
  {
    eyebrow: "School setup",
    heading: "Set Up Your School in Minutes, Not Weeks",
    body: "Stop wasting hours configuring programs, subjects, and levels. EduTool lets you structure your academic system exactly how your school operates—quickly and without frustration.",
    points: [
      "Supports K–12, college, and custom programs",
      "Flexible academic hierarchy that adapts to your system",
      "No rigid setup or limitations",
    ],
    video: "/videos/setup.mp4",
  },
  {
    eyebrow: "Class management",
    heading: "Keep Classes Organized Without the Chaos",
    body: "Managing students and class assignments shouldn’t be messy. Easily enroll students, assign them to classes, and keep everything structured in one place.",
    points: [
      "Simple and fast student enrollment",
      "Clear and organized class structure",
      "Centralized dashboard for full visibility",
    ],
    video: "/videos/classes.mp4",
  },
  {
    eyebrow: "Grading system",
    heading: "Finish Grading Faster and With Fewer Errors",
    body: "Avoid repetitive grading setup and manual mistakes. Create grading systems once and reuse them across subjects while keeping full control over final results.",
    points: [
      "Reusable grading schemes across subjects",
      "Custom grading scales that fit your school",
      "Grade locking to prevent unwanted changes",
    ],
    video: "/videos/grading.mp4",
  },
  {
    eyebrow: "Fast onboarding",
    heading: "Get Your School Running From Day One",
    body: "Skip repetitive setup and start faster. With built-in templates and automated configuration, you can launch your system without delays.",
    points: [
      "Prebuilt templates for faster setup",
      "Automated academic structure generation",
      "Consistent and reliable configurations",
    ],
    video: "/videos/seeder.mp4",
  },
];

function VideoPreview({ src }: { src: string }) {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-border bg-muted shadow-sm relative">
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-auto object-cover"
      />
      {/* Optional label for clarity */}
      <div className="absolute bottom-3 right-3 text-xs bg-black/60 text-white px-2 py-1 rounded">
        Demo
      </div>
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
          Run Your School Without the Chaos
        </h2>

        <p className="text-lg text-muted-foreground">
          EduTool helps you simplify operations, reduce manual work, and stay in
          control—from setup to grading and everything in between.
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
                  <p className="text-xs font-semibold tracking-widest uppercase text-primary">
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

      {/* CTA */}
      <div className="text-center mt-24">
        <button className="px-6 py-3 bg-primary text-white rounded-lg font-medium shadow">
          Request Access
        </button>
      </div>
    </section>
  );
}