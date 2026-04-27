'use client'

import { fmtNum, fmtPct } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import type { FunnelStage } from '@/lib/types'

interface Props {
  stages: FunnelStage[]
  isLoading?: boolean
}

const STAGE_COLORS: Record<FunnelStage['key'], string> = {
  registered:  '#6B7280',
  product:     '#06B6D4',
  invited:     '#F59E0B',
  sold_once:   '#08F887',
  sold_multi:  '#10B981',
  recurring:   '#A855F7',
}

export function FunnelCard({ stages, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card rounded-card p-8">
        <Skeleton className="h-5 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  const total = stages.reduce((s, st) => s + st.count, 0)

  // Cumulativo: quantos personais atingiram esta etapa OU uma posterior
  // (cada personal está em UMA etapa exclusiva — a mais avançada que atingiu)
  const cumulative = stages.map((_, i) =>
    stages.slice(i).reduce((s, st) => s + st.count, 0)
  )

  return (
    <div className="card rounded-card p-8">
      <div className="mb-6">
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
          Funil de Ativação
        </h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Coorte: personais cadastrados no período · cada um aparece em 1 etapa só
        </p>
      </div>

      <div className="space-y-3">
        {stages.map((stage, i) => {
          const reached = cumulative[i]
          const reachedPct = total > 0 ? (reached / total) * 100 : 0
          const stagePct = total > 0 ? (stage.count / total) * 100 : 0
          const color = STAGE_COLORS[stage.key]
          const next = stages[i + 1]
          const nextReached = i + 1 < cumulative.length ? cumulative[i + 1] : null
          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-sans font-600" style={{ color: 'var(--text-secondary)' }}>
                  {stage.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-sans" style={{ color: 'var(--text-muted)' }} title="Personais nesta etapa exclusiva">
                    {fmtNum(stage.count)} ({fmtPct(stagePct, 0)})
                  </span>
                  <span className="font-grotesk font-700 text-sm" style={{ color }} title="Personais que atingiram esta etapa ou uma posterior">
                    {fmtNum(reached)}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${reachedPct}%`, backgroundColor: color }}
                />
              </div>
              {next && nextReached !== null && (
                <p className="text-xs font-sans mt-1" style={{ color: 'var(--text-muted)' }}>
                  {reached > 0
                    ? `↓ ${fmtPct((nextReached / reached) * 100, 0)} avançam para ${next.label.toLowerCase()}`
                    : ''}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
        <span className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
          Total de personais
        </span>
        <span className="font-grotesk font-700 text-sm" style={{ color: 'var(--text-primary)' }}>
          {fmtNum(total)}
        </span>
      </div>
    </div>
  )
}
