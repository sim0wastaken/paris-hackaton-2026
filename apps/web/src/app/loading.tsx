export default function Loading() {
  return (
    <main className="app-main flex flex-col gap-4">
      <div className="loading-block h-8 w-44" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="loading-block h-28" />
        <div className="loading-block h-28" />
        <div className="loading-block h-28" />
      </div>
    </main>
  );
}
