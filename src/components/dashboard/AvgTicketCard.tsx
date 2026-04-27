'use client'

import { BarChart2, Laptop, MapPin } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { fmtBRL, fmtNum } from '@/lib/utils'

interface Props {
  avgTicket: number
  avgTicketDigital: number
  avgTicketPresential: number
  realizedSales: number
  digitalSales: number
  presentialSales: number
  onClick?: () => void
}

export function AvgTicketCard({
  avgTicket, avgTicketDigital, avgTicketPresential,
  realizedSales, digitalSales, presentialSales, onClick,
}: Props) {
  const animated = useCountUp(avgTicket, 800)

  return (
    <div
      className="card rounded-card p-5 sm:p-8"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="flex items-start justify-between mb-4 sm:mb-5 gap-2">
        <span
          className="text-[11px] sm:text-xs font-sans font-600 uppercase tracking-widest min-w-0"
          style={{ color: 'var(--text-muted)' }}
        >
          Ticket Médio
        </span>
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(8,248,135,0.1)', color: '#08F887' }}>
          <BarChart2 size={16} />
        </div>
      </div>

      <div className="font-grotesk font-700 text-3xl sm:text-4xl leading-none mb-1 break-words" style={{ color: 'var(--text-primary)' }}>
        {fmtBRL(animated)}
      </div>
      <p className="text-xs font-sans mb-4" style={{ color: 'var(--text-muted)' }}>
        {fmtNum(realizedSales)} vendas realizadas no período
      </p>

      <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Laptop size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-sans" style={{ color: 'var(--text-secondary)' }}>Digital</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-grotesk font-700" style={{ color: 'var(--text-primary)' }}>{fmtBRL(avgTicketDigital)}</span>
            <span className="text-xs font-sans ml-2" style={{ color: 'var(--text-muted)' }}>· {fmtNum(digitalSales)} vendas</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-sans" style={{ color: 'var(--text-secondary)' }}>Presencial</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-grotesk font-700" style={{ color: 'var(--text-primary)' }}>{fmtBRL(avgTicketPresential)}</span>
            <span className="text-xs font-sans ml-2" style={{ color: 'var(--text-muted)' }}>· {fmtNum(presentialSales)} vendas</span>
          </div>
        </div>
      </div>
    </div>
  )
}
