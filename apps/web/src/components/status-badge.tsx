import { Tag } from "@motive/ds/primitives";

type BadgeStatus = "available" | "blocked" | "complete" | "current" | "failed";

const toneMap: Record<BadgeStatus, { tone: React.ComponentProps<typeof Tag>["tone"]; dot?: React.ComponentProps<typeof Tag>["dot"] }> = {
  available: { tone: "outline" },
  blocked: { tone: "warn" },
  complete: { tone: "acid" },
  current: { tone: "cyan", dot: "pulse" },
  failed: { tone: "warn" }
};

export function StatusBadge({
  children,
  status
}: {
  children: React.ReactNode;
  status: BadgeStatus;
}) {
  const { tone, dot } = toneMap[status];
  return (
    <Tag dot={dot} tone={tone}>
      {children}
    </Tag>
  );
}
