"use client";
import Image from "next/image";
import { SCHOOLS_DATA } from "./data/schools";

type School = (typeof SCHOOLS_DATA)[number];

function SchoolCard({ school }: { school: School }) {
  return (
    <div className="flex items-center gap-5 px-8 py-7 rounded-xl border border-border bg-card hover:shadow-md transition-all duration-200 cursor-default select-none shrink-0">
      <div className="relative w-28 h-28 rounded-xl overflow-hidden shrink-0">
        <Image
          src={`/schools/${school.id}.jpg`}
          alt={school.name}
          fill
          className="object-contain p-1"
          unoptimized
        />
      </div>
      <div>
        <p className="text-xl font-semibold text-card-foreground leading-tight whitespace-nowrap">
          {school.name}
        </p>
        <p className="text-base text-muted-foreground whitespace-nowrap">
          {school.location}
        </p>
      </div>
    </div>
  );
}

export function SchoolCarousel() {
  const tripled = [...SCHOOLS_DATA, ...SCHOOLS_DATA, ...SCHOOLS_DATA];

  return (
    <>
      <style>
        {`
          @keyframes scroll-ltr {
            0%   { transform: translateX(-33.33%); }
            100% { transform: translateX(0); }
          }
          .scroll-ltr {
            animation: scroll-ltr 40s linear infinite;
          }
        `}
      </style>
      <div className="space-y-4">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted by leading institutions worldwide
        </p>
        <div className="group relative overflow-hidden py-8">
          {/* Left fade */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background to-transparent" />
          {/* Right fade */}
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background to-transparent" />
          {/* Scrolling track */}
          <div className="flex w-max gap-5 will-change-transform scroll-ltr group-hover:[animation-play-state:paused]">
            {tripled.map((school, i) => (
              <SchoolCard key={`${school.id}-${i}`} school={school} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}