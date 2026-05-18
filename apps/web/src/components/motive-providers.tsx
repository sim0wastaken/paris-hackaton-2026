"use client";

import { useRouter } from "next/navigation";
import { MotiveProviders as DSProviders } from "@motive/ds/state";

export function MotiveProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <DSProviders
      locale="en-US"
      navigate={(path, options) => {
        if (options?.replace) router.replace(path);
        else router.push(path);
      }}
    >
      {children}
    </DSProviders>
  );
}
