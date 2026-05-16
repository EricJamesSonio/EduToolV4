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
  /** Right-side action buttons or elements */
  actions?: React.ReactNode;
  /** Optional subtitle / description below the title */
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
      className={cn(
        "flex flex-col gap-2",
        className
      )}
    >
      {/* SHEIN-Style Title Header */}
      <div className="w-full border-[3px] border-black bg-black px-6 py-4 shadow-sm">
        <h1
          className="text-center text-3xl font-black uppercase text-white"
          style={{
            letterSpacing: "0.35em",
            fontFamily: "Arial Black, Helvetica, sans-serif",
          }}
        >
          {title}
        </h1>
      </div>

      {/* Breadcrumb and Actions Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {/* Breadcrumb */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                {breadcrumbs.map((crumb, i) => (
                  <li key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}

                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="transition-colors hover:text-foreground"
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
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="mt-1 flex shrink-0 items-center gap-2 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}