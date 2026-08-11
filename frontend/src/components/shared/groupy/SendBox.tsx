"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GifPickerPopover } from "./GifPickerPopover";
import { StickerPickerPopover } from "./StickerPickerPopover";

interface SendBoxProps {
  onSend: (text: string) => Promise<void>;
  onSendGif: (gifUrl: string) => Promise<void>;
  onSendSticker: (stickerId: string) => Promise<void>;
  onOpenPollCreator: () => void;
  canCreatePoll: boolean;
  disabled?: boolean;
}

export function SendBox({
  onSend,
  onSendGif,
  onSendSticker,
  onOpenPollCreator,
  canCreatePoll,
  disabled,
}: SendBoxProps): React.JSX.Element {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setInput("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border p-3 flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <GifPickerPopover onSend={onSendGif} />
        <StickerPickerPopover onSend={onSendSticker} />
        {canCreatePoll && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 h-8 px-2"
            onClick={onOpenPollCreator}
          >
            <ListChecks className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Send a message..."
          disabled={disabled || sending}
          className="flex-1 text-sm bg-muted rounded-lg px-3 py-1.5 outline-none border border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground disabled:opacity-60"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Send
        </Button>
      </div>
    </div>
  );
}