'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { STATUS_LABELS, STATUS_COLORS, fmtNum } from '@/lib/utils'

interface Props {
  purchasesByStatus: Record<string, number>
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const status = String(label)
    return (
      <div className="bg-dark-card border border-[#2a2a2d] rounded-xl px-4 py-3 shadow-green-sm">
        <p className="text-xs font-sans text-[#83898F] uppercase tracking-widest mb-1">
          {STATUS_LABELS[status] ?? status}
        </p>
        <p className="font-grotesk font-700 text-green text-xl">
          {fmtNum(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export default function BarChartInner({ purchasesByStatus }: Props) {
  const data = Object.entries(purchasesByStatus)
    .map(([status, count]) => ({
      status,
      label: STATUS_LABELS[status] ?? status,
      count,
      color: STATUS_COLORS[status] ?? '#9CA3AF',
    }))
    .sort((a, b) => b.count - a.count)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm font-sans">
        Sem dados no período
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fontFamily: 'var(--font-dm-sans)', fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fontSize: 10, fontFamily: 'var(--font-dm-sans)', fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(8, 248, 135, 0.06)' }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
