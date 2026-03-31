'use client'

import { useState } from 'react'
import { AlertTriangle, X, Info } from 'lucide-react'

interface Alert {
  id: string
  level: 'warn' | 'critical' | 'info'
  message: string
}

interface Props {
  churnRate: number
  crefPending: number
  inactivePersonals: number
  completedSales: number
  avgRating: number
}

const THRESHOLDS = {
  churnRateWarn: Number(process.env.NEXT_PUBLIC_ALERT_CHURN_WARN ?? 15),
  churnRateCrit: Number(process.env.NEXT_PUBLIC_ALERT_CHURN_CRIT ?? 30),
  crefPendingWarn: Number(process.env.NEXT_PUBLIC_ALERT_CREF_WARN ?? 50),
  crefPendingCrit: Number(process.env.NEXT_PUBLIC_ALERT_CREF_CRIT ?? 100),
  inactiveWarn: Number(process.env.NEXT_PUBLIC_ALERT_INACTIVE_WARN ?? 100),
  ratingWarn: Number(process.env.NEXT_PUBLIC_ALERT_RATING_WARN ?? 3.5),
  zeroSalesWarn: true,
}

export function AlertBanner({ churnRate, crefPending, inactivePersonals, completedSales, avgRating }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const alerts: Alert[] = []

  if (churnRate >= THRESHOLDS.churnRateCrit) {
    alerts.push({ id: 'churn-crit', level: 'critical', message: `Churn crítico: ${churnRate.toFixed(1)}% das vendas foram canceladas no período (limite: ${THRESHOLDS.churnRateCrit}%)` })
  } else if (churnRate >= THRESHOLDS.churnRateWarn) {
    alerts.push({ id: 'churn-warn', level: 'warn', message: `Churn elevado: ${churnRate.toFixed(1)}% das vendas canceladas (limite: ${THRESHOLDS.churnRateWarn}%)` })
  }

  if (crefPending >= THRESHOLDS.crefPendingCrit) {
    alerts.push({ id: 'cref-crit', level: 'critical', message: `${crefPending} personais aguardando aprovação CREF — acima do limite crítico de ${THRESHOLDS.crefPendingCrit}` })
  } else if (crefPending >= THRESHOLDS.crefPendingWarn) {
    alerts.push({ id: 'cref-warn', level: 'warn', message: `${crefPending} personais com CREF pendente (limite: ${THRESHOLDS.crefPendingWarn})` })
  }

  if (inactivePersonals >= THRESHOLDS.inactiveWarn) {
    alerts.push({ id: 'inactive', level: 'warn', message: `${inactivePersonals} personais cadastrados há +30 dias sem nenhuma venda no período` })
  }

  if (avgRating > 0 && avgRating < THRESHOLDS.ratingWarn) {
    alerts.push({ id: 'rating', level: 'warn', message: `Avaliação média dos personais está baixa: ${avgRating.toFixed(2)} ⭐ (mínimo recomendado: ${THRESHOLDS.ratingWarn})` })
  }

  if (completedSales === 0) {
    alerts.push({ id: 'zero-sales', level: 'info', message: 'Nenhuma venda concluída no período selecionado.' })
  }

  const visible = alerts.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  const colors = {
    critical: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', dot: '#EF4444', text: '#EF4444' },
    warn:     { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', dot: '#F59E0B', text: '#F59E0B' },
    info:     { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)', dot: '#6366F1', text: '#6366F1' },
  }

  const Icon = { critical: AlertTriangle, warn: AlertTriangle, info: Info }

  return (
    <section className="space-y-2">
      {visible.map(alert => {
        const c = colors[alert.level]
        const AlertIcon = Icon[alert.level]
        return (
          <div
            key={alert.id}
            className="flex items-start gap-3 px-5 py-3 rounded-xl"
            style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
          >
            <AlertIcon size={14} className="flex-shrink-0 mt-0.5" style={{ color: c.dot }} />
            <p className="flex-1 text-sm font-sans" style={{ color: c.text }}>{alert.message}</p>
            <button
              onClick={() => setDismissed(prev => new Set([...Array.from(prev), alert.id]))}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: c.text }}
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
    </section>
  )
}
