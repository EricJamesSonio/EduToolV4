"use client";

import { BarChart3, TrendingUp, Users, PieChart, Calendar } from "lucide-react";

const stats = [
  { icon: Users, label: "Active Students", value: "12,430" },
  { icon: PieChart, label: "Program Distribution", value: "24 Programs" },
  { icon: TrendingUp, label: "Grade Completion", value: "92%" },
  { icon: BarChart3, label: "Enrollment Trends", value: "↑ 18%" },
  { icon: Calendar, label: "Upcoming Events", value: "5 Events" },
];

export function AnalyticsPreviewSection() {
  return (
    <section className="page-container py-16 md:py-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold">
          Analytics at Your Fingertips
        </h2>
        <p className="text-lg text-muted-foreground">
          Track academic operations through centralized insights
        </p>
      </div>

      {/* Dashboard Mockup */}
      <div className="bg-card border-2 border-border rounded-lg overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-secondary/30 border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="font-heading font-semibold">Analytics Dashboard</h3>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Top Row - Main Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-secondary/50 rounded-lg p-8 flex items-center justify-center min-h-48">
              <div className="text-center space-y-4">
                <BarChart3 className="h-12 w-12 text-primary/20 mx-auto" />
                <p className="text-muted-foreground text-sm">Grade Distribution Chart</p>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-lg p-8 flex items-center justify-center min-h-48">
              <div className="text-center space-y-4">
                <PieChart className="h-12 w-12 text-primary/20 mx-auto" />
                <p className="text-muted-foreground text-sm">Enrollment Breakdown</p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-secondary/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {stat.label}
                    </span>
                    <Icon className="h-4 w-4 text-primary/40" />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${75 + Math.random() * 25}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}