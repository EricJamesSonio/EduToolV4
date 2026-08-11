"use client";

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { groupyApi } from "@/api/shared/groupy.api";
import type { GifSearchResult } from "@/types/groupy/groupy.types";

interface GifPickerPopoverProps {
  onSend: (gifUrl: string) => Promise<void>;
}

export function GifPickerPopover({
  onSend,
}: GifPickerPopoverProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GifSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q || !open) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await groupyApi.searchGifs(q);
        if (!cancelled) setResults(data);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  const handlePick = async (gif: GifSearchResult) => {
    await onSend(gif.url);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className="inline-flex items-center gap-1 rounded-md h-8 px-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        GIF
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <div className="flex items-center gap-2 border border-border rounded-lg px-2 py-1 mb-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="h-56 overflow-y-auto grid grid-cols-2 gap-2">
          {loading && (
            <div className="col-span-2 flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && results.length === 0 && (
            <p className="col-span-2 text-center text-xs text-muted-foreground py-8">
              {query.trim() ? "No results." : "Type to search GIFs."}
            </p>
          )}
          {results.map((gif) => (
            <button
              key={gif.id}
              type="button"
              onClick={() => handlePick(gif)}
              className="relative aspect-video rounded-md overflow-hidden border border-border hover:ring-2 hover:ring-primary/60 transition"
            >
              <img
                src={gif.previewUrl ?? gif.url}
                alt={gif.id}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}