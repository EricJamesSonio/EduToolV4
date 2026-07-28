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
    <div data-slot="page-header" className={cn("flex flex-col gap-3", className)}>

      {/* HEADER (THEME-BASED, NOT HARD-CODED) */}
      <div className="w-full rounded-lg border border-border bg-card px-6 py-4">
        <h1 className="text-center font-bold tracking-wide not-interactive">
          {title}
        </h1>
      </div>

      {/* Breadcrumb + Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

        <div className="space-y-1">
          {/* Breadcrumb */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                {breadcrumbs.map((crumb, i) => (
                  <li key={i} className="flex items-center gap-1">
                    {i > 0 && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
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

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground not-interactive">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}