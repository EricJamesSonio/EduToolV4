import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  /** If true, wraps in a centered full-area container */
  centered?: boolean;
}

export function LoadingSpinner({
  size = "md",
  className,
  centered = true,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin rounded-full border-muted-foreground/30 border-t-foreground",
        SIZE_MAP[size],
        className
      )}
    />
  );

  if (centered) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}