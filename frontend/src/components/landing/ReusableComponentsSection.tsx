"use client";

import { Calendar, BarChart3, Sliders, Zap } from "lucide-react";

const components = [
  {
    icon: Calendar,
    title: "Calendar Templates",
    description: "Reuse school calendar configurations.",
  },
  {
    icon: BarChart3,
    title: "Grading Schemes",
    description: "Apply standardized grading systems.",
  },
  {
    icon: Sliders,
    title: "Grading Scales",
    description: "Use customizable score mappings.",
  },
  {
    icon: Zap,
    title: "Organization Seeder",
    description: "Quickly generate organizational setup.",
  },
];

export function ReusableComponentsSection() {
  return (
    <section id="resources" className="page-container py-16 md:py-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold">
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
              className="bg-card border-2 border-border rounded-lg p-6 text-center space-y-4 hover:border-primary transition-colors"
            >
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-heading font-semibold">{component.title}</h3>
              <p className="text-sm text-muted-foreground">{component.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}