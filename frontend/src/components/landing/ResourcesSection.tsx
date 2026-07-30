"use client";

import { BookOpen, Zap, BarChart3, Layout, HelpCircle } from "lucide-react";
import Link from "next/link";

interface ResourceCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  slug: string;
  color: string;
}

const resources: ResourceCard[] = [
  {
    id: "getting-started",
    icon: <BookOpen className="h-5 w-5" />,
    title: "Getting Started",
    description:
      "Set up your school structure, configure programs and levels, and get Relief-ED ready in minutes.",
    slug: "getting-started",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    id: "enroll-students",
    icon: <Zap className="h-5 w-5" />,
    title: "How to Enroll Students",
    description:
      "Learn the quick and easy way to add students to your classes and manage enrollments.",
    slug: "enroll-students",
    color: "bg-emerald-500/10 text-emerald-500",
  },
  {
    id: "grading-guide",
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Grading Setup Guide",
    description:
      "Understand grading schemes, scales, and how to lock grades to prevent accidental changes.",
    slug: "grading-guide",
    color: "bg-orange-500/10 text-orange-500",
  },
  {
    id: "templates",
    icon: <Layout className="h-5 w-5" />,
    title: "Ready-Made Templates",
    description:
      "Use pre-configured setups for SHS, college programs, and other common school structures.",
    slug: "templates",
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    id: "help",
    icon: <HelpCircle className="h-5 w-5" />,
    title: "Help & FAQ",
    description:
      "Find answers to common questions and get support when you need it.",
    slug: "help",
    color: "bg-pink-500/10 text-pink-500",
  },
];

export function ResourcesSection() {
  return (
    <section id="resources" className="page-container py-6 md:py-10 space-y-14">
      {/* Header */}
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="section-accent"></div>
        </div>
        <h2 className="font-marketing font-extrabold not-interactive">Learn & Get Started</h2>
        <p className="text-lg text-muted-foreground not-interactive">
          Everything you need to master Relief-ED and manage your school
          effectively.
        </p>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {resources.map((resource) => (
          <Link
            key={resource.id}
            href={`/docs/get-started/${resource.slug}`}
            className="group"
          >
            <div className="card-landing p-6 text-center space-y-4 h-full transition-all duration-300 cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 hover:scale-105">
              <div className="flex justify-center">
                <div className={`icon-container ${resource.color}`}>
                  {resource.icon}
                </div>
              </div>
              <h3 className="font-heading font-semibold text-lg">
                {resource.title}
              </h3>
              <p className="text-base text-muted-foreground">
                {resource.description}
              </p>
              {/* Hidden arrow that appears on hover */}
              <div className="pt-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm flex items-center gap-1">
                  Learn More →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}