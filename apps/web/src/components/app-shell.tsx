import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#d9dfd8] bg-white/92">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link className="flex items-center gap-3" href="/">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[#17201c] text-sm font-semibold text-white">
              M
            </span>
            <span>
              <span className="block text-sm font-semibold">Motive</span>
              <span className="block text-xs text-[#66706b]">
                Campaign workbench
              </span>
            </span>
          </Link>
          <span className="rounded-md border border-[#d9dfd8] px-2.5 py-1 text-xs text-[#66706b]">
            OpenAI-first v1
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
