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

export function TopPlans({ topPlans, isLoading }: Props) {
  const [fName, setFName] = useState(new Set<string>())

  const filtered = useMemo(() => topPlans.filter(p =>
    fName.size === 0 || fName.has(p.planName)
  ), [topPlans, fName])

  const total = filtered.reduce((s, p) => s + p.revenue, 0)

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
        <ExcelFilter label="Plano" values={nameOpts} selected={fName} onChangeSelected={setFName} minWidth={100} />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Sem dados no período.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((plan, i) => {
            const pct = total > 0 ? (plan.revenue / total) * 100 : 0
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
                  <span className="text-sm font-grotesk font-700 flex-shrink-0" style={{ color: '#08F887' }}>
                    {fmtBRL(plan.revenue)}
                  </span>
                </div>
                {/* progress bar */}
                <div className="ml-8 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: i === 0 ? '#08F887' : '#06B6D4' }}
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
