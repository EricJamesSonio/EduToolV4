"use client";

import dynamic from "next/dynamic";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { queryClient } from "@/lib/query-client.config";

const DevDebugPanel = dynamic(
  () => import("@/utils/dev-debug-panel").then(m => ({ default: m.DevDebugPanel })),
  { ssr: false },
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster richColors position="top-right" />
        {process.env.NODE_ENV === 'development' && (
          <>
            <ReactQueryDevtools initialIsOpen={false} />
            <DevDebugPanel />
          </>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}