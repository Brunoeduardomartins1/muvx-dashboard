'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/Skeleton'

const PaymentMethodChartInner = dynamic(() => import('./PaymentMethodChartInner'), { ssr: false })

interface Props {
  breakdown: Record<string, number>
  recurrenceBreakdown: Record<string, number>
  isLoading?: boolean
}

const RECURRENCE_LABELS: Record<string, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
}

export function PaymentMethodChart({ breakdown, recurrenceBreakdown, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card rounded-card p-8">
        <Skeleton className="h-5 w-44 mb-2" />
        <Skeleton className="h-3 w-32 mb-6" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    )
  }

  const recurrenceEntries = Object.entries(recurrenceBreakdown).sort((a, b) => b[1] - a[1])

  return (
    <div className="card rounded-card p-8 flex flex-col">
      <div className="mb-5">
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
          Métodos de Pagamento
        </h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Distribuição das formas de pagamento no período
        </p>
      </div>

      <PaymentMethodChartInner breakdown={breakdown} />

      {recurrenceEntries.length > 0 && (
        <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p className="text-xs font-sans font-600 uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Recorrência
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {recurrenceEntries.map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="text-xs font-sans" style={{ color: 'var(--text-secondary)' }}>
                  {RECURRENCE_LABELS[key] ?? key}
                </span>
                <span className="text-xs font-grotesk font-700" style={{ color: 'var(--text-primary)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
