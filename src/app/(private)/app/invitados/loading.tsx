function SkeletonLine({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-muted ${className}`} />
}

function DesktopRowSkeleton() {
  return (
    <div className="grid min-h-24 grid-cols-[minmax(18rem,1fr)_11rem_8rem_8rem_15rem] items-start gap-4 border-b border-border/60 px-4 py-4 last:border-0">
      <div className="space-y-3">
        <SkeletonLine className="h-5 w-44" />
        <div className="flex gap-2">
          <SkeletonLine className="h-7 w-28" />
          <SkeletonLine className="h-7 w-24" />
        </div>
      </div>
      <SkeletonLine className="h-5 w-24" />
      <SkeletonLine className="h-7 w-20" />
      <SkeletonLine className="h-7 w-24" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-9 w-9 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    </div>
  )
}

export default function GuestsLoading() {
  return (
    <div
      className="space-y-5"
      aria-busy="true"
      aria-label="Cargando invitados"
    >
      <p className="sr-only">Cargando invitados…</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          <SkeletonLine className="h-9 w-32" />
          <SkeletonLine className="h-9 w-48" />
        </div>
        <div className="flex gap-2">
          <SkeletonLine className="h-10 w-28" />
          <SkeletonLine className="h-10 w-40" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SkeletonLine className="h-10 min-w-56 flex-1" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonLine key={index} className="h-8 w-24" />
          ))}
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl border border-border bg-card p-4"
          >
            <SkeletonLine className="h-5 w-40" />
            <div className="flex gap-2">
              <SkeletonLine className="h-7 w-28" />
              <SkeletonLine className="h-7 w-24" />
            </div>
            <SkeletonLine className="h-8 w-full" />
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
        <div className="grid grid-cols-[minmax(18rem,1fr)_11rem_8rem_8rem_15rem] gap-4 border-b border-border bg-secondary/40 px-4 py-3">
          {["w-24", "w-16", "w-16", "w-14", "w-20"].map(
            (width, index) => (
              <SkeletonLine key={index} className={`h-3 ${width}`} />
            ),
          )}
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <DesktopRowSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}
