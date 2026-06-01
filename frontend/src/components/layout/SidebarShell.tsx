"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/context/SidebarContext";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

interface SidebarShellProps {
  header: React.ReactNode;
  groups: NavGroup[];
  footer?: React.ReactNode;
  className?: string;
}

function useIsActive(href: string, exact?: boolean) {
  const pathname = usePathname();
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const isActive = useIsActive(item.href, item.exact);
  const Icon = item.icon;

  const base =
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors";

  const stateStyles = isActive
    ? "bg-muted text-foreground"
    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground";

  const linkContent = (
    <Link
      href={item.href}
      className={cn(base, stateStyles, collapsed && "justify-center px-2")}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

export function SidebarShell({
  header,
  groups,
  footer,
  className,
}: SidebarShellProps) {
  const { collapsed, setCollapsed, isMobileOpen, setMobileOpen, isMobile } = useSidebar();

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col border-r",
        "bg-card text-foreground border-border",
        "transition-all duration-200",
        isMobile
          ? "fixed left-0 top-[76px] bottom-0 z-40 w-60"
          : cn(
              "fixed left-0 top-[76px] bottom-0 z-40",
              collapsed ? "w-14" : "w-56"
            ),
        isMobile && !isMobileOpen && "-translate-x-full",
        isMobile && isMobileOpen && "translate-x-0",
        !isMobile && "translate-x-0",
        className
      )}
    >
      {/* Header */}
      <div className={cn(
        "border-b border-border px-4 py-3 flex items-center gap-2",
        isMobile ? "flex" : collapsed ? "hidden" : "flex"
      )}>
        <div className="flex-1 min-w-0">
          {header}
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Header when collapsed on desktop */}
      {!isMobile && collapsed && (
        <div className="border-b border-border" />
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4">
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.label && !collapsed && !isMobile && (
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}

            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                collapsed={collapsed && !isMobile}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {footer && (
        <div
          className={cn(
            "border-t border-border p-2",
            collapsed && !isMobile && "flex justify-center"
          )}
        >
          {footer}
        </div>
      )}

      {/* Collapse toggle — desktop only */}
      {!isMobile && (
        <div className="border-t border-border p-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
              "bg-muted text-foreground hover:bg-muted/80 transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <TooltipProvider>
      {/* Mobile backdrop */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {sidebarContent}
    </TooltipProvider>
  );
}
