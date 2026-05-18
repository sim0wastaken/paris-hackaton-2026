import type { Metadata, Viewport } from "next";
import { bricolageGrotesque, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motive — show up where AI gets asked",
  description:
    "Motive finds the buying conversations where your product belongs — then ships the campaigns, copy, and page fixes you need to win them. Before the channel fills up.",
  metadataBase: new URL("https://motive.app"),
  openGraph: {
    title: "Motive — get found on ChatGPT",
    description:
      "Map the prompts where your product belongs. Ship the campaigns, copy, and page fixes that earn the recommendation.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0b0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-grain="on"
      className={`${bricolageGrotesque.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
