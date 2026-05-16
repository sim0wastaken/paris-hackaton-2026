export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8">
      <div className="h-8 w-44 animate-pulse rounded bg-[#dce2dc]" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-lg border border-[#d9dfd8] bg-white" />
        <div className="h-28 animate-pulse rounded-lg border border-[#d9dfd8] bg-white" />
        <div className="h-28 animate-pulse rounded-lg border border-[#d9dfd8] bg-white" />
      </div>
    </main>
  );
}
