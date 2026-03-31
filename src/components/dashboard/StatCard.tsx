'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { fmtNum, fmtBRL } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number
  delta?: number
  deltaLabel?: string
  dark?: boolean
  format?: 'number' | 'currency'
  suffix?: string
  icon?: React.ReactNode
  sublabel?: string
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  dark = false,
  format = 'number',
  suffix,
  icon,
  sublabel,
}: StatCardProps) {
  const animated = useCountUp(value, 800)

  const bg = dark ? 'bg-dark-card' : 'bg-surface border border-border'
  const labelColor = dark ? 'text-[#83898F]' : 'text-text-muted'
  const valueColor = dark ? 'text-green' : 'text-text'

  const deltaPositive = delta !== undefined && delta > 0
  const deltaNegative = delta !== undefined && delta < 0
  const deltaColor = deltaPositive
    ? 'text-green'
    : deltaNegative
    ? 'text-status-error'
    : 'text-text-muted'

  const DeltaIcon = deltaPositive ? TrendingUp : deltaNegative ? TrendingDown : Minus

  return (
    <div className={`rounded-card p-8 card-hover ${bg}`}>
      <div className="flex items-start justify-between mb-4">
        <span className={`text-xs font-sans font-600 uppercase tracking-widest ${labelColor}`}>
          {label}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-green/10 text-green">
            {icon}
          </div>
        )}
      </div>

      <div className={`font-grotesk font-700 text-4xl leading-none mb-2 ${valueColor}`}>
        {format === 'currency'
          ? fmtBRL(animated)
          : fmtNum(animated)}
        {suffix && <span className="text-2xl ml-1">{suffix}</span>}
      </div>

      {sublabel && (
        <p className={`text-xs font-sans mb-2 ${labelColor}`}>{sublabel}</p>
      )}

      {delta !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-sans font-600 ${deltaColor}`}>
          <DeltaIcon size={12} />
          <span>
            {delta > 0 ? '+' : ''}
            {fmtNum(delta)} {deltaLabel ?? 'vs mês anterior'}
          </span>
        </div>
      )}
    </div>
  )
}
