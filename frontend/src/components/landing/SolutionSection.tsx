"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";

type Role = "admin" | "educator" | "student";

const solutionsByRole = {
  admin: [
    {
      eyebrow: "School setup",
      heading: "Set Up Your School in Minutes, Not Weeks",
      body:
        "Stop wasting hours configuring programs, subjects, and levels. EduTool lets you structure your academic system exactly how your school operates—quickly and without frustration.",
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
      body:
        "Managing students and class assignments shouldn't be messy. Easily enroll students, assign them to classes, and keep everything structured in one place.",
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
      body:
        "Avoid repetitive grading setup and manual mistakes. Create grading systems once and reuse them across subjects while keeping full control over final results.",
      points: [
        "Reusable grading schemes across subjects",
        "Custom grading scales that fit your school",
        "Grade locking to prevent unwanted changes",
      ],
      video: "/videos/grading.mp4",
    },
  ],

  educator: [
    {
      eyebrow: "Class management",
      heading: "Manage Classes Without the Busywork",
      body:
        "Handle lessons, assessments, attendance, and grading all in one place—without jumping between tools or spreadsheets.",
      points: [
        "Centralized class dashboard",
        "Quick access to lessons, attendance, and grades",
        "No more scattered tools or manual tracking",
      ],
      video: "/videos/educator/classes.mp4",
    },
    {
      eyebrow: "Assessment creation",
      heading: "Create Assessments in Minutes, Not Hours",
      body:
        "Skip manual exam creation. Generate quizzes and exams instantly using lesson content and built-in AI tools.",
      points: [
        "AI-powered question generation",
        "Supports multiple question types",
        "Edit before publishing",
      ],
      video: "/videos/educator/assessments.mp4",
    },
    {
      eyebrow: "Grading workflow",
      heading: "Grade Faster and Stay Accurate",
      body:
        "Automatically compute grades, track performance, and lock results with confidence—without manual errors.",
      points: [
        "Automatic grade computation",
        "Flexible grading schemes",
        "Lock grades to finalize results",
      ],
      video: "/videos/educator/grading.mp4",
    },
  ],

  student: [
    {
      eyebrow: "Assessments",
      heading: "Take Assessments with Ease",
      body:
        "Complete quizzes, exams, and activities with a smooth and guided experience—no confusion or lost progress.",
      points: [
        "Auto-save progress",
        "Resume anytime",
        "Clear status tracking",
      ],
      video: "/videos/student/assessments.mp4",
    },
    {
      eyebrow: "Grades & progress",
      heading: "Track Your Performance Clearly",
      body:
        "Instantly view grades and progress across all classes without waiting or confusion.",
      points: [
        "Term-by-term breakdown",
        "Visual progress indicators",
        "Real-time updates",
      ],
      video: "/videos/student/grades.mp4",
    },
    {
      eyebrow: "Learning experience",
      heading: "Stay Organized and Connected",
      body:
        "Access lessons, join meetings, and manage your academic life from one place.",
      points: [
        "Join live classes",
        "Access lessons anytime",
        "View schedules easily",
      ],
      video: "/videos/student/portal.mp4",
    },
  ],
};

// ── Shared context to pause other videos when one plays ──

interface PlayerCtxValue {
  playingRef: React.MutableRefObject<HTMLVideoElement | null>;
}

const PlayerCtx = createContext<PlayerCtxValue | null>(null);

function usePlayerCtx(): PlayerCtxValue {
  const ctx = useContext(PlayerCtx);
  if (!ctx) return { playingRef: { current: null } };
  return ctx;
}

// ── Optimized VideoPreview ────────────────────────────

function VideoPreview({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState(false);

  const { playingRef } = usePlayerCtx();

  // IntersectionObserver – begin loading metadata 300px before visible
  useEffect(() => {
    const el = containerRef.current;

    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "300px" },
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, []);

  // Sync playing state with actual video events
  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [inView]);

  // Click handler – play/pause toggle
  const handleClick = useCallback(() => {
    const video = videoRef.current;

    if (!video) return;

    if (playingRef.current && playingRef.current !== video) {
      playingRef.current.pause();
    }

    if (video.paused) {
      video.play().catch(() => {});
      playingRef.current = video;
    } else {
      video.pause();
    }
  }, [playingRef]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-border bg-muted shadow-sm relative cursor-pointer"
      onClick={handleClick}
    >
      {inView ? (
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          loop
          muted
          playsInline
          className="w-full h-auto object-cover block"
        />
      ) : (
        <div className="w-full bg-muted min-h-[200px]" />
      )}

      {/* Play button overlay */}
      {!playing && inView && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-primary/80 flex items-center justify-center shadow-lg hover:bg-primary hover:scale-105 transition-all">
            <svg
              className="w-6 h-6 text-white ml-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {playing && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-md">
            <span className="w-4 h-4 flex gap-1">
              <span className="w-1 h-full bg-primary rounded" />
              <span className="w-1 h-full bg-primary rounded" />
            </span>
          </div>
        </div>
      )}

      {/* Demo badge */}
      <div className="absolute bottom-3 right-3 text-xs bg-black/60 text-white px-2 py-1 rounded pointer-events-none">
        Demo
      </div>
    </div>
  );
}

// ── Provider wrapping the section ─────────────────────

function VideoPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const playingRef = useRef<HTMLVideoElement | null>(null);

  return (
    <PlayerCtx.Provider value={{ playingRef }}>
      {children}
    </PlayerCtx.Provider>
  );
}

// ── Main section ──────────────────────────────────────

export function SolutionSection() {
  const [role, setRole] = useState<Role>("admin");

  const solutions = solutionsByRole[role];

  return (
    <VideoPlayerProvider>
      <section
        id="solutions"
        className="page-container py-10 md:py-14 bg-white"
      >
        {/* HEADER */}
        <div className="text-center space-y-5 max-w-3xl mx-auto mb-10">
          <div className="flex justify-center">
            <div className="section-accent" />
          </div>

          <h2 className="font-bold">
            {role === "admin" && "Run Your School Without the Chaos"}
            {role === "educator" &&
              "Teach, Grade, and Manage Classes with Ease"}
            {role === "student" && "Stay on Top of Your Learning"}
          </h2>

          <p className="text-lg text-muted-foreground">
            See how EduTool works for your role—whether you're managing,
            teaching, or learning.
          </p>
        </div>

        {/* ROLE TOGGLE */}
        <div className="flex justify-center gap-2 mb-10">
          {[
            { key: "admin", label: "Administrator" },
            { key: "educator", label: "Educator" },
            { key: "student", label: "Student" },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setRole(r.key as Role)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                role === r.key
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="space-y-14">
          {solutions.map((item, index) => {
            const isReversed = index % 2 !== 0;

            return (
              <div key={index}>
                {index > 0 && (
                  <hr className="border-border mb-14" />
                )}

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

                    <h3 className="font-semibold">
                      {item.heading}
                    </h3>

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
        <div className="text-center mt-14">
          <button className="px-6 py-3 bg-primary text-white rounded-lg font-medium shadow">
            Request Access
          </button>
        </div>
      </section>
    </VideoPlayerProvider>
  );
}