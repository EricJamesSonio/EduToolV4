"use client";

import { Calendar, BarChart3, Sliders, Zap } from "lucide-react";

const components = [
  { icon: Calendar, title: "Calendar Templates", description: "Reuse school calendar configurations.", color: "bg-purple-500/10 text-purple-500" },
  { icon: BarChart3, title: "Grading Schemes", description: "Apply standardized grading systems.", color: "bg-blue-500/10 text-blue-500" },
  { icon: Sliders, title: "Grading Scales", description: "Use customizable score mappings.", color: "bg-orange-500/10 text-orange-500" },
  { icon: Zap, title: "Organization Seeder", description: "Quickly generate organizational setup.", color: "bg-amber-500/10 text-amber-500" },
];

export function ReusableComponentsSection() {
  return (
    <section id="resources" className="page-container py-20 md:py-28 space-y-14">
      {/* Header */}
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="section-accent"></div>
        </div>
        <h2 className="font-bold">
          Reusable System Components
        </h2>
        <p className="text-lg text-muted-foreground">
          Configure Once. Reuse Everywhere.
        </p>
      </div>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {components.map((component, index) => {
          const Icon = component.icon;
          return (
            <div
              key={index}
              className="card-landing p-6 text-center space-y-4"
            >
              <div className="flex justify-center">
                <div className={`icon-container ${component.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="font-heading font-semibold text-xl">{component.title}</h3>
              <p className="text-base text-muted-foreground">{component.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
