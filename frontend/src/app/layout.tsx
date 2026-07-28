import type { Metadata } from "next";
import "../styles/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Relief-ED",
  description: "Academic management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}