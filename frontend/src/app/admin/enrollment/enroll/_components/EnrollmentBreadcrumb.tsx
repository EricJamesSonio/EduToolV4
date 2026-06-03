"use client";

import { ChevronRight } from "lucide-react";

interface NavItem {
  label: string;
  onClick?: () => void;
}

interface EnrollmentBreadcrumbProps {
  items: NavItem[];
}

export function EnrollmentBreadcrumb({ items }: EnrollmentBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="hover:text-foreground transition-colors font-medium text-foreground"
            >
              {item.label}
            </button>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
