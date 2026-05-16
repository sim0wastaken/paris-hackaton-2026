import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WorkflowNav } from "@/components/workflow-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Motive — campaign workbench for OpenAI Ads",
  description:
    "Drop in a brand link. Motive streams OpenAI extraction into a live review workspace, generates campaign-ready ad groups and creatives, and produces an OpenAI Ads-compatible export.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 text-zinc-100 antialiased`}
      >
        <WorkflowNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
