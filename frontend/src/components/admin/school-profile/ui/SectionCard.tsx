import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function Card({
  id,
  icon: Icon,
  title,
  children,
}: {
  id?: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="icon-container bg-[#BFDBFE] text-[#0B1E3A] border border-[#93C5FD] shrink-0 mt-0.5">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <h3 className="font-semibold text-lg leading-tight not-interactive">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export function CollapsibleDepartmentCard({
  id,
  icon: Icon,
  title,
  defaultOpen,
  children,
}: {
  id?: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  useEffect(() => setOpen(defaultOpen ?? false), [defaultOpen]);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="icon-container bg-[#BFDBFE] text-[#0B1E3A] border border-[#93C5FD] shrink-0 mt-0.5">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-semibold text-lg leading-tight not-interactive">
            {title}
          </h3>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && <div className="px-6 pb-6 space-y-5">{children}</div>}
    </div>
  );
}
