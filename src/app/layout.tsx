import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";

import "./globals.css";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
});

const accentFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-accent",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Opening Day Feed",
  description: "Instagram-like social feed frontend built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${uiFont.variable} ${accentFont.variable}`}>{children}</body>
    </html>
  );
}
