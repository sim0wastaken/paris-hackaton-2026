import type { Metadata, Viewport } from "next";

import { bricolageGrotesque, jetbrainsMono } from "@motive/ds/fonts";
import { cn } from "@motive/ds";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Motive — show up where AI gets asked",
    template: "%s · Motive"
  },
  description:
    "Motive finds the buying conversations where your product belongs — then ships the campaigns, copy, and page fixes you need to win them."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0b0d",
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-grain="on" className={cn(bricolageGrotesque.variable, jetbrainsMono.variable)}>
      <body>{children}</body>
    </html>
  );
}
