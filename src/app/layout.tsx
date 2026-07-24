import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Pearl Marina Community", template: "%s | Pearl Marina" },
  description: "The private community portal for Pearl Marina homeowners, residents, and service teams.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b3b32" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${openSans.variable} ${openSans.className}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">{children}<Analytics /></body>
    </html>
  );
}
