import type { Metadata } from "next";

import { bricolageGrotesque, jetbrainsMono } from "@motive/ds/fonts";
import { cn } from "@motive/ds";

import { AppShell } from "@/components/app-shell";
import { MotiveProviders } from "@/components/motive-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Motive",
  description: "OpenAI-first campaign workbench for the Paris AI Hackathon demo."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(bricolageGrotesque.variable, jetbrainsMono.variable)}>
      <body>
        <MotiveProviders>
          <AppShell>{children}</AppShell>
        </MotiveProviders>
      </body>
    </html>
  );
}
