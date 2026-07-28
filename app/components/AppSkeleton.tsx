"use client";

/** Full-screen skeleton shown while Clerk is loading auth state. */
export default function AppSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-black text-neutral-100 font-sans flex-col md:flex-row">
      {/* Sidebar skeleton */}
      <aside className="w-56 flex-shrink-0 border-r border-neutral-800 bg-neutral-950 hidden md:flex flex-col">
        <div className="px-5 py-5 border-b border-neutral-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-800 animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-20 rounded bg-neutral-800 animate-pulse" />
            <div className="h-2 w-14 rounded bg-neutral-800/50 animate-pulse" />
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 rounded-lg bg-neutral-800/40 animate-pulse" />
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-neutral-800">
          <div className="h-8 rounded-lg bg-neutral-800/40 animate-pulse" />
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 flex overflow-hidden flex-col md:flex-row bg-black">
        {/* Left panel */}
        <div className="flex flex-1 md:flex-none w-full md:w-96 flex-shrink-0 md:border-r border-neutral-800 flex-col bg-neutral-950">
          <div className="px-6 py-4 border-b border-neutral-800">
            <div className="h-3 w-24 rounded bg-neutral-800 animate-pulse mb-3" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-7 flex-1 rounded-lg bg-neutral-800/50 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="flex-1 px-6 py-5 flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-neutral-800 p-4 flex flex-col gap-2.5">
                <div className="h-2.5 w-16 rounded bg-neutral-800 animate-pulse" />
                <div className="h-5 w-3/4 rounded bg-neutral-800/70 animate-pulse" />
                <div className="h-3 w-full rounded bg-neutral-800/40 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-neutral-800/40 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="hidden md:flex md:flex-1 px-6 py-5 flex-col gap-4 bg-black">
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-neutral-800 animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-20 rounded-lg bg-neutral-800/50 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 animate-pulse" />
        </div>
      </main>
    </div>
  );
}
