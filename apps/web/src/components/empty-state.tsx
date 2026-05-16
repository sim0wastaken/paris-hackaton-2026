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
    <section className="card empty-state">
      <p className="kicker muted">
        {eyebrow}
      </p>
      <h1 className="t-h4 mt-3">{title}</h1>
      <div className="mt-3">{children}</div>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
