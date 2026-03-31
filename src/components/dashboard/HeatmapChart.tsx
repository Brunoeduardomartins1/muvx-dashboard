'use client'

import { useRef, useEffect, useState } from 'react'
import type { DailyHeatmapPoint } from '@/lib/types'
import { fmtBRL } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  data: DailyHeatmapPoint[]
  isLoading?: boolean
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const LABEL_W = 14
const CELL_GAP = 3
const MIN_CELL = 10
const MAX_CELL = 18

function getColor(count: number, max: number): string {
  if (count === 0 || max === 0) return 'var(--border-color)'
  const t = count / max
  if (t < 0.2) return 'rgba(8,248,135,0.15)'
  if (t < 0.4) return 'rgba(8,248,135,0.30)'
  if (t < 0.6) return 'rgba(8,248,135,0.50)'
  if (t < 0.8) return 'rgba(8,248,135,0.70)'
  return '#08F887'
}

function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function HeatmapChart({ data, isLoading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(14)

  // Build week grid once so we know the week count for sizing
  const weeks: Date[][] = []
  if (data.length > 0) {
    const startDate = parseLocal(data[0].date)
    const endDate   = parseLocal(data[data.length - 1].date)
    const start = new Date(startDate); start.setDate(start.getDate() - start.getDay())
    const end   = new Date(endDate);   end.setDate(end.getDate() + (6 - end.getDay()))
    const cur = new Date(start)
    const days: Date[] = []
    while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  }

  useEffect(() => {
    if (!containerRef.current || weeks.length === 0) return
    const calc = () => {
      const w = containerRef.current!.clientWidth
      // available width = total - label column - gaps between weeks
      const available = w - LABEL_W - 4 - (weeks.length - 1) * CELL_GAP
      const raw = Math.floor(available / weeks.length)
      setCellSize(Math.min(MAX_CELL, Math.max(MIN_CELL, raw)))
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [weeks.length])

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

  const maxCount  = Math.max(...data.map(d => d.count), 1)
  const byDate: Record<string, DailyHeatmapPoint> = {}
  for (const d of data) byDate[d.date] = d

  const startDate = parseLocal(data[0].date)
  const endDate   = parseLocal(data[data.length - 1].date)

  // Month labels
  const monthLabels: { weekIdx: number; label: string }[] = []
  weeks.forEach((week, wi) => {
    const label = MONTH_NAMES[week[0].getMonth()]
    if (monthLabels.length === 0 || monthLabels[monthLabels.length - 1].label !== label) {
      monthLabels.push({ weekIdx: wi, label })
    }
  })

  const step = cellSize + CELL_GAP

  return (
    <div className="card rounded-card p-8">
      <div className="mb-5">
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>Mapa de Calor</h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>Volume de vendas por dia</p>
      </div>

      <div ref={containerRef} style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* Month labels */}
          <div style={{ display: 'flex', marginLeft: LABEL_W + 4, marginBottom: 5 }}>
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.weekIdx === wi)
              return (
                <div key={wi} style={{ width: step, flexShrink: 0 }}>
                  {ml && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ml.label}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Labels + grid */}
          <div style={{ display: 'flex', gap: 4 }}>
            {/* Weekday labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP, width: LABEL_W, flexShrink: 0 }}>
              {WEEKDAY_LABELS.map((l, i) => (
                <div key={i} style={{ height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {(i === 1 || i === 3 || i === 5) && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1 }}>{l}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Week columns — fill available width */}
            <div style={{ display: 'flex', gap: CELL_GAP, flex: 1 }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP, flex: 1 }}>
                  {week.map((day, di) => {
                    const iso     = localISO(day)
                    const pt      = byDate[iso]
                    const inRange = day >= startDate && day <= endDate
                    const bg      = inRange && pt && pt.count > 0
                      ? getColor(pt.count, maxCount)
                      : 'var(--border-color)'
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
                          height: cellSize,
                          borderRadius: 3,
                          backgroundColor: bg,
                          opacity: inRange ? 1 : 0.18,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, marginLeft: LABEL_W + 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 2 }}>Menos</span>
            {[0, 0.2, 0.45, 0.7, 1].map((v, i) => (
              <div key={i} style={{ width: cellSize, height: cellSize, borderRadius: 3, backgroundColor: v === 0 ? 'var(--border-color)' : getColor(Math.round(v * maxCount), maxCount) }} />
            ))}
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>Mais</span>
          </div>
        </div>
      </div>
    </div>
  )
}
