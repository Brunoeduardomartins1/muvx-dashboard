'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { fmtNum } from '@/lib/utils'

const COLORS: Record<string, string> = {
  PIX: '#08F887',
  CREDIT_CARD: '#06B6D4',
  BOLETO: '#F59E0B',
  DEBIT_CARD: '#8B5CF6',
  FREE: '#9CA3AF',
  UNKNOWN: '#4B5563',
}

const LABELS: Record<string, string> = {
  PIX: 'Pix',
  CREDIT_CARD: 'Cartão',
  BOLETO: 'Boleto',
  DEBIT_CARD: 'Débito',
  FREE: 'Gratuito',
  UNKNOWN: 'Outros',
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#18181B', border: '1px solid #2A2D35', borderRadius: 12, padding: '10px 16px' }}>
        <p style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          {LABELS[payload[0].name] ?? payload[0].name}
        </p>
        <p style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#08F887', fontSize: 20 }}>
          {fmtNum(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export default function PaymentMethodChartInner({ breakdown }: { breakdown: Record<string, number> }) {
  const data = Object.entries(breakdown)
    .map(([key, value]) => ({ name: key, value }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) return (
    <div className="flex items-center justify-center h-full text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
      Sem dados no período
    </div>
  )

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col h-full">
      <div style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius="45%" outerRadius="70%" dataKey="value" strokeWidth={0}>
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.name] ?? '#6B7280'} fillOpacity={0.9} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[d.name] ?? '#6B7280' }} />
            <span className="text-xs font-sans" style={{ color: 'var(--text-secondary)' }}>{LABELS[d.name] ?? d.name}</span>
            <span className="text-xs font-grotesk font-600" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
            <span className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
