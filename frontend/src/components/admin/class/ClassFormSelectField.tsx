"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export interface SelectFieldOption {
  value: string;
  label: string;
  /** Secondary line under the label (e.g. semester date range). */
  description?: string;
  /** Inline note next to the label (e.g. "(already has a class)"). */
  note?: string;
  disabled?: boolean;
}

interface ClassFormSelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder: string;
  emptyMessage: string;
  disabled?: boolean;
  /** Overrides the trigger text (e.g. "Select a department first"). */
  statusText?: string;
  helperText?: string;
  errorText?: string;
}

export function ClassFormSelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  emptyMessage,
  disabled,
  statusText,
  helperText,
  errorText,
}: ClassFormSelectFieldProps): React.JSX.Element {
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")} disabled={disabled}>
        <SelectTrigger>
          <span>{statusText ?? selectedLabel ?? placeholder}</span>
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            options.map((o) => (
              <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
                <div className="flex flex-col">
                  <span>
                    {o.label}
                    {o.note && (
                      <span className="ml-2 text-xs text-muted-foreground">{o.note}</span>
                    )}
                  </span>
                  {o.description && (
                    <span className="text-xs text-muted-foreground">{o.description}</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      {errorText && <p className="text-xs text-destructive">{errorText}</p>}
    </div>
  );
}