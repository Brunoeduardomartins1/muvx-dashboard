'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { CheckinDayOfWeek } from '@/lib/types'
import { fmtNum } from '@/lib/utils'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: CheckinDayOfWeek }>
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div style={{ background: '#18181B', border: '1px solid #2A2D35', borderRadius: 12, padding: '10px 16px' }}>
        <p style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{d.dayName}</p>
        <p style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#08F887', fontSize: 20 }}>{fmtNum(d.count)}</p>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{fmtNum(d.percentage)}% do total</p>
      </div>
    )
  }
  return null
}

export default function CheckinsDayChartInner({ data }: { data: CheckinDayOfWeek[] }) {
  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis dataKey="dayName" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(8,248,135,0.06)' }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((entry, i) => (
            <Cell key={i} fill="#08F887" fillOpacity={entry.count === max ? 0.9 : 0.35} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
