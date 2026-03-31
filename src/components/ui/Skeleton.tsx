import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={cn('skeleton', className)} style={style} />
}

export function StatCardSkeleton({ dark }: { dark?: boolean }) {
  const bg = dark ? 'bg-dark-card' : 'bg-surface border border-border'
  return (
    <div className={`rounded-card p-8 ${bg}`}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className={`h-12 w-40 mb-3 ${dark ? 'bg-[#2a2a2d]' : ''}`} />
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-card p-8 bg-surface border border-border h-64 flex flex-col gap-3">
      <Skeleton className="h-4 w-32 mb-2" />
      <div className="flex items-end gap-2 flex-1">
        {[60, 80, 45, 90, 55, 70, 40].map((h, i) => (
          <div key={i} className="flex-1 flex items-end">
            <Skeleton className="w-full rounded-t" style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function RingSkeleton() {
  return (
    <div className="rounded-card p-8 bg-surface border border-border h-64 flex flex-col items-center justify-center gap-4">
      <Skeleton className="h-40 w-40 rounded-full" />
      <Skeleton className="h-4 w-28" />
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="rounded-card bg-surface border border-border overflow-hidden">
      <div className="px-8 py-5 border-b border-border">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-8 py-4 flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-6 w-16 rounded-pill" />
          </div>
        ))}
      </div>
    </div>
  )
}
