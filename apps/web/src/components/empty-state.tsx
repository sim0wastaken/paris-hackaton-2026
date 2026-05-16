export function EmptyState({
  action,
  children,
  eyebrow,
  title
}: {
  action?: React.ReactNode;
  children?: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[#d9dfd8] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase text-[#9b6419]">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-xl font-semibold text-[#17201c]">{title}</h1>
      <div className="mt-3">{children}</div>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
