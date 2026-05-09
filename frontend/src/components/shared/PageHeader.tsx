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
        "flex flex-col gap-1",
        className
      )}
    >
      {/* Title Container - Full Width */}
      <div className="w-full border-2 border-primary bg-secondary p-4">
        <h1 className="text-2xl font-semibold tracking-tight text-center">{title}</h1>
      </div>

      {/* Breadcrumb and Actions Row */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {/* Breadcrumb */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-1 text-sm text-muted-foreground">
                {breadcrumbs.map((crumb, i) => (
                  <li key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
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
                          i === breadcrumbs.length - 1 ? "text-foreground" : ""
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
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2 mt-1 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}