'use client'

import { useState, useCallback } from 'react'

export type PeriodPreset = 'today' | '7d' | '15d' | 'mtd' | 'ytd' | 'all' | 'custom'

export interface Period {
  preset: PeriodPreset
  from: string   // YYYY-MM-DD
  to: string     // YYYY-MM-DD
  label: string
}

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function buildPeriod(preset: PeriodPreset, customFrom?: string, customTo?: string): Period {
  const now = new Date()
  const today = toISO(now)

  switch (preset) {
    case 'today': {
      return { preset, from: today, to: today, label: 'Hoje' }
    }
    case '7d': {
      const from = new Date(now)
      from.setDate(from.getDate() - 6)
      return { preset, from: toISO(from), to: today, label: 'Últimos 7 dias' }
    }
    case '15d': {
      const from = new Date(now)
      from.setDate(from.getDate() - 14)
      return { preset, from: toISO(from), to: today, label: 'Últimos 15 dias' }
    }
    case 'mtd': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { preset, from: toISO(from), to: today, label: 'Este mês' }
    }
    case 'ytd': {
      const from = new Date(now.getFullYear(), 0, 1)
      return { preset, from: toISO(from), to: today, label: 'Este ano' }
    }
    case 'all': {
      return { preset, from: '2025-01-01', to: today, label: 'Tudo' }
    }
    case 'custom': {
      const from = customFrom ?? today
      const to = customTo ?? today
      return { preset, from, to, label: `${from} → ${to}` }
    }
  }
}

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d',    label: '7 dias' },
  { value: '15d',   label: '15 dias' },
  { value: 'mtd',   label: 'Este mês' },
  { value: 'ytd',   label: 'Este ano' },
  { value: 'all',   label: 'Tudo' },
]

export function usePeriod() {
  const [period, setPeriod] = useState<Period>(() => buildPeriod('all'))

  const selectPreset = useCallback((preset: PeriodPreset) => {
    if (preset !== 'custom') {
      setPeriod(buildPeriod(preset))
    }
  }, [])

  const selectCustom = useCallback((from: string, to: string) => {
    setPeriod(buildPeriod('custom', from, to))
  }, [])

  return { period, selectPreset, selectCustom }
}
