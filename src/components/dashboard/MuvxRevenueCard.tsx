'use client'

import { useCountUp } from '@/hooks/useCountUp'
import { fmtBRL, fmtNum } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  muvxRevenue: number
  revenueInPeriod: number
  completedSales: number
  isLoading?: boolean
}

export function MuvxRevenueCard({ muvxRevenue, revenueInPeriod, completedSales, isLoading }: Props) {
  const animatedRevenue = useCountUp(muvxRevenue, 900)
  const animatedGross = useCountUp(revenueInPeriod, 900)

  if (isLoading) {
    return (
      <div className="rounded-card p-10 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', minHeight: 200 }}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-64" />
        <div className="flex gap-8">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    )
  }

  const feeFixed = completedSales * 3.99
  const feePct = revenueInPeriod * 0.02

  return (
    <div
      className="rounded-card p-10 flex flex-col items-center justify-center text-center"
      style={{
        background: 'linear-gradient(135deg, #0f1a14 0%, #0A0C10 60%, #0d1a10 100%)',
        border: '1px solid rgba(8,248,135,0.2)',
        minHeight: 200,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow decorativo */}
      <div style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(8,248,135,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <p className="text-xs font-sans font-600 uppercase tracking-widest mb-3" style={{ color: 'rgba(8,248,135,0.6)' }}>
        Faturamento MUVX
      </p>

      <div className="font-grotesk font-700 leading-none mb-1" style={{ color: '#08F887', fontSize: 52 }}>
        {fmtBRL(animatedRevenue)}
      </div>

      <p className="text-xs font-sans mt-1 mb-6" style={{ color: 'rgba(8,248,135,0.45)' }}>
        2% por transação + R$3,99 por venda concluída
      </p>

      <div className="flex items-center gap-10">
        <div className="text-center">
          <p className="font-grotesk font-700 text-lg leading-none" style={{ color: '#F9FAFB' }}>
            {fmtBRL(animatedGross)}
          </p>
          <p className="text-xs font-sans mt-1" style={{ color: '#6B7280' }}>
            Receita bruta (vendas concluídas)
          </p>
        </div>

        <div className="w-px h-8" style={{ backgroundColor: 'rgba(8,248,135,0.15)' }} />

        <div className="text-center">
          <p className="font-grotesk font-700 text-lg leading-none" style={{ color: '#F9FAFB' }}>
            {fmtBRL(feePct)}
          </p>
          <p className="text-xs font-sans mt-1" style={{ color: '#6B7280' }}>
            Taxa 2%
          </p>
        </div>

        <div className="w-px h-8" style={{ backgroundColor: 'rgba(8,248,135,0.15)' }} />

        <div className="text-center">
          <p className="font-grotesk font-700 text-lg leading-none" style={{ color: '#F9FAFB' }}>
            {fmtBRL(feeFixed)}
          </p>
          <p className="text-xs font-sans mt-1" style={{ color: '#6B7280' }}>
            {fmtNum(completedSales)} × R$3,99
          </p>
        </div>
      </div>
    </div>
  )
}
