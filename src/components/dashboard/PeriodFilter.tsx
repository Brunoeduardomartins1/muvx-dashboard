'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { PERIOD_PRESETS, type Period, type PeriodPreset } from '@/hooks/usePeriod'

interface Props {
  period: Period
  onSelectPreset: (preset: PeriodPreset) => void
  onSelectCustom: (from: string, to: string) => void
}

export function PeriodFilter({ period, onSelectPreset, onSelectCustom }: Props) {
  const [showCustom, setShowCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState(period.from)
  const [customTo, setCustomTo] = useState(period.to)

  function handlePreset(preset: PeriodPreset) {
    setShowCustom(false)
    onSelectPreset(preset)
  }

  function handleApplyCustom() {
    if (customFrom && customTo && customFrom <= customTo) {
      onSelectCustom(customFrom, customTo)
      setShowCustom(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      {PERIOD_PRESETS.map(p => (
        <button
          key={p.value}
          onClick={() => handlePreset(p.value)}
          className="px-3 py-1.5 rounded-lg text-xs font-sans font-600 border transition-all duration-150"
          style={{
            borderColor: period.preset === p.value && !showCustom ? '#08F887' : 'var(--border-color)',
            backgroundColor: period.preset === p.value && !showCustom ? 'rgba(8,248,135,0.08)' : 'transparent',
            color: period.preset === p.value && !showCustom ? '#08F887' : 'var(--text-secondary)',
          }}
        >
          {p.label}
        </button>
      ))}

      {/* Custom range button */}
      <button
        onClick={() => setShowCustom(v => !v)}
        className="px-3 py-1.5 rounded-lg text-xs font-sans font-600 border transition-all duration-150 flex items-center gap-1.5"
        style={{
          borderColor: showCustom || period.preset === 'custom' ? '#08F887' : 'var(--border-color)',
          backgroundColor: showCustom || period.preset === 'custom' ? 'rgba(8,248,135,0.08)' : 'transparent',
          color: showCustom || period.preset === 'custom' ? '#08F887' : 'var(--text-secondary)',
        }}
      >
        <Calendar size={11} />
        {period.preset === 'custom' && !showCustom
          ? `${period.from} → ${period.to}`
          : 'Personalizado'}
      </button>

      {/* Inline custom date inputs */}
      {showCustom && (
        <div className="flex items-center gap-2 rounded-xl border px-3 py-1.5" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <input
            type="date"
            value={customFrom}
            max={customTo}
            onChange={e => setCustomFrom(e.target.value)}
            className="text-xs font-sans border-0 bg-transparent outline-none"
            style={{ color: 'var(--text-primary)', colorScheme: 'dark' }}
          />
          <span className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>→</span>
          <input
            type="date"
            value={customTo}
            min={customFrom}
            onChange={e => setCustomTo(e.target.value)}
            className="text-xs font-sans border-0 bg-transparent outline-none"
            style={{ color: 'var(--text-primary)', colorScheme: 'dark' }}
          />
          <button
            onClick={handleApplyCustom}
            disabled={!customFrom || !customTo || customFrom > customTo}
            className="px-3 py-1 rounded-lg text-xs font-sans font-700 transition-all duration-150 disabled:opacity-40"
            style={{ backgroundColor: '#08F887', color: '#0A0C10' }}
          >
            Aplicar
          </button>
          <button
            onClick={() => setShowCustom(false)}
            className="text-xs font-sans"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
