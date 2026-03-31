'use client'

import { useState, useMemo } from 'react'
import type { TopPlan } from '@/lib/types'
import { fmtBRL, fmtNum } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { ExcelFilter } from '@/components/ui/ExcelFilter'

interface Props {
  topPlans: TopPlan[]
  isLoading?: boolean
}

function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)) }

type SortMode = 'revenue' | 'count'

export function TopPlans({ topPlans, isLoading }: Props) {
  const [fName, setFName] = useState(new Set<string>())
  const [sortMode, setSortMode] = useState<SortMode>('revenue')

  const sorted = useMemo(() => {
    const base = topPlans.filter(p => fName.size === 0 || fName.has(p.planName))
    return [...base].sort((a, b) =>
      sortMode === 'revenue' ? b.revenue - a.revenue : b.count - a.count
    )
  }, [topPlans, fName, sortMode])

  const maxRevenue = useMemo(() => Math.max(...sorted.map(p => p.revenue), 1), [sorted])
  const maxCount   = useMemo(() => Math.max(...sorted.map(p => p.count), 1), [sorted])

  if (isLoading) {
    return (
      <div className="card rounded-card p-8">
        <Skeleton className="h-5 w-40 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  const nameOpts = unique(topPlans.map(p => p.planName)).sort()

  return (
    <div className="card rounded-card p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
            Top Planos
          </h3>
          <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Planos mais vendidos (concluídos) no período
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Toggle faturamento / vendas */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border-color)' }}
          >
            {(['revenue', 'count'] as SortMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className="px-3 py-1.5 text-xs font-sans font-600 transition-colors"
                style={{
                  backgroundColor: sortMode === mode ? '#08F887' : 'transparent',
                  color: sortMode === mode ? '#0A0C10' : 'var(--text-muted)',
                }}
              >
                {mode === 'revenue' ? 'Faturamento' : 'Nº Vendas'}
              </button>
            ))}
          </div>
          <ExcelFilter label="Plano" values={nameOpts} selected={fName} onChangeSelected={setFName} minWidth={90} />
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Sem dados no período.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((plan, i) => {
            const pct = sortMode === 'revenue'
              ? (plan.revenue / maxRevenue) * 100
              : (plan.count / maxCount) * 100
            const color = i === 0 ? '#08F887' : '#06B6D4'
            return (
              <div key={plan.planName}>
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className="w-5 text-xs font-grotesk font-700 text-right flex-shrink-0"
                    style={{ color: i === 0 ? '#08F887' : 'var(--text-muted)' }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="flex-1 text-sm font-sans font-500 truncate"
                    style={{ color: 'var(--text-primary)' }}
                    title={plan.planName}
                  >
                    {plan.planName}
                  </span>
                  <span className="text-xs font-sans flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {fmtNum(plan.count)}x
                  </span>
                  <span className="text-sm font-grotesk font-700 flex-shrink-0" style={{ color }}>
                    {fmtBRL(plan.revenue)}
                  </span>
                </div>
                <div className="ml-8 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
