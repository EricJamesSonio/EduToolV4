"use client";

import { ArrowDown, Shield, Building2, Lock, Zap } from "lucide-react";

export function ArchitectureSection() {
  return (
    <section className="page-container py-16 md:py-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold">
          One Platform. Multiple Organizations.
        </h2>
        <p className="text-lg text-muted-foreground">
          Each institution operates in its own dedicated portal with isolated users, data, configurations, and academic workflows.
        </p>
      </div>

      {/* Architecture Flow */}
      <div className="flex flex-col items-center gap-6 max-w-xl mx-auto">
        {/* Platform Owner */}
        <div className="w-full bg-card border-2 border-border rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">Platform Owner</span>
          </div>
          <p className="text-sm text-muted-foreground">Manage all organizations</p>
        </div>

        <ArrowDown className="h-6 w-6 text-muted-foreground" />

        {/* Schools */}
        <div className="w-full bg-card border-2 border-border rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Schools</span>
          </div>
          <p className="text-sm text-muted-foreground">Isolated instances per organization</p>
        </div>

        <ArrowDown className="h-6 w-6 text-muted-foreground" />

        {/* Administrators */}
        <div className="w-full bg-card border-2 border-border rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="h-5 w-5 text-primary" />
            <span className="font-semibold">Administrators</span>
          </div>
          <p className="text-sm text-muted-foreground">Configure and manage operations</p>
        </div>

        <ArrowDown className="h-6 w-6 text-muted-foreground" />

        {/* End Users */}
        <div className="w-full bg-card border-2 border-border rounded-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold">Educators & Students</span>
          </div>
          <p className="text-sm text-muted-foreground">Access dedicated workflows</p>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-6">
        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="font-semibold text-sm">Data Isolation</span>
          </div>
          <p className="text-xs text-muted-foreground">Complete data separation between organizations</p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="font-semibold text-sm">Organization Portals</span>
          </div>
          <p className="text-xs text-muted-foreground">Dedicated portal per school</p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="font-semibold text-sm">Scalable Architecture</span>
          </div>
          <p className="text-xs text-muted-foreground">Grows with your institution</p>
        </div>

        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="font-semibold text-sm">Centralized Management</span>
          </div>
          <p className="text-xs text-muted-foreground">Unified administration dashboard</p>
        </div>
      </div>
    </section>
  );
}