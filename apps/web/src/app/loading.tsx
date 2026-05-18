export default function Loading() {
  return (
    <main className="app-main flex flex-col gap-4">
      <div className="loading-block h-7 w-full max-w-44 sm:h-8" />
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="loading-block h-24 sm:h-28" />
        <div className="loading-block h-24 sm:h-28" />
        <div className="loading-block h-24 sm:h-28" />
      </div>
    </main>
  );
}
