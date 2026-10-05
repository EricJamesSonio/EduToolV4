"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface DeviceFrameProps {
  src: string;
  alt: string;
}

function LaptopFrame({ src, alt }: DeviceFrameProps) {
  return (
    <div className="relative w-full">
      <div className="relative rounded-t-2xl border border-slate-700/70 bg-slate-900 p-[2.2%] pt-[3%] shadow-2xl">
        <span className="absolute left-1/2 top-[1.2%] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-600" />
        <div className="overflow-hidden rounded-md bg-background">
          <img src={src} alt={alt} className="block h-auto w-full" />
        </div>
      </div>

      <div className="relative -mx-[4%] h-3 rounded-b-2xl bg-gradient-to-b from-slate-300 to-slate-400 shadow-xl sm:h-4 dark:from-slate-600 dark:to-slate-800">
        <span className="absolute left-1/2 top-0 h-1 w-1/6 -translate-x-1/2 rounded-b-md bg-slate-500/50" />
      </div>
      <div className="mx-auto h-2 w-[92%] rounded-full bg-black/20 blur-xl" />
    </div>
  );
}

function PhoneFrame({ src, alt }: DeviceFrameProps) {
  return (
    <div className="relative rounded-[1.75rem] border border-slate-700/70 bg-slate-900 p-1.5 shadow-2xl sm:rounded-[2.25rem] sm:p-2">
      <span className="absolute -right-[3px] top-14 h-8 w-[3px] rounded-r bg-slate-700" />
      <span className="absolute -left-[3px] top-12 h-5 w-[3px] rounded-l bg-slate-700" />
      <span className="absolute -left-[3px] top-20 h-8 w-[3px] rounded-l bg-slate-700" />

      <div className="relative overflow-hidden rounded-[1.4rem] bg-background sm:rounded-[1.85rem]">
        <span className="absolute left-1/2 top-1.5 z-10 h-3 w-1/3 -translate-x-1/2 rounded-full bg-slate-900 sm:h-3.5" />
        <img src={src} alt={alt} className="block h-auto w-full" />
      </div>
    </div>
  );
}

export function HeroSection() {
  const { ref: leftSideRef, isInView: leftSideInView } = useScrollAnimation();
  const { ref: rightSideRef, isInView: rightSideInView } = useScrollAnimation();

  return (
    <section
      id="home"
      className="page-container relative flex min-h-screen items-start pt-20 md:pt-28 lg:pt-32"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl"></div>
      </div>

      <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2 xl:gap-16">
        <div
          ref={leftSideRef}
          className={`space-y-10 text-center lg:text-left ${leftSideInView ? "animate-fade-in-up" : ""}`}
        >
          <div className="space-y-6">
            <h1 className="cursor-default select-none font-marketing text-5xl font-extrabold md:text-6xl">
              The All-in-One{" "}
              <span className="text-accent">School Management</span> Platform
            </h1>

            <p className="mx-auto max-w-xl cursor-default select-none text-muted-foreground lg:mx-0">
              Manage schools, students, teachers, grading, and assessments — all
              from one powerful and simple dashboard.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-5 sm:flex-row lg:justify-start">
            <Link href="/login">
              <Button
                size="lg"
                className="w-full px-8 py-6 text-lg shadow-md sm:w-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link href="#solutions">
              <Button
                size="lg"
                variant="outline"
                className="w-full bg-white px-8 py-6 text-lg sm:w-auto"
              >
                View Demo
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-2 font-marketing text-sm text-muted-foreground lg:justify-start">
            {[
              "Multi-tenant",
              "Secure",
              "Automated grading",
              "Video meetings",
            ].map((item) => (
              <span
                key={item}
                className="flex cursor-default select-none items-center gap-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary/50"></span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div
          ref={rightSideRef}
          className={`relative px-2 pb-10 sm:px-6 ${rightSideInView ? "animate-fade-in-up animate-delay-2" : ""}`}
        >
          <div className="pointer-events-none absolute -top-16 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-10 left-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl"></div>

          <div className="relative mx-auto w-full max-w-[820px]">
            <LaptopFrame src="/desktop-3.png" alt="Relief-ED dashboard preview" />

            <div className="absolute -bottom-8 -left-1 w-[26%] min-w-[88px] max-w-[190px] sm:-bottom-10 sm:-left-6 lg:-left-10">
              <PhoneFrame
                src="/mobile-3.png"
                alt="Relief-ED mobile dashboard preview"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}