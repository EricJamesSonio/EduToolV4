import { AlertTriangle, Archive, Pencil } from "lucide-react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import type { Class } from "@/types/admin/class.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ClassDetailHeaderProps {
  cls: Class;
  onEdit: () => void;
  onArchive: () => void;
}

export function ClassDetailHeader({
  cls,
  onEdit,
  onArchive,
}: ClassDetailHeaderProps): React.JSX.Element {
  const isArchived = cls.status === "archived";

  return (
    <div className="space-y-4">
      <Link
        href="/admin/classes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Classes
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {cls.subjectName ?? "Unnamed Class"}
            </h1>
            {isArchived && (
              <Badge variant="secondary" className="font-normal">
                Archived
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {[cls.semesterName, cls.sectionName].filter(Boolean).join(" · ")}
          </p>
        </div>

        {!isArchived && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={onArchive}
            >
              <Archive className="mr-1.5 h-3.5 w-3.5" />
              Archive
            </Button>
          </div>
        )}
      </div>

      {isArchived && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This class is archived and read-only.
        </div>
      )}
    </div>
  );
}