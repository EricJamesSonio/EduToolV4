// ===== File: frontend/src/components/shared/EmailInput.tsx =====
"use client";

import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  extension?: string | null;
  placeholder?: string;
  disabled?: boolean;
  role?: "student" | "educator"; // ✅ NEW: Role-based suffix
  includeUsernameSeparator?: boolean;
}

/**
 * ✅ NEW: EmailInput with role-based extension suffix
 *
 * If extension is "@example.com" and role is "student":
 * - User types: "juan123"
 * - Output email: "juan123@example.student.com"
 *
 * If role is "educator":
 * - User types: "mr_dela_cruz"
 * - Output email: "mr_dela_cruz@example.educator.com"
 */
export function EmailInput({
  value,
  onChange,
  extension,
  placeholder = "username",
  disabled = false,
  role = "student",
  includeUsernameSeparator = false,
}: EmailInputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);

  // Build full email extension with role suffix — inserts role before first dot (e.g. cmi.edu -> cmi.student.edu)
  const fullExtension = useMemo(() => {
    if (!extension) return "";

    const base = extension.replace(/^@/, "").trim();
    const firstDot = base.indexOf(".");
    let domain: string;
    if (role === "student") {
      domain = firstDot >= 0 ? `${base.slice(0, firstDot)}.student${base.slice(firstDot)}` : `student.${base}`;
    } else if (role === "educator") {
      domain = firstDot >= 0 ? `${base.slice(0, firstDot)}.educator${base.slice(firstDot)}` : `educator.${base}`;
    } else {
      domain = base;
    }
    return `@${domain.toLowerCase()}`;
  }, [extension, role]);

  // Parse the input value (username only)
  const username = value.replace(fullExtension, "").replace(/@.*$/, "");

  // Build the full email for display
  const displayEmail = fullExtension ? `${username}${fullExtension}` : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Remove any @ symbols or existing extensions
    const cleanedUsername = input
      .replace(/@.*$/, "") // Remove everything after @
      .replace(/\s/g, "") // Remove spaces
      .toLowerCase();

    onChange(cleanedUsername);
  };

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          type="email"
          placeholder={placeholder || "username"}
          value={username}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          autoComplete="off"
          className="pr-32"
        />
        {/* Display extension in placeholder style inside input */}
        {isFocused && username && fullExtension && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {fullExtension}
          </span>
        )}
      </div>

      {/* ✅ Show preview below input when not focused */}
      {!isFocused && username && fullExtension && (
        <p className="text-xs text-muted-foreground">
          Full email: <span className="font-mono text-foreground">{displayEmail}</span>
        </p>
      )}

      {!extension && (
        <p className="text-xs text-muted-foreground italic">
          No email extension set in organization. Ask your admin to configure one.
        </p>
      )}
    </div>
  );
}