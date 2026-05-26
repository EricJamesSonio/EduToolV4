"use client";

import { BarChart3, TrendingUp, Users, PieChart, Calendar } from "lucide-react";

const stats = [
  {
    icon: Users,
    label: "Active Schools",
    value: "1,240+",
    color: "bg-blue-500",
    barWidth: "88%",
  },
  {
    icon: PieChart,
    label: "Registered Programs",
    value: "320+",
    color: "bg-purple-500",
    barWidth: "74%",
  },
  {
    icon: TrendingUp,
    label: "User Satisfaction",
    value: "96%",
    color: "bg-emerald-500",
    barWidth: "94%",
  },
  {
    icon: BarChart3,
    label: "Total Admins",
    value: "8,500+",
    color: "bg-orange-500",
    barWidth: "68%",
  },
  {
    icon: Calendar,
    label: "Monthly Active Usage",
    value: "450K+",
    color: "bg-cyan-500",
    barWidth: "82%",
  },
];

export function AnalyticsPreviewSection() {
  return (
    <section id="Analytics Preview" className="page-container py-20 md:py-28 space-y-14">
      {/* Header */}
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="section-accent"></div>
        </div>

        <h2 className="font-bold">
          Trusted by Schools Worldwide
        </h2>

        <p className="text-lg text-muted-foreground">
          EduTool powers modern education systems across thousands of schools.
          Track real platform impact, user adoption, and engagement in real time.
        </p>
      </div>

      {/* Dashboard Mockup */}
      <div className="card-landing rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary/80 to-secondary/40 border-b border-border/60 px-6 py-4 flex items-center justify-between">
          <h3 className="font-heading font-semibold text-xl">
            Platform Analytics Overview
          </h3>

          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/70"></div>
            <div className="w-3 h-3 rounded-full bg-warning/70"></div>
            <div className="w-3 h-3 rounded-full bg-success/70"></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Top Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-gradient-to-br from-secondary/60 to-secondary/20 rounded-xl p-8 flex items-center justify-center min-h-48 border border-border/40">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto">
                  <BarChart3 className="h-8 w-8 text-primary/40" />
                </div>

                <p className="text-muted-foreground text-sm font-medium">
                  Global Platform Adoption Growth
                </p>

                <div className="flex gap-6 justify-center">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">2024</p>
                    <p className="text-sm font-semibold">820 Schools</p>
                  </div>

                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">2025</p>
                    <p className="text-sm font-semibold">1,240 Schools</p>
                  </div>

                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Growth</p>
                    <p className="text-sm font-semibold text-emerald-600">
                      +52%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-secondary/60 to-secondary/20 rounded-xl p-8 flex items-center justify-center min-h-48 border border-border/40">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 flex items-center justify-center mx-auto">
                  <TrendingUp className="h-8 w-8 text-emerald-500/40" />
                </div>

                <p className="text-muted-foreground text-sm font-medium">
                  Satisfaction Score
                </p>

                <p className="text-3xl font-bold text-emerald-600">96%</p>

                <p className="text-xs text-muted-foreground">
                  Based on 12,000+ reviews
                </p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <div
                  key={index}
                  className="bg-gradient-to-br from-secondary/50 to-secondary/20 rounded-xl p-4 space-y-3 border border-border/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </span>
                    <Icon className="h-4 w-4 text-muted-foreground/40" />
                  </div>

                  <p className="text-2xl font-bold">{stat.value}</p>

                  <div className="w-full h-1.5 bg-border/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.color} rounded-full`}
                      style={{ width: stat.barWidth }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Callout */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl px-5 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Insight:</span>{" "}
            Schools using EduTool report faster grading workflows and higher
            administrative efficiency within the first 30 days.
          </div>
        </div>
      </div>
    </section>
  );
}