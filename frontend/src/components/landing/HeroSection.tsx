"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen, Award } from "lucide-react";

export function HeroSection() {
  return (
    <section className="page-container py-16 md:py-24 lg:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: Text Content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight">
              Flexible School Management for Every Institution
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Manage academic structures, grading systems, calendars, and school operations in one scalable platform designed for modern educational institutions.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              View Demo
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="pt-4 border-t border-border flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div>Trusted by schools</div>
            <div>•</div>
            <div>Multi-tenant</div>
            <div>•</div>
            <div>Secure</div>
            <div>•</div>
            <div>Flexible</div>
          </div>
        </div>

        {/* Right: Dashboard Mockup */}
        <div className="relative">
          {/* Placeholder Dashboard Card */}
          <div className="bg-card border-2 border-border rounded-lg p-6 shadow-lg space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-lg">Dashboard</h3>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <div className="w-2 h-2 rounded-full bg-muted"></div>
                <div className="w-2 h-2 rounded-full bg-muted"></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">Students</span>
                </div>
                <p className="text-2xl font-bold">12,430</p>
              </div>

              <div className="bg-secondary/50 rounded p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">Programs</span>
                </div>
                <p className="text-2xl font-bold">24</p>
              </div>

              <div className="bg-secondary/50 rounded p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">Educators</span>
                </div>
                <p className="text-2xl font-bold">320</p>
              </div>

              <div className="bg-secondary/50 rounded p-4 space-y-2">
                <span className="text-xs text-muted-foreground block">School Year</span>
                <p className="font-semibold text-sm">2024-2025</p>
                <p className="text-xs text-green-600">Active</p>
              </div>
            </div>

            {/* Activity Items */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Activity</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Upcoming Academic Events</span>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">5</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Grade Submission Status</span>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">78%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative gradient blur */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
}