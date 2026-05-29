"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/meeting/socket.types";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (message: string) => void;
}

export function ChatPanel({
  messages,
  currentUserId,
  onSend,
}: ChatPanelProps): React.JSX.Element {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-zinc-500 text-center pt-4">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div
              key={`${msg.senderId}-${msg.createdAt}-${i}`}
              className={cn("flex", isOwn ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[85%] space-y-0.5",
                isOwn && "items-end"
              )}>
                <p className={cn(
                  "text-[11px] font-medium px-1",
                  isOwn ? "text-zinc-400 text-right" : "text-zinc-500"
                )}>
                  {isOwn ? "You" : msg.senderName}
                </p>
                <div className={cn(
                  "rounded-xl px-3 py-2 text-sm leading-relaxed break-words",
                  isOwn
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-tl-sm"
                )}>
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-zinc-800 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Send a message..."
          className="flex-1 text-sm bg-zinc-800 rounded-lg px-3 py-1.5 outline-none border border-zinc-700 focus:border-blue-500/50 text-zinc-100 placeholder-zinc-500"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!input.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
