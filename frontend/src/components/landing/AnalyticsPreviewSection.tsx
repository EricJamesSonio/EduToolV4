"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { SchoolCarousel } from "./SchoolCarousel";

export function AnalyticsPreviewSection() {
  const { ref, isInView } = useScrollAnimation();

  return (
    <section
      id="Analytics Preview"
      className={`page-container py-6 md:py-10 space-y-10 ${
        isInView ? "animate-section-in" : ""
      }`}
      ref={ref}
    >
      {/* Header */}
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="section-accent" />
        </div>

        <h2 className="font-marketing font-extrabold text-3xl md:text-4xl not-interactive">
          Trusted by <span className="gradient-text">Schools</span>
        </h2>

        <p className="text-lg text-muted-foreground not-interactive">
          Schools use Relief-ED to streamline academic management and improve
          administrative workflows.
        </p>
      </div>

      {/* ONLY this remains */}
      <SchoolCarousel />
    </section>
  );
}