"use client";

import { ArrowRight } from "lucide-react";

const steps = [
  "Create organization",
  "Configure programs",
  "Define academic structures",
  "Apply templates",
  "Enroll users",
  "Start managing operations",
];

export function WorkflowSection() {
  return (
    <section className="page-container py-16 md:py-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold">
          Get Started in Minutes
        </h2>
        <p className="text-lg text-muted-foreground">
          Simple, intuitive workflow to set up your educational institution
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="max-w-3xl mx-auto">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4">
              {/* Step Number */}
              <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-heading font-bold">
                {index + 1}
              </div>

              {/* Step Text */}
              <div className="flex-grow">
                <p className="font-semibold">{step}</p>
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden sm:flex flex-shrink-0">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Vertical Line (Mobile) */}
        <div className="sm:hidden absolute left-5 top-0 bottom-0 w-0.5 bg-border my-4 pointer-events-none"></div>
      </div>
    </section>
  );
}