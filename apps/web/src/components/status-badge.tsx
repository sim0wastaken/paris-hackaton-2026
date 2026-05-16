type BadgeStatus = "available" | "blocked" | "complete" | "current" | "failed";

const statusClasses: Record<BadgeStatus, string> = {
  available: "tag tag-outline",
  blocked: "tag tag-warn",
  complete: "tag tag-acid",
  current: "tag tag-cyan",
  failed: "tag tag-warn"
};

export function StatusBadge({
  children,
  status
}: {
  children: React.ReactNode;
  status: BadgeStatus;
}) {
  return (
    <span className={statusClasses[status]}>
      {status === "current" ? <span className="dot pulse" /> : null}
      {children}
    </span>
  );
}
