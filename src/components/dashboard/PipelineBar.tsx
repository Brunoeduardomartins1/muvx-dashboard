'use client'

import { STATUS_LABELS, STATUS_COLORS, fmtNum } from '@/lib/utils'

interface Props {
  purchasesByStatus: Record<string, number>
  totalPersonals: number
  crefPending: number
  isLoading?: boolean
}

import { Skeleton } from '@/components/ui/Skeleton'

function PipelineSkeleton() {
  return (
    <div className="rounded-card p-8 bg-surface border border-border">
      <Skeleton className="h-5 w-44 mb-6" />
      <Skeleton className="h-8 w-full rounded-pill mb-4" />
      <div className="flex gap-4 flex-wrap">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-4 w-24" />)}
      </div>
    </div>
  )
}

export function PipelineBar({ purchasesByStatus, totalPersonals, crefPending, isLoading }: Props) {
  if (isLoading) return <PipelineSkeleton />

  const total = Object.values(purchasesByStatus).reduce((a, b) => a + b, 0)

  const segments = Object.entries(purchasesByStatus)
    .map(([status, count]) => ({
      status,
      label: STATUS_LABELS[status] ?? status,
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
      color: STATUS_COLORS[status] ?? '#9CA3AF',
    }))
    .sort((a, b) => b.count - a.count)

  if (segments.length === 0) {
    return (
      <div className="rounded-card p-8 bg-surface border border-border">
        <h3 className="font-grotesk font-700 text-base text-text mb-4">Pipeline de Assinaturas</h3>
        <p className="text-sm font-sans text-text-muted">Sem dados no período selecionado.</p>
      </div>
    )
  }

  return (
    <div className="rounded-card p-8 bg-surface border border-border card-hover">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-grotesk font-700 text-base text-text">Pipeline de Assinaturas</h3>
          <p className="text-xs font-sans text-text-muted mt-0.5">
            {fmtNum(total)} compras no período
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="font-grotesk font-700 text-xl text-text">{fmtNum(totalPersonals)}</p>
            <p className="text-xs font-sans text-text-muted uppercase tracking-wide">Personais</p>
          </div>
          {crefPending > 0 && (
            <div className="text-right">
              <p className="font-grotesk font-700 text-xl text-status-processing">{fmtNum(crefPending)}</p>
              <p className="text-xs font-sans text-text-muted uppercase tracking-wide">CREF Pend.</p>
            </div>
          )}
        </div>
      </div>

      {/* Barra horizontal segmentada */}
      <div className="flex rounded-pill overflow-hidden h-8 mb-4">
        {segments.map((seg) => (
          <div
            key={seg.status}
            title={`${seg.label}: ${fmtNum(seg.count)}`}
            style={{
              width: `${seg.pct}%`,
              backgroundColor: seg.color,
              opacity: 0.85,
              minWidth: seg.pct > 0 ? 4 : 0,
            }}
            className="transition-all duration-500"
          />
        ))}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {segments.map((seg) => (
          <div key={seg.status} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-xs font-sans text-text-secondary">
              {seg.label}
            </span>
            <span className="text-xs font-sans font-600 text-text">
              {fmtNum(seg.count)}
            </span>
            <span className="text-xs font-sans text-text-muted">
              ({seg.pct.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
