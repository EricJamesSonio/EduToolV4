"use client";

import dynamic from "next/dynamic";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { queryClient } from "@/lib/query-client.config";

const Devtools = dynamic(
  () =>
    import("@tanstack/react-query-devtools").then(
      (module) => module.ReactQueryDevtools,
    ),
  { ssr: false },
);

const DevDebugPanel = dynamic(
  () =>
    import("@/utils/dev-debug-panel").then(
      (module) => module.DevDebugPanel,
    ),
  { ssr: false },
);

export function Providers({ children }: { children: React.ReactNode }) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}

        <Toaster richColors position="top-right" />

        {isDevelopment && (
          <>
            <Devtools initialIsOpen={false} />
            <DevDebugPanel />
          </>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}