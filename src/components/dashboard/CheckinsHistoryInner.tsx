'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { CheckinDailyHistory } from '@/lib/types'
import { fmtNum } from '@/lib/utils'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: CheckinDailyHistory }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const dateStr = label ?? ''
    const parts = dateStr.split('-')
    const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr
    return (
      <div style={{ background: '#18181B', border: '1px solid #2A2D35', borderRadius: 12, padding: '10px 16px' }}>
        <p style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{formatted}</p>
        <p style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#08F887', fontSize: 20 }}>{fmtNum(payload[0].value)}</p>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>check-ins</p>
      </div>
    )
  }
  return null
}

function formatXAxis(dateStr: string, totalPoints: number): string {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  if (totalPoints <= 14) return `${parts[2]}/${parts[1]}`
  // For longer periods, show only day/month on every ~7th tick
  return `${parts[2]}/${parts[1]}`
}

export default function CheckinsHistoryInner({ data }: { data: CheckinDailyHistory[] }) {
  const tickInterval = data.length > 30 ? Math.floor(data.length / 8) : data.length > 14 ? 3 : 1

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
        <defs>
          <linearGradient id="checkinGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#08F887" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#08F887" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          interval={tickInterval - 1}
          tickFormatter={(v) => formatXAxis(v, data.length)}
        />
        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(8,248,135,0.3)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#08F887"
          strokeWidth={2}
          fill="url(#checkinGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#08F887', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
