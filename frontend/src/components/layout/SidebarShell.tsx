"use client";

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
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors border border-transparent";

  // 🔥 UNIFIED STYLE: ALWAYS BLACK THEME (NO ACTIVE INVERSION)
  const stateStyles =
    "bg-black text-white hover:bg-neutral-900 hover:text-white";

  const link = (
    <Link
      href={item.href}
      className={cn(
        base,
        stateStyles,
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-white" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function SidebarShell({
  header,
  groups,
  footer,
  className,
}: SidebarShellProps) {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "fixed left-0 top-14 bottom-0 z-40 flex flex-col border-r",
          "bg-black text-white border-black",
          "transition-all duration-200",
          collapsed ? "w-14" : "w-56",
          className
        )}
      >
        {/* Header */}
        {!collapsed && (
          <div className="border-b border-neutral-800 px-4 py-3 text-sm text-white">
            {header}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4">
          {groups.map((group, gi) => (
            <div key={gi} className="space-y-1">
              {group.label && !collapsed && (
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {group.label}
                </p>
              )}

              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              "border-t border-neutral-800 p-2",
              collapsed && "flex justify-center"
            )}
          >
            {footer}
          </div>
        )}

        {/* Toggle */}
        <div className="border-t border-neutral-800 p-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
              "bg-black text-white hover:bg-neutral-900 transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-white" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 text-white" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}