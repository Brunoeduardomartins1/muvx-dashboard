'use client'

import { useState, useCallback } from 'react'

export type PeriodPreset = 'today' | '7d' | 'mtd' | 'last_month' | '90d' | 'ytd' | 'custom'

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
    case 'mtd': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { preset, from: toISO(from), to: today, label: 'Este mês' }
    }
    case 'last_month': {
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      return { preset, from: toISO(firstOfLastMonth), to: toISO(lastOfLastMonth), label: 'Mês passado' }
    }
    case '90d': {
      const from = new Date(now)
      from.setDate(from.getDate() - 89)
      return { preset, from: toISO(from), to: today, label: 'Últimos 90 dias' }
    }
    case 'ytd': {
      const from = new Date(now.getFullYear(), 0, 1)
      return { preset, from: toISO(from), to: today, label: 'Este ano' }
    }
    case 'custom': {
      const from = customFrom ?? today
      const to = customTo ?? today
      return { preset, from, to, label: `${from} → ${to}` }
    }
  }
}

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'today',      label: 'Hoje' },
  { value: '7d',         label: '7 dias' },
  { value: 'mtd',        label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: '90d',        label: '90 dias' },
  { value: 'ytd',        label: 'Este ano' },
]

export function usePeriod() {
  const [period, setPeriod] = useState<Period>(() => buildPeriod('mtd'))

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
