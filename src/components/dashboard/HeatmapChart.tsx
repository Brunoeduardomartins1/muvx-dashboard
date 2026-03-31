'use client'

import type { DailyHeatmapPoint } from '@/lib/types'
import { fmtBRL } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  data: DailyHeatmapPoint[]
  isLoading?: boolean
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getColor(count: number, max: number): string {
  if (count === 0 || max === 0) return 'var(--border-color)'
  const t = count / max
  if (t < 0.2) return 'rgba(8,248,135,0.15)'
  if (t < 0.4) return 'rgba(8,248,135,0.30)'
  if (t < 0.6) return 'rgba(8,248,135,0.50)'
  if (t < 0.8) return 'rgba(8,248,135,0.70)'
  return '#08F887'
}

export function HeatmapChart({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card rounded-card p-8">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-3 w-40 mb-6" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="card rounded-card p-8">
        <h3 className="font-grotesk font-700 text-base mb-1" style={{ color: 'var(--text-primary)' }}>Mapa de Calor</h3>
        <p className="text-xs font-sans mb-4" style={{ color: 'var(--text-muted)' }}>Volume de vendas por dia</p>
        <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Sem dados no período.</p>
      </div>
    )
  }

  const maxCount = Math.max(...data.map(d => d.count), 1)
  const byDate: Record<string, DailyHeatmapPoint> = {}
  for (const d of data) byDate[d.date] = d

  const startDate = new Date(data[0].date)
  const endDate   = new Date(data[data.length - 1].date)

  const start = new Date(startDate)
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(endDate)
  end.setDate(end.getDate() + (6 - end.getDay()))

  const days: Date[] = []
  const cur = new Date(start)
  while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const monthLabels: { weekIdx: number; label: string }[] = []
  weeks.forEach((week, wi) => {
    const label = MONTH_NAMES[week[0].getMonth()]
    if (monthLabels.length === 0 || monthLabels[monthLabels.length - 1].label !== label) {
      monthLabels.push({ weekIdx: wi, label })
    }
  })

  const cellSize = 13
  const cellGap  = 3
  const step     = cellSize + cellGap

  return (
    <div className="card rounded-card p-8">
      <div className="mb-5">
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>Mapa de Calor</h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>Volume de vendas por dia</p>
      </div>

      <div className="overflow-x-auto">
        <div style={{ display: 'inline-block', minWidth: weeks.length * step + 24 }}>
          {/* Month labels */}
          <div style={{ display: 'flex', marginLeft: 20, marginBottom: 4 }}>
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.weekIdx === wi)
              return (
                <div key={wi} style={{ width: step, flexShrink: 0 }}>
                  {ml && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans)' }}>{ml.label}</span>}
                </div>
              )
            })}
          </div>

          {/* Grid */}
          <div style={{ display: 'flex' }}>
            {/* Weekday labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: cellGap, marginRight: 4 }}>
              {WEEKDAY_LABELS.map((l, i) => (
                <div key={i} style={{ width: 12, height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans)' }}>{i % 2 === 1 ? l : ''}</span>
                </div>
              ))}
            </div>

            {/* Weeks columns */}
            <div style={{ display: 'flex', gap: cellGap }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: cellGap }}>
                  {week.map((day, di) => {
                    const iso = day.toISOString().split('T')[0]
                    const pt  = byDate[iso]
                    const inRange = day >= startDate && day <= endDate
                    return (
                      <div
                        key={di}
                        title={inRange && pt ? `${iso}: ${pt.count} vendas · ${fmtBRL(pt.revenue)}` : iso}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          borderRadius: 3,
                          backgroundColor: inRange && pt ? getColor(pt.count, maxCount) : 'var(--border-color)',
                          opacity: inRange ? 1 : 0.25,
                          cursor: inRange && pt?.count ? 'pointer' : 'default',
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, marginLeft: 16 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Menos</span>
            {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
              <div key={i} style={{ width: cellSize, height: cellSize, borderRadius: 3, backgroundColor: getColor(Math.round(v * maxCount), maxCount) }} />
            ))}
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Mais</span>
          </div>
        </div>
      </div>
    </div>
  )
}
