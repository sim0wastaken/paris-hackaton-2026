type BadgeStatus = "available" | "blocked" | "complete" | "current" | "failed";

const statusClasses: Record<BadgeStatus, string> = {
  available: "border-[#b9d8c8] bg-[#eef8f1] text-[#0f7a52]",
  blocked: "border-[#e3d1af] bg-[#fff7e8] text-[#9b6419]",
  complete: "border-[#b9d8c8] bg-[#eef8f1] text-[#0f7a52]",
  current: "border-[#aac9df] bg-[#eef6fb] text-[#195b8f]",
  failed: "border-[#efc0bd] bg-[#fff0ee] text-[#a3382f]"
};

export function StatusBadge({
  children,
  status
}: {
  children: React.ReactNode;
  status: BadgeStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${statusClasses[status]}`}
    >
      {children}
    </span>
  );
}
