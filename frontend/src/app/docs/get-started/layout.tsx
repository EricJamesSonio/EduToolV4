"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DocSection {
  id: string;
  title: string;
  slug: string;
}

const docSections: DocSection[] = [
  { id: "getting-started", title: "Getting Started", slug: "getting-started" },
  { id: "enroll-students", title: "How to Enroll Students", slug: "enroll-students" },
  { id: "grading-guide",   title: "Grading Setup Guide",  slug: "grading-guide" },
  { id: "templates",       title: "Ready-Made Templates", slug: "templates" },
  { id: "help",            title: "Help & FAQ",            slug: "help" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (slug: string) => {
    return pathname.includes(`/docs/get-started/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Docs Navbar — matches landing style without section tabs */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-xl">
        <div className="page-container flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
              <img
                src="/edutool-orange.png"
                alt="Relief-ED logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">Relief-ED</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="shadow-xs text-base px-5 py-2.5">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="shadow-sm text-base px-5 py-2.5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "hidden lg:block w-64 min-h-[calc(100vh-76px)] bg-card border-r border-border shrink-0"
          )}
        >
          <div className="sticky top-[76px] bg-card border-b border-border px-6 py-4">
            <h2 className="font-heading font-bold text-lg text-foreground">
              Relief-ED Docs
            </h2>
            <p className="text-xs text-muted-foreground">
              Learning Center
            </p>
          </div>

          <nav className="px-3 py-6 space-y-1 overflow-y-auto">
            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Getting Started
            </p>
            {docSections.map((section) => (
              <Link
                key={section.id}
                href={`/docs/get-started/${section.slug}`}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 group",
                  isActive(section.slug)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <span className="flex-1">{section.title}</span>
                {isActive(section.slug) && (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar Drawer */}
        <aside
          className={cn(
            "fixed top-0 left-0 w-64 h-full bg-card border-r border-border z-50 transition-transform duration-300 lg:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-heading font-bold text-lg text-foreground">
              Relief-ED Docs
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="px-3 py-6 space-y-1 overflow-y-auto">
            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Getting Started
            </p>
            {docSections.map((section) => (
              <Link
                key={section.id}
                href={`/docs/get-started/${section.slug}`}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 group",
                  isActive(section.slug)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <span className="flex-1">{section.title}</span>
                {isActive(section.slug) && (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-76px)] overflow-auto">
          <div className="p-6 lg:p-12">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <Menu className="h-4 w-4" />
              Sections
            </button>
            <div className="max-w-3xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}