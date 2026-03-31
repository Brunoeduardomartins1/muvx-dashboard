'use client'

import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fmtAgo } from '@/lib/utils'

interface HeaderProps {
  lastUpdated: string | null
  isLoading: boolean
  onRefresh: () => void
}

export function MuvxLogo() {
  return (
    <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
      <text
        x="0"
        y="22"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="700"
        fontSize="24"
        fill="#111827"
        letterSpacing="-0.5"
      >
        MUV
      </text>
      <text
        x="54"
        y="22"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="700"
        fontSize="24"
        fill="#08F887"
        letterSpacing="-0.5"
      >
        X
      </text>
      {/* Traço diagonal característico do X */}
      <line x1="54" y1="20" x2="76" y2="4" stroke="#08F887" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

export function Header({ lastUpdated, isLoading, onRefresh }: HeaderProps) {
  const [timeAgo, setTimeAgo] = useState<string>('—')

  useEffect(() => {
    const update = () => setTimeAgo(fmtAgo(lastUpdated))
    update()
    const interval = setInterval(update, 30_000)
    return () => clearInterval(interval)
  }, [lastUpdated])

  return (
    <header className="flex items-center justify-between py-6 px-8 bg-surface border-b border-border">
      <div className="flex items-center gap-4">
        <MuvxLogo />
        <div className="w-px h-6 bg-border" />
        <div>
          <h1 className="font-grotesk font-700 text-lg text-text leading-tight">
            Dashboard Analítico
          </h1>
          <p className="text-xs font-sans text-text-muted uppercase tracking-widest">
            Métricas em Tempo Real
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="text-xs font-sans text-text-muted">
            Atualizado {timeAgo}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-sans font-600 text-text-secondary hover:border-green/40 hover:text-green transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            size={14}
            className={isLoading ? 'animate-spin' : ''}
          />
          Atualizar
        </button>
      </div>
    </header>
  )
}
