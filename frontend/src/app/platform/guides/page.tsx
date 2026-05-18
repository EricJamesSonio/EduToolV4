"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGuides, useCreateGuide, useDeleteGuide } from "@/hooks/platform/useGuides";
import type { GuidePortal } from "@/types/platform/guide.types";
import { CreateGuideDialog } from "@/components/platform/guide/CreateGuideDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const PORTALS: { value: GuidePortal | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "admin", label: "Admin" },
  { value: "student", label: "Student" },
  { value: "educator", label: "Educator" },
];

const ADMIN_PAGES = [
  { group: "Main", pages: ["/admin/dashboard", "/admin/organization", "/admin/school-years"] },
  { group: "Academic", pages: ["/admin/programs", "/admin/sections", "/admin/subjects", "/admin/semester-settings", "/admin/academic-calendar"] },
  { group: "Grading", pages: ["/admin/grading-scales", "/admin/grading-schemes", "/admin/classes"] },
  { group: "People", pages: ["/admin/educators", "/admin/students"] },
  { group: "System", pages: ["/admin/grade-lock", "/admin/audit-log"] },
];

export default function GuidesPage() {
  const [activePortal, setActivePortal] = useState<GuidePortal | "all">("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: guides, isLoading } = useGuides(
    activePortal === "all" ? undefined : activePortal,
  );
  const createGuide = useCreateGuide();
  const deleteGuide = useDeleteGuide();

  const filtered = guides?.filter((g) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      g.title.toLowerCase().includes(s) ||
      g.pagePath.toLowerCase().includes(s)
    );
  });

  const handleCreate = (data: {
    portal: GuidePortal;
    pagePath: string;
    title: string;
    description: string;
  }) => {
    createGuide.mutate(
      {
        portal: data.portal,
        pagePath: data.pagePath,
        title: data.title,
        description: data.description || undefined,
      },
      {
        onSuccess: () => setShowCreate(false),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guide Management"
        description="Manage help guides for all portals"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            New Guide
          </Button>
        }
      />

      {/* Portal Tabs */}
      <div className="flex items-center gap-2">
        {PORTALS.map((p) => (
          <button
            key={p.value}
            onClick={() => setActivePortal(p.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activePortal === p.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guides..."
          className="pl-9"
        />
      </div>

      {/* Admin Page Structure Reference (only when admin portal is active) */}
      {(activePortal === "admin" || activePortal === "all") && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Admin Portal Pages
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ADMIN_PAGES.map((group) => (
              <div key={group.group}>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  {group.group}
                </p>
                <ul className="space-y-0.5">
                  {group.pages.map((page) => (
                    <li key={page} className="text-xs text-muted-foreground">
                      {page}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guide List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      ) : filtered?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {search
              ? "No guides match your search"
              : "No guides created yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered?.map((guide) => (
            <Link
              key={guide.id}
              href={`/platform/guides/${guide.id}`}
              className="group rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {guide.title}
                </h3>
                <Badge
                  variant={guide.isActive ? "default" : "secondary"}
                  className="ml-2 shrink-0"
                >
                  {guide.isActive ? "Active" : "Draft"}
                </Badge>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
                {guide.pagePath}
              </p>
              {guide.description && (
                <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
                  {guide.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{guide.portal}</span>
                <span>{guide.stepCount} step{guide.stepCount !== 1 ? "s" : ""}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateGuideDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={handleCreate}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete Guide"
        message="Are you sure you want to delete this guide? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteId) {
            deleteGuide.mutate(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}
