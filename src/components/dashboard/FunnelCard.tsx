'use client'

import { fmtNum, fmtPct } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  registered: number
  withProduct: number
  withSale: number
  isLoading?: boolean
}

export function FunnelCard({ registered, withProduct, withSale, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card rounded-card p-8">
        <Skeleton className="h-5 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  const steps = [
    { label: 'Cadastraram', value: registered, pct: 100, color: '#6B7280' },
    { label: 'Criaram produto', value: withProduct, pct: registered > 0 ? (withProduct / registered) * 100 : 0, color: '#06B6D4' },
    { label: 'Fizeram venda', value: withSale, pct: registered > 0 ? (withSale / registered) * 100 : 0, color: '#08F887' },
  ]

  return (
    <div className="card rounded-card p-8">
      <div className="mb-6">
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
          Funil de Ativação
        </h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Cadastro → Produto → Venda
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-sans font-600" style={{ color: 'var(--text-secondary)' }}>
                {step.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
                  {fmtPct(step.pct, 0)}
                </span>
                <span className="font-grotesk font-700 text-sm" style={{ color: step.color }}>
                  {fmtNum(step.value)}
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${step.pct}%`, backgroundColor: step.color }}
              />
            </div>
            {i < steps.length - 1 && (
              <p className="text-xs font-sans mt-1" style={{ color: 'var(--text-muted)' }}>
                {steps[i + 1].value > 0 && step.value > 0
                  ? `↓ ${fmtPct((steps[i + 1].value / step.value) * 100, 0)} avançaram`
                  : ''}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
