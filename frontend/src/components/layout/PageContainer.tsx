"use client";

import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard page surface container
 * - ensures consistent background contrast vs sidebar
 * - prevents "black-on-black" UI bugs
 * - replaces ad-hoc padding/background usage
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        // KEY PART: ensures readable contrast area
        "min-h-full rounded-xl border border-black bg-white text-black",
        "shadow-sm",
        "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}