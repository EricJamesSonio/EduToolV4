"use client";

import { Eye, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ListItemCardAction,
  listItemCardClass,
  listItemIconClass,
  listItemTitleClass,
} from "@/components/shared/ListItemCard";
import { cn } from "@/lib/utils";

interface ProgramUnitCardProps {
  name: string;
  code?: string | null;
  icon: LucideIcon;
  iconClass: string;
  levelCount: number;
  sectionCount: number;
  isEnded: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProgramUnitCard({
  name,
  code,
  icon: Icon,
  iconClass,
  levelCount,
  sectionCount,
  isEnded,
  onView,
  onEdit,
  onDelete,
}: ProgramUnitCardProps): React.JSX.Element {
  return (
    <div className={listItemCardClass}>
      <div className="flex items-start gap-3">
        <div className={cn(listItemIconClass, iconClass, "mt-0.5")}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className={cn(listItemTitleClass, "truncate not-interactive")}>{name}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {code && (
              <Badge variant="outline" className="text-xs font-mono">
                {code}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground not-interactive">
              {levelCount} {levelCount === 1 ? "level" : "levels"} · {sectionCount}{" "}
              {sectionCount === 1 ? "section" : "sections"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ListItemCardAction icon={Eye} label="View" onClick={onView} />
        {!isEnded && (
          <>
            <ListItemCardAction icon={Pencil} label="Edit" iconOnly onClick={onEdit} />
            <ListItemCardAction
              icon={Trash2}
              label="Delete"
              iconOnly
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={onDelete}
            />
          </>
        )}
      </div>
    </div>
  );
}