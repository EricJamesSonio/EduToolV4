"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import { Modal, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateRoom, useRenameRoom } from "@/hooks/admin/useRooms";
import type { Room } from "@/types/admin/room.types";

interface RoomNameDialogProps {
  open: boolean;
  onClose: () => void;
  /** Present = rename mode, absent = create mode. */
  room?: Room | null;
}

const MAX_NAME = 50;

/**
 * One dialog for both adding and renaming a room — a room is a single free-text
 * name, so a shared form is simpler than two near-identical ones.
 */
export function RoomNameDialog({
  open,
  onClose,
  room,
}: RoomNameDialogProps): React.JSX.Element {
  const isRename = !!room;
  const [name, setName] = useState("");

  const createRoom = useCreateRoom();
  const renameRoom = useRenameRoom();
  const isPending = createRoom.isPending || renameRoom.isPending;

  // Reload the field each time the dialog opens so a cancelled rename never
  // leaks its draft into the next open.
  useEffect(() => {
    if (open) setName(room?.name ?? "");
  }, [open, room]);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_NAME && !isPending;

  const handleSubmit = (): void => {
    if (!canSubmit) return;
    const onError = (err: unknown): void => {
      const message = (err as AxiosError<{ message: string }>)?.response?.data?.message;
      toast.error(message ?? "Something went wrong.");
    };

    if (room) {
      // Nothing changed — don't fire a pointless request.
      if (trimmed === room.name) {
        onClose();
        return;
      }
      renameRoom.mutate(
        { id: room.id, name: trimmed },
        {
          onSuccess: () => {
            toast.success("Room renamed.");
            onClose();
          },
          onError,
        },
      );
      return;
    }

    createRoom.mutate(trimmed, {
      onSuccess: () => {
        toast.success("Room added.");
        onClose();
      },
      onError,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isRename ? "Rename room" : "Add room"}
      description={
        isRename
          ? "Renaming updates every schedule slot that uses this room."
          : "A room name is free text — 'Room 201', 'Lab B', 'Gym'."
      }
      size="sm"
    >
      <ModalBody>
        <div className="space-y-1.5">
          <Label htmlFor="room-name">Room name</Label>
          <Input
            id="room-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Room 201"
            maxLength={MAX_NAME}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {name.length}/{MAX_NAME} characters.
          </p>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
          {isPending
            ? "Saving..."
            : isRename
              ? "Save changes"
              : "Add room"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}