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

// Format date as YYYY-MM-DD using LOCAL timezone (avoids UTC shift)
function localISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Parse YYYY-MM-DD as local date (avoids UTC shift when constructing from string)
function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
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

  // Use local dates to avoid UTC timezone shift
  const startDate = parseLocal(data[0].date)
  const endDate   = parseLocal(data[data.length - 1].date)

  // Pad to full weeks (Sun → Sat)
  const start = new Date(startDate)
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(endDate)
  end.setDate(end.getDate() + (6 - end.getDay()))

  // Generate every day in range
  const days: Date[] = []
  const cur = new Date(start)
  while (cur <= end) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }

  // Group into columns of 7 (one column = one week, top=Sun, bottom=Sat)
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  // Month labels: one per month change
  const monthLabels: { weekIdx: number; label: string }[] = []
  weeks.forEach((week, wi) => {
    const label = MONTH_NAMES[week[0].getMonth()]
    if (monthLabels.length === 0 || monthLabels[monthLabels.length - 1].label !== label) {
      monthLabels.push({ weekIdx: wi, label })
    }
  })

  const cellSize = 14
  const cellGap  = 3
  const step     = cellSize + cellGap
  const labelW   = 14  // weekday label column width

  return (
    <div className="card rounded-card p-8">
      <div className="mb-5">
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>Mapa de Calor</h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>Volume de vendas por dia</p>
      </div>

      <div className="overflow-x-auto">
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 0 }}>

          {/* Month labels row — aligned with week columns */}
          <div style={{ display: 'flex', marginLeft: labelW + 4, marginBottom: 5 }}>
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.weekIdx === wi)
              return (
                <div key={wi} style={{ width: step, flexShrink: 0 }}>
                  {ml && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-dm-sans)' }}>
                      {ml.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Weekday labels + week grid side by side */}
          <div style={{ display: 'flex', gap: 4 }}>

            {/* Weekday labels column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: cellGap, width: labelW, flexShrink: 0 }}>
              {WEEKDAY_LABELS.map((l, i) => (
                <div
                  key={i}
                  style={{
                    height: cellSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  {/* show every other label: Mon, Wed, Fri */}
                  {(i === 1 || i === 3 || i === 5) && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1 }}>{l}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Week columns */}
            <div style={{ display: 'flex', gap: cellGap }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: cellGap }}>
                  {week.map((day, di) => {
                    const iso    = localISO(day)
                    const pt     = byDate[iso]
                    const inRange = day >= startDate && day <= endDate
                    const bg     = inRange && pt && pt.count > 0
                      ? getColor(pt.count, maxCount)
                      : inRange ? 'var(--border-color)' : 'var(--border-color)'
                    const opacity = inRange ? 1 : 0.18
                    const tip = inRange
                      ? pt && pt.count > 0
                        ? `${iso}: ${pt.count} venda${pt.count > 1 ? 's' : ''} · ${fmtBRL(pt.revenue)}`
                        : `${iso}: sem vendas`
                      : iso
                    return (
                      <div
                        key={di}
                        title={tip}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          borderRadius: 3,
                          backgroundColor: bg,
                          opacity,
                          cursor: inRange && pt?.count ? 'pointer' : 'default',
                          flexShrink: 0,
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, marginLeft: labelW + 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 2 }}>Menos</span>
            {[0, 0.2, 0.45, 0.7, 1].map((v, i) => (
              <div
                key={i}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 3,
                  backgroundColor: v === 0 ? 'var(--border-color)' : getColor(Math.round(v * maxCount), maxCount),
                }}
              />
            ))}
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>Mais</span>
          </div>
        </div>
      </div>
    </div>
  )
}
