// ===== File: frontend\src\components\shared\PageHeader.tsx =====
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  description?: string;
  className?: string;
}

export function PageHeader({
  title,
  breadcrumbs,
  actions,
  description,
  className,
}: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
className={cn(
  "flex flex-col gap-1.5 pb-4 mb-6 border-b border-border",
  className
)}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      i === breadcrumbs.length - 1
                        ? "font-medium text-foreground"
                        : ""
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-0.5">
        <h1 className="font-marketing !font-extrabold !leading-tight !tracking-tight !m-0 text-type-page-title text-foreground not-interactive">
          {title}
        </h1>
          {description && (
            <p className="text-type-body font-medium gradient-text not-interactive">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}