"use client";

import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalFooter } from "@/components/shared/Modal";

interface DialogFormProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Mirrors `Modal`'s size set so a wide form is not capped at 2xl. */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  onSubmit?: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  error?: string | null;
  children: React.ReactNode;
}

export function DialogForm({
  open,
  onClose,
  title,
  description,
  size = "lg",
  onSubmit,
  isSaving,
  saveLabel,
  error,
  children,
}: DialogFormProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size={size}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
      >
        <ModalBody>{children}</ModalBody>

        {error && (
          <p className="px-4 text-sm text-destructive">{error}</p>
        )}

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          {onSubmit && (
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : saveLabel ?? "Save"}
            </Button>
          )}
        </ModalFooter>
      </form>
    </Modal>
  );
}
