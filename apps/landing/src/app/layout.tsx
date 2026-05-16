import type { Metadata } from "next";
import { instrumentSans, instrumentSerif, jetbrainsMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motive — Intent infrastructure for AI-native acquisition",
  description:
    "Motive maps the AI-mediated buying conversations your product belongs in — then turns them into context hints, ad groups, creative angles, and the landing-page fixes you need before the channel gets crowded.",
  metadataBase: new URL("https://motive.app"),
  openGraph: {
    title: "Motive — Intent infrastructure for AI-native acquisition",
    description:
      "The layer before the ad spend. Map AI buying conversations, ship launch-ready ChatGPT Ads assets.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
