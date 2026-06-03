"use client";

import { Badge } from "@/components/ui/badge";

export function ActorCell({
  actorId,
  educatorMap,
}: {
  actorId?: string | null;
  educatorMap: Map<string, string>;
}) {
  const safeActorId = actorId ?? "unknown";

  if (safeActorId === "system") {
    return (
      <Badge variant="outline" className="font-mono text-xs">
        System
      </Badge>
    );
  }

  const name = educatorMap.get(safeActorId) ?? null;

  return name ? (
    <span className="text-sm font-medium truncate max-w-[160px] block" title={safeActorId}>
      {name}
    </span>
  ) : (
    <span
      className="font-mono text-xs text-muted-foreground truncate max-w-[160px] block"
      title={safeActorId}
    >
      {safeActorId}
    </span>
  );
}
