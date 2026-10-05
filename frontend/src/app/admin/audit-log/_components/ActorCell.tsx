"use client";

import { Badge } from "@/components/ui/badge";

export function ActorCell({
  actorId,
  actorName,
  actorRole,
  educatorMap,
}: {
  actorId?: string | null;
  /** Resolved by the server. Preferred over the educator lookup. */
  actorName?: string | null;
  actorRole?: string | null;
  educatorMap?: Map<string, string>;
}) {
  const safeActorId = actorId ?? "";

  if (safeActorId === "system") {
    return (
      <Badge variant="outline" className="text-xs">
        System
      </Badge>
    );
  }

  const name = actorName ?? (educatorMap?.get(safeActorId) || null);

  if (!name) {
    return (
      <span
        className="block max-w-[160px] truncate text-xs text-muted-foreground"
        title={safeActorId || undefined}
      >
        Deleted account
      </span>
    );
  }

  return (
    <div className="max-w-[180px]" title={safeActorId}>
      <span className="block truncate text-sm font-medium">{name}</span>
      {actorRole && (
        <span className="block text-xs text-muted-foreground">{actorRole}</span>
      )}
    </div>
  );
}