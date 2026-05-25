"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { queryClient } from "@/lib/query-client.config";

/**
 * App Providers
 * Wraps the entire application with necessary providers:
 * - QueryClientProvider: Global React Query client for data fetching & caching
 * - AuthProvider: Authentication context and state management
 * - Toaster: Sonner toast notifications
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Note: queryClient is a singleton instance from query-client.config.ts
  // This ensures the same instance is reused across all page navigations
  // and maintains cache consistency throughout the app lifecycle

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}