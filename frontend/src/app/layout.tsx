// src/app/layout.tsx
// Root layout — wraps ALL pages.
// Providers (QueryClient, AuthContext, Toaster) will be added in Phase 5.
// For now: fonts, metadata, globals import.

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/styles/globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default:  "EduTool",
    template: "%s | EduTool",
  },
  description: "Academic management system",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(GeistSans.variable, GeistMono.variable, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        {/*
          Providers added here in Phase 5:
          <QueryClientProvider>
            <AuthContext>
              {children}
              <Toaster />
            </AuthContext>
          </QueryClientProvider>
        */}
        {children}
      </body>
    </html>
  );
}
