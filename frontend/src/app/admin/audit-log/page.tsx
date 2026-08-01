"use client";

import { useState } from "react";
import { ShieldAlert, Activity } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";

import { AuditLogTab, ActivityLogTab } from "./_components";

type TabId = "audit" | "activity";

export default function AuditLogPage() {
  const [activeTab, setActiveTab] = useState<TabId>("audit");

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Logs"
        actions={<HelpGuide slug="admin_audit_log" />}
      />

      <div className="flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "audit"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Audit Log
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "activity"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="h-4 w-4" />
          Activity Log
        </button>
      </div>

      {activeTab === "audit"    && <AuditLogTab />}
      {activeTab === "activity" && <ActivityLogTab />}
    </div>
  );
}
