"use client";

import { Building2, BookOpen, Calendar, Zap, Users, GraduationCap, BrainCircuit, CheckCircle2, Video } from "lucide-react";

const features = [
  { icon: Building2, title: "Organization Management", description: "Create and manage independent school environments with dedicated configurations and users.", color: "bg-blue-500/10 text-blue-500" },
  { icon: BookOpen, title: "Academic Structure", description: "Build custom programs, levels, sections, subjects, and classes.", color: "bg-emerald-500/10 text-emerald-500" },
  { icon: Calendar, title: "Academic Calendar System", description: "Manage reusable academic calendars and institutional schedules.", color: "bg-purple-500/10 text-purple-500" },
  { icon: Zap, title: "Quick Setup Tools", description: "Generate academic structures instantly through predefined templates.", color: "bg-amber-500/10 text-amber-500" },
  { icon: Users, title: "Educator Workspace", description: "Manage classes, subjects, and student grading.", color: "bg-teal-500/10 text-teal-500" },
  { icon: GraduationCap, title: "Student Management", description: "Organize student enrollment and academic records.", color: "bg-indigo-500/10 text-indigo-500" },
  { icon: BrainCircuit, title: "Assessment Generator", description: "Automatically create assessments by inputting lesson details — no more manual exam writing.", color: "bg-pink-500/10 text-pink-500" },
  { icon: Video, title: "Video Meetings & Live Chat", description: "Built-in video conferencing with real-time chat for virtual classes and parent meetings.", color: "bg-cyan-500/10 text-cyan-500" },
];

export function FeaturesSection() {
  return (
    <section id="features" className="page-container py-6 md:py-10 space-y-14">
      {/* Header */}
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="section-accent"></div>
        </div>
        <h2 className="font-bold">
          Everything Schools Need in One Platform
        </h2>
        <p className="text-lg text-muted-foreground">
          Comprehensive tools designed specifically for modern educational institutions
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="card-landing p-6 space-y-4 group"
            >
              <div className={`icon-container ${feature.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-semibold text-xl">{feature.title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}