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
  onClick?: () => void
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  dark = false,
  format = 'number',
  icon,
  sublabel,
  onClick,
}: StatCardProps) {
  const animated = useCountUp(value, 800)

  const deltaPositive = delta !== undefined && delta > 0
  const deltaNegative = delta !== undefined && delta < 0
  const deltaColor = deltaPositive ? '#08F887' : deltaNegative ? '#EF4444' : 'var(--text-muted)'
  const DeltaIcon = deltaPositive ? TrendingUp : deltaNegative ? TrendingDown : Minus

  if (dark) {
    return (
      <div
        className="card-dark rounded-card p-8"
        onClick={onClick}
        style={onClick ? { cursor: 'pointer' } : undefined}
      >
        <div className="flex items-start justify-between mb-5">
          <span
            className="text-xs font-sans font-600 uppercase tracking-widest"
            style={{ color: '#6B7280' }}
          >
            {label}
          </span>
          {icon && (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(8,248,135,0.1)', color: '#08F887' }}>
              {icon}
            </div>
          )}
        </div>

        <div className="font-grotesk font-700 text-4xl leading-none mb-2" style={{ color: '#08F887' }}>
          {format === 'currency' ? fmtBRL(animated) : fmtNum(animated)}
        </div>

        {sublabel && (
          <p className="text-xs font-sans mb-2" style={{ color: '#6B7280' }}>{sublabel}</p>
        )}

        {delta !== undefined && (
          <div className="flex items-center gap-1 text-xs font-sans font-600" style={{ color: deltaColor }}>
            <DeltaIcon size={12} />
            <span>{delta > 0 ? '+' : ''}{fmtNum(delta)} {deltaLabel ?? 'vs mês anterior'}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="card rounded-card p-8"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="flex items-start justify-between mb-5">
        <span
          className="text-xs font-sans font-600 uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(8,248,135,0.1)', color: '#08F887' }}>
            {icon}
          </div>
        )}
      </div>

      <div className="font-grotesk font-700 text-4xl leading-none mb-2" style={{ color: 'var(--text-primary)' }}>
        {format === 'currency' ? fmtBRL(animated) : fmtNum(animated)}
      </div>

      {sublabel && (
        <p className="text-xs font-sans mb-2" style={{ color: 'var(--text-muted)' }}>{sublabel}</p>
      )}

      {delta !== undefined && (
        <div className="flex items-center gap-1 text-xs font-sans font-600" style={{ color: deltaColor }}>
          <DeltaIcon size={12} />
          <span>{delta > 0 ? '+' : ''}{fmtNum(delta)} {deltaLabel ?? 'vs mês anterior'}</span>
        </div>
      )}
    </div>
  )
}
