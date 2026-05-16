"use client";

import { Building2, BookOpen, Calendar, BarChart3, Lock, Zap, Users, GraduationCap } from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Organization Management",
    description: "Create and manage independent school environments with dedicated configurations and users.",
  },
  {
    icon: BookOpen,
    title: "Academic Structure",
    description: "Build custom programs, levels, sections, subjects, and classes.",
  },
  {
    icon: Calendar,
    title: "Academic Calendar System",
    description: "Manage reusable academic calendars and institutional schedules.",
  },
  {
    icon: BarChart3,
    title: "Flexible Grading",
    description: "Create grading schemes and scoring scales tailored to institutional needs.",
  },
  {
    icon: Lock,
    title: "Grade Locking",
    description: "Finalize grading periods and control editing access.",
  },
  {
    icon: Zap,
    title: "Quick Setup Tools",
    description: "Generate academic structures instantly through predefined templates.",
  },
  {
    icon: Users,
    title: "Educator Workspace",
    description: "Manage classes, subjects, and student grading.",
  },
  {
    icon: GraduationCap,
    title: "Student Management",
    description: "Organize student enrollment and academic records.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features"className="page-container py-16 md:py-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold">
          Everything Schools Need in One Platform
        </h2>
        <p className="text-lg text-muted-foreground">
          Comprehensive tools designed specifically for modern educational institutions
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="bg-card border-2 border-border rounded-lg p-6 hover:border-primary transition-colors space-y-4 group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}