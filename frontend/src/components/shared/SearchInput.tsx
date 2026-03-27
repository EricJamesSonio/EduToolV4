"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
  className,
  disabled,
}: SearchInputProps) {
  // Internal state for immediate UI feedback; debounce propagates to parent
  const [internal, setInternal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if parent resets value externally
  useEffect(() => {
    setInternal(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setInternal(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onChange(next);
    }, debounceMs);
  };

  const handleClear = () => {
    setInternal("");
    if (timer.current) clearTimeout(timer.current);
    onChange("");
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        value={internal}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-9 pr-9"
      />
      {internal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}