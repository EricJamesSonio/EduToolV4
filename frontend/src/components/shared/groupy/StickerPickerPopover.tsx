"use client";

import { useState } from "react";
import { Sticker } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGroupyStickers } from "@/hooks/groupy/useGroupyStickers";

interface StickerPickerPopoverProps {
  onSend: (stickerId: string) => Promise<void>;
}

export function StickerPickerPopover({
  onSend,
}: StickerPickerPopoverProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const { data: stickers, isLoading } = useGroupyStickers();

  const handlePick = async (stickerId: string) => {
    await onSend(stickerId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className="inline-flex items-center gap-1 rounded-md h-8 px-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        <Sticker className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <div className="grid grid-cols-5 gap-1.5">
          {isLoading &&
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-md bg-muted" />
            ))}
          {!isLoading &&
            (stickers ?? []).map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                onClick={() => handlePick(sticker.id)}
                title={sticker.label}
                className="rounded-md overflow-hidden border border-border hover:ring-2 hover:ring-primary/60 transition aspect-square"
              >
                <img
                  src={sticker.assetPath}
                  alt={sticker.label}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}