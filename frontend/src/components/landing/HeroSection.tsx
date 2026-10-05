"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface DeviceFrameProps {
  src: string;
  alt: string;
}

const KEY_COLUMNS = 14;

const KEY_ROWS: number[][] = [
  Array(14).fill(1),
  [2, ...Array(12).fill(1)],
  [3, ...Array(11).fill(1)],
  [1, 1, 1, 7, 1, 1, 1, 1],
];

function KeyboardRows() {
  return (
    <div className="mx-auto flex w-[80%] flex-col gap-[0.3cqw] rounded-[0.6cqw] bg-black/90 p-[0.6cqw] shadow-inner">
      {KEY_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-[0.3cqw]"
          style={{
            gridTemplateColumns: `repeat(${KEY_COLUMNS}, minmax(0, 1fr))`,
          }}
        >
          {row.map((span, keyIndex) => (
            <span
              key={keyIndex}
              className="h-[1.8cqw] rounded-[0.3cqw] bg-gradient-to-b from-slate-500 to-slate-700"
              style={{ gridColumn: `span ${span} / span ${span}` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Trackpad() {
  return (
    <div className="relative mx-auto mt-[1.6cqw] aspect-[2.8/1] w-[20%] rounded-[0.6cqw] border border-slate-500 bg-gradient-to-b from-slate-300 to-slate-400 shadow">
      <span className="absolute inset-x-0 bottom-[28%] h-px bg-slate-500/70" />
      <span className="absolute bottom-0 left-1/2 h-[28%] w-px bg-slate-500/70" />
    </div>
  );
}

function PortLights() {
  return (
    <div className="absolute bottom-1/2 left-[5%] flex translate-y-1/2 items-center gap-[0.8cqw] rounded-[0.5cqw] bg-black/80 px-[1cqw] py-[0.4cqw]">
      <span className="h-[1.2cqw] w-[1.2cqw] rounded-full bg-blue-500 ring-1 ring-blue-300" />
      <span className="h-[1.2cqw] w-[1.2cqw] rounded-full bg-green-500 ring-1 ring-green-300" />
      <span className="h-[1.2cqw] w-[1.2cqw] rounded-full bg-red-500 ring-1 ring-red-300" />
    </div>
  );
}

function LaptopFrame({ src, alt }: DeviceFrameProps) {
  return (
    <div className="@container w-full">
      <div className="flex flex-col drop-shadow-2xl">
        <div className="relative rounded-t-[1.8cqw] bg-black px-[1.6cqw] pb-[1.6cqw] pt-[3.2cqw] ring-2 ring-inset ring-slate-800">
          <div className="absolute left-1/2 top-[0.6cqw] flex h-[2cqw] w-[14%] -translate-x-1/2 items-center justify-center gap-[0.7cqw] rounded-full border border-slate-600 bg-slate-900">
            <span className="h-[0.6cqw] w-[0.6cqw] rounded-full bg-green-400" />
            <span className="h-[1cqw] w-[1cqw] rounded-full bg-slate-500 ring-1 ring-slate-700" />
          </div>
          <div className="overflow-hidden rounded-sm bg-background">
            <img src={src} alt={alt} className="block h-auto w-full" />
          </div>
        </div>

        <div className="relative bg-gradient-to-b from-slate-800 via-slate-700 to-slate-500 pb-[2cqw] pt-[1.4cqw]">
          <div className="mx-auto mb-[1.2cqw] h-[0.8cqw] w-[80%] rounded-full bg-black/70 ring-1 ring-slate-500/60" />
          <KeyboardRows />
          <Trackpad />
        </div>

        <div className="relative h-[2.8cqw] rounded-b-[1.6cqw] bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600">
          <PortLights />
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({ src, alt }: DeviceFrameProps) {
  return (
    <div className="@container w-full">
      <div className="relative drop-shadow-2xl">
        <span className="absolute -right-[0.8cqw] top-[26%] h-[8%] w-[0.8cqw] rounded-r bg-slate-700" />
        <div className="rounded-[15cqw] bg-black p-[3.6cqw] ring-1 ring-slate-700/70">
          <div className="relative aspect-[9/18] overflow-hidden rounded-[11.5cqw] bg-black">
            <div className="absolute left-1/2 top-[2cqw] z-10 flex h-[5cqw] w-[38%] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-[2.4cqw]">
              <span className="h-[1.6cqw] w-[1.6cqw] rounded-full bg-slate-700" />
            </div>
            <img
              src={src}
              alt={alt}
              className="absolute inset-x-0 bottom-0 top-[8cqw] h-[calc(100%-8cqw)] w-full bg-background object-cover object-top"
            />
          </div>
        </div>
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
      className="page-container relative flex items-start pb-16 pt-12 md:pt-16 lg:min-h-screen lg:pb-0 lg:pt-20"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl"></div>
      </div>

      <div className="relative grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 xl:gap-16">
        <div
          ref={leftSideRef}
          className={`min-w-0 space-y-10 text-center lg:text-left ${leftSideInView ? "animate-fade-in-up" : ""}`}
        >
          <div className="space-y-6">
            <h1 className="cursor-default select-none font-marketing text-4xl font-extrabold sm:text-5xl md:text-6xl">
              The All-in-One{" "}
              <span className="text-accent">School Management</span> Platform
            </h1>

            <p className="mx-auto max-w-xl cursor-default select-none text-muted-foreground lg:mx-0">
              Manage schools, students, teachers,
              grading, and assessments, all from
              one powerful and simple dashboard.
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

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 pt-2 font-marketing text-sm text-muted-foreground lg:justify-start">
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
          className={`relative min-w-0 py-[6%] ${rightSideInView ? "animate-fade-in-up animate-delay-2" : ""}`}
        >
          <div className="pointer-events-none absolute -top-16 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-10 left-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl"></div>

          <div className="relative mx-auto w-full max-w-[780px]">
            <div className="w-[76%]">
              <LaptopFrame
                src="/desktop-3.png"
                alt="Relief-ED dashboard preview"
              />
            </div>

            <div className="absolute right-0 top-1/2 w-[31%] -translate-y-1/2">
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