'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { fmtBRL, fmtPct } from '@/lib/utils'

interface Props {
  revenue: number
  goal: number
}

export default function GoalGaugeInner({ revenue, goal }: Props) {
  const pct = goal > 0 ? Math.min((revenue / goal) * 100, 100) : 0
  const data = [
    { value: pct },
    { value: 100 - pct },
  ]

  const color = pct >= 100 ? '#08F887' : pct >= 70 ? '#06D474' : pct >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="65%"
            innerRadius="55%"
            outerRadius="75%"
            startAngle={180}
            endAngle={0}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="#E5E7EB" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
        <span className="font-grotesk font-700 text-2xl leading-none" style={{ color }}>
          {fmtBRL(revenue)}
        </span>
        <span className="text-xs font-sans text-text-muted mt-1">
          {fmtPct(pct)} da meta ({fmtBRL(goal)})
        </span>
      </div>
    </div>
  )
}
