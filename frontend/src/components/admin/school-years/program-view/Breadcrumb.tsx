// frontend\src\components\admin\enrollment\program-view\Breadcrumb.tsx
import { ChevronRight } from "lucide-react";

interface Crumb {
  label:    string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  crumbs: Crumb[];
}

export function Breadcrumb({ crumbs }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          {crumb.onClick ? (
            <button
              onClick={crumb.onClick}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}