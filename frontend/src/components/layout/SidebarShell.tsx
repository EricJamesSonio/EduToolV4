"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  footer?: React.ReactNode; // ✅ new
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
}): React.JSX.Element {
  const isActive = useIsActive(item.href, item.exact);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-muted hover:text-foreground",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function SidebarShell({ header, groups, footer, className }: SidebarShellProps): React.JSX.Element {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <TooltipProvider delay={200}>
      <aside
        className={cn(
          "fixed left-0 top-14 bottom-0 z-40 flex flex-col border-r bg-background transition-all duration-200",
          collapsed ? "w-14" : "w-56 min-w-[3.5rem]",
          className
        )}
      >
        {/* Header slot */}
        {!collapsed && (
          <div className="border-b px-4 py-3 text-sm">{header}</div>
        )}

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4">
          {groups.map((group, gi) => (
            <div key={gi} className="space-y-0.5">
              {group.label && !collapsed && (
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer slot */}
        {footer && (
          <div className={cn("border-t p-2", collapsed && "flex justify-center")}>
            {footer}
          </div>
        )}

        {/* Collapse toggle */}
        <div className="border-t p-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}