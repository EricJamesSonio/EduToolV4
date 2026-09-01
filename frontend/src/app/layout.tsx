import type { Metadata, Viewport } from "next";
import { Kodchasan, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "./providers";

const kodchasan = Kodchasan({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kodchasan",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Relief-ED",
  description: "Academic management platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${kodchasan.variable} ${jetbrainsMono.variable} ${plusJakartaSans.variable}`}
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}