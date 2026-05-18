import { AppShell } from "@/components/app-shell";
import { MotiveProviders } from "@/components/motive-providers";

export default function AppGroupLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MotiveProviders>
      <AppShell>{children}</AppShell>
    </MotiveProviders>
  );
}
