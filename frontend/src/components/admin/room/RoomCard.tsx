"use client";

import Link from "next/link";
import { DoorOpen, Eye, Pencil, Trash2 } from "lucide-react";

import {
  ListItemCard,
  ListItemCardAction,
  listItemIconClass,
  listItemTitleClass,
} from "@/components/shared/ListItemCard";
import type { Room } from "@/types/admin/room.types";

interface RoomCardProps {
  room: Room;
  onRename: (room: Room) => void;
  onDelete: (room: Room) => void;
}

// Existing utility classes from utilities.css (light + dark variants included)
const ROOM_COLOR_CLASSES = [
  "icon-people",    // blue
  "icon-edu",       // green
  "icon-schedule",  // yellow
  "icon-analytics", // purple
  "icon-credential",// pink
  "icon-global",    // deeper blue
] as const;

// Same room always gets the same color
function pickRoomColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return ROOM_COLOR_CLASSES[hash % ROOM_COLOR_CLASSES.length];
}

export function RoomCard({ room, onRename, onDelete }: RoomCardProps): React.JSX.Element {
  const slotCount = room.slotCount ?? 0;
  const colorClass = pickRoomColor(String(room.id));

  return (
    <ListItemCard>
      <div className="flex items-center gap-3">
        <span
          className={`flex items-center justify-center rounded-lg ${colorClass} ${listItemIconClass}`}
        >
          <DoorOpen className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className={`truncate ${listItemTitleClass}`}>{room.name}</p>
          <p className="text-xs text-muted-foreground">
            {slotCount === 0
              ? "Not used yet"
              : `${slotCount} slot${slotCount === 1 ? "" : "s"} this year`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/admin/rooms/${room.id}`} className="contents">
            <ListItemCardAction icon={Eye} label="View schedule" title="View schedule" iconOnly />
          </Link>
          <ListItemCardAction
            icon={Pencil}
            label="Rename"
            title="Rename"
            iconOnly
            onClick={() => onRename(room)}
          />
          <ListItemCardAction
            icon={Trash2}
            label="Delete"
            title="Delete"
            iconOnly
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(room)}
          />
        </div>
      </div>
    </ListItemCard>
  );
}