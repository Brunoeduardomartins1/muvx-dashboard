'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { fmtPct } from '@/lib/utils'

interface Props {
  rate: number
}

export default function ConversionRingInner({ rate }: Props) {
  const clamped = Math.min(Math.max(rate, 0), 100)
  const data = [{ value: clamped }, { value: 100 - clamped }]

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius="62%" outerRadius="80%"
            startAngle={90} endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill="#08F887" />
            <Cell fill="var(--border-color)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-grotesk font-700 text-4xl leading-none" style={{ color: 'var(--text-primary)' }}>
          {fmtPct(clamped)}
        </span>
        <span className="text-xs font-sans mt-1 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Conversão
        </span>
      </div>
    </div>
  )
}
