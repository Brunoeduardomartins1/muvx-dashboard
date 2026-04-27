'use client'

import Image from 'next/image'
import { RefreshCw, Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fmtAgo } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'

interface HeaderProps {
  lastUpdated: string | null
  isLoading: boolean
  onRefresh: () => void
}

export function Header({ lastUpdated, isLoading, onRefresh }: HeaderProps) {
  const [timeAgo, setTimeAgo] = useState<string>('—')
  const { isDark, toggle } = useTheme()

  useEffect(() => {
    const update = () => setTimeAgo(fmtAgo(lastUpdated))
    update()
    const interval = setInterval(update, 30_000)
    return () => clearInterval(interval)
  }, [lastUpdated])

  return (
    <header
      className="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6 border-b transition-colors duration-250"
      style={{
        backgroundColor: 'var(--bg-header)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Logo: light = secundária (escura), dark = primária (clara) */}
        <div className="relative h-7 sm:h-8 w-auto flex-shrink-0">
          <Image
            src={isDark ? '/logo-dark.png' : '/logo-light.png'}
            alt="MUVX"
            height={32}
            width={120}
            className="h-7 sm:h-8 w-auto object-contain"
            priority
          />
        </div>

        <div className="w-px h-5 hidden sm:block" style={{ backgroundColor: 'var(--border-color)' }} />

        <div className="min-w-0">
          <h1 className="font-grotesk font-700 text-sm sm:text-base leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
            Dashboard Analítico
          </h1>
          <p className="text-[10px] sm:text-xs font-sans uppercase tracking-widest hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            Métricas em Tempo Real
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="text-xs font-sans hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            Atualizado {timeAgo}
          </span>
        )}

        {/* Toggle dark/light */}
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 hover:border-green/40"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          aria-label="Alternar tema"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-sans font-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-green/40 hover:text-green"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>
    </header>
  )
}
