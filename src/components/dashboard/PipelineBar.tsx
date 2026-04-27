'use client'

import { STATUS_GROUP_LABELS, STATUS_GROUP_COLORS, groupPurchaseStatuses, fmtNum, type StatusGroup } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  purchasesByStatus: Record<string, number>
  totalPersonals: number
  isLoading?: boolean
}

function PipelineSkeleton() {
  return (
    <div className="card rounded-card p-8">
      <Skeleton className="h-5 w-44 mb-6" />
      <Skeleton className="h-8 w-full rounded-pill mb-4" />
      <div className="flex gap-4 flex-wrap">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-4 w-24" />)}
      </div>
    </div>
  )
}

export function PipelineBar({ purchasesByStatus, totalPersonals, isLoading }: Props) {
  if (isLoading) return <PipelineSkeleton />

  const total = Object.values(purchasesByStatus).reduce((a, b) => a + b, 0)
  const grouped = groupPurchaseStatuses(purchasesByStatus)
  const segments = (Object.entries(grouped) as [StatusGroup, number][])
    .filter(([, count]) => count > 0)
    .map(([group, count]) => ({
      status: group,
      label: STATUS_GROUP_LABELS[group],
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
      color: STATUS_GROUP_COLORS[group],
    }))
    .sort((a, b) => b.count - a.count)

  if (segments.length === 0) {
    return (
      <div className="card rounded-card p-8">
        <h3 className="font-grotesk font-700 text-base mb-4" style={{ color: 'var(--text-primary)' }}>
          Pipeline de Assinaturas
        </h3>
        <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
          Sem dados no período selecionado.
        </p>
      </div>
    )
  }

  return (
    <div className="card rounded-card p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
            Pipeline de Assinaturas
          </h3>
          <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {fmtNum(total)} compras no período
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="font-grotesk font-700 text-xl" style={{ color: 'var(--text-primary)' }}>
              {fmtNum(totalPersonals)}
            </p>
            <p className="text-xs font-sans uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Personais
            </p>
          </div>
        </div>
      </div>

      {/* Barra horizontal */}
      <div className="flex rounded-pill overflow-hidden h-8 mb-5">
        {segments.map((seg) => (
          <div
            key={seg.status}
            title={`${seg.label}: ${fmtNum(seg.count)}`}
            style={{
              width: `${seg.pct}%`,
              backgroundColor: seg.color,
              opacity: 0.85,
              minWidth: seg.pct > 0 ? 4 : 0,
              transition: 'width 500ms ease',
            }}
          />
        ))}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((seg) => (
          <div key={seg.status} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs font-sans" style={{ color: 'var(--text-secondary)' }}>
              {seg.label}
            </span>
            <span className="text-xs font-sans font-600" style={{ color: 'var(--text-primary)' }}>
              {fmtNum(seg.count)}
            </span>
            <span className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
              ({seg.pct.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
