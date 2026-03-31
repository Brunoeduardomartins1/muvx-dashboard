'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

interface Props {
  label: string
  values: string[]           // all unique values for this column (display strings)
  selected: Set<string>      // currently selected values (raw)
  rawValues?: string[]       // parallel array of raw keys (if display ≠ raw)
  onChangeSelected: (s: Set<string>) => void
  minWidth?: number
  active?: boolean           // external override (e.g. always show as active)
}

export function ExcelFilter({ label, values, selected, rawValues, onChangeSelected, minWidth = 120 }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const isActive = selected.size > 0

  const filtered = values.filter(v => v.toLowerCase().includes(search.toLowerCase()))

  const toggle = useCallback((display: string, idx: number) => {
    const raw = rawValues ? rawValues[idx] : display
    const next = new Set(selected)
    if (next.has(raw)) next.delete(raw)
    else next.add(raw)
    onChangeSelected(next)
  }, [selected, rawValues, onChangeSelected])

  const selectAll = () => onChangeSelected(new Set())
  const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChangeSelected(new Set()) }

  return (
    <div ref={ref} className="relative" style={{ minWidth }}>
      {/* Header button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 w-full group"
        style={{ color: isActive ? '#08F887' : 'var(--text-muted)' }}
      >
        <span className="text-xs font-sans font-600 uppercase tracking-widest truncate flex-1 text-left">
          {label}
        </span>
        <span className="flex items-center gap-0.5 flex-shrink-0">
          {isActive && (
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-grotesk font-700 flex-shrink-0"
              style={{ backgroundColor: '#08F887', color: '#0A0C10' }}
              onClick={clear}
              title="Limpar filtro"
            >
              {selected.size}
            </span>
          )}
          <ChevronDown
            size={12}
            className="transition-transform duration-150"
            style={{ transform: open ? 'rotate(180deg)' : 'none', opacity: 0.6 }}
          />
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            minWidth: 180,
            maxWidth: 260,
          }}
        >
          {/* search */}
          <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-6 pr-2 py-1 text-xs font-sans rounded outline-none"
                style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* select all */}
          <button
            onClick={selectAll}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-sans text-left transition-colors"
            style={{
              color: selected.size === 0 ? '#08F887' : 'var(--text-secondary)',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: selected.size === 0 ? 'rgba(8,248,135,0.06)' : 'transparent',
            }}
          >
            <span
              className="w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center border"
              style={{ borderColor: selected.size === 0 ? '#08F887' : 'var(--border-color)', backgroundColor: selected.size === 0 ? '#08F887' : 'transparent' }}
            >
              {selected.size === 0 && <X size={9} style={{ color: '#0A0C10' }} />}
            </span>
            Selecionar todos
          </button>

          {/* options list */}
          <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs font-sans text-center" style={{ color: 'var(--text-muted)' }}>Sem resultados</p>
            ) : filtered.map((display, idx) => {
              const raw = rawValues ? rawValues[idx] : display
              const checked = selected.has(raw)
              return (
                <button
                  key={raw}
                  onClick={() => toggle(display, idx)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-sans text-left transition-colors"
                  style={{
                    color: checked ? '#08F887' : 'var(--text-secondary)',
                    backgroundColor: checked ? 'rgba(8,248,135,0.06)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = checked ? 'rgba(8,248,135,0.06)' : 'transparent' }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center border"
                    style={{ borderColor: checked ? '#08F887' : 'var(--border-color)', backgroundColor: checked ? '#08F887' : 'transparent' }}
                  >
                    {checked && <X size={9} style={{ color: '#0A0C10' }} />}
                  </span>
                  <span className="truncate">{display}</span>
                </button>
              )
            })}
          </div>

          {/* footer */}
          {selected.size > 0 && (
            <div className="px-3 py-2 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-color)' }}>
              <span className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>{selected.size} selecionado(s)</span>
              <button onClick={selectAll} className="text-xs font-sans" style={{ color: '#08F887' }}>Limpar</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
