"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EmailInputProps {
  value: string;
  onChange: (fullEmail: string) => void;
  extension?: string | null; // e.g. "@edutool.ph"
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Smart email input. If an org extension is set, the user types just the
 * username part and the extension is shown as a suffix badge. The full email
 * (username + extension) is emitted via onChange.
 */
export function EmailInput({
  value,
  onChange,
  extension,
  placeholder,
  disabled,
  className,
}: EmailInputProps): React.JSX.Element {
  const hasExtension = !!extension;

  // Derive the username portion from the full value
  const username = hasExtension && value.endsWith(extension!)
    ? value.slice(0, -extension!.length)
    : value;

  function handleUsernameChange(raw: string) {
    // Strip any "@" the user types — the extension handles that
    const cleaned = raw.replace(/@.*/, "");
    onChange(hasExtension ? `${cleaned}${extension}` : cleaned);
  }

  if (!hasExtension) {
    return (
      <Input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "email@example.com"}
        disabled={disabled}
        className={className}
      />
    );
  }

  return (
    <div className={cn("flex items-center rounded-md border bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}>
      <Input
        type="text"
        value={username}
        onChange={(e) => handleUsernameChange(e.target.value)}
        placeholder={placeholder ?? "username"}
        disabled={disabled}
        className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-r-none"
      />
      <span className="pr-3 text-sm font-mono text-muted-foreground whitespace-nowrap select-none">
        {extension}
      </span>
    </div>
  );
}