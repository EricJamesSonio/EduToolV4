"use client";

import Link from "next/link";
import { DoorOpen, Eye, Pencil, Trash2 } from "lucide-react";

import {
  ListItemCard,
  ListItemCardAction,
  listItemActionsClass,
  listItemIconClass,
  listItemTitleClass,
} from "@/components/shared/ListItemCard";
import type { Room } from "@/types/admin/room.types";

interface RoomCardProps {
  room: Room;
  onRename: (room: Room) => void;
  onDelete: (room: Room) => void;
}

export function RoomCard({ room, onRename, onDelete }: RoomCardProps): React.JSX.Element {
  const slotCount = room.slotCount ?? 0;

  return (
    <ListItemCard className="flex flex-col justify-between">
      <div className="flex items-start gap-3">
        <span
          className={`flex items-center justify-center rounded-lg bg-muted text-muted-foreground ${listItemIconClass}`}
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
      </div>

      <div className={listItemActionsClass}>
        <Link href={`/admin/rooms/${room.id}`} className="contents">
          <ListItemCardAction icon={Eye} label="View schedule" />
        </Link>
        <ListItemCardAction
          icon={Pencil}
          label="Rename"
          onClick={() => onRename(room)}
        />
        <ListItemCardAction
          icon={Trash2}
          label="Delete"
          onClick={() => onDelete(room)}
        />
      </div>
    </ListItemCard>
  );
}