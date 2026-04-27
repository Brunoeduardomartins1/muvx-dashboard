'use client'

import { useCountUp } from '@/hooks/useCountUp'
import { fmtBRL } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  muvxRevenueNet: number          // receita líquida total do período (após taxas)
  muvxRevenuePaid: number         // já disponível
  muvxRevenueWaiting: number      // aguardando liberação
  muvxBalanceAvailable: number    // saldo disponível na conta Pagar.me
  muvxBalanceWaitingFunds: number // saldo aguardando
  muvxBalanceTransferred: number  // histórico transferido
  muvxShareObserved: number
  revenueInPeriod: number
  scheduledRevenue: number
  pagarmeAvailable: boolean
  isLoading?: boolean
}

export function MuvxRevenueCard({
  muvxRevenueNet,
  muvxRevenuePaid,
  muvxRevenueWaiting,
  muvxBalanceAvailable,
  muvxBalanceWaitingFunds,
  muvxShareObserved,
  revenueInPeriod,
  scheduledRevenue,
  pagarmeAvailable,
  isLoading,
}: Props) {
  const animatedNet = useCountUp(muvxRevenueNet, 900)
  const animatedPaid = useCountUp(muvxRevenuePaid, 900)
  const animatedWaiting = useCountUp(muvxRevenueWaiting, 900)
  const animatedBalance = useCountUp(muvxBalanceAvailable + muvxBalanceWaitingFunds, 900)
  const animatedVolume = useCountUp(revenueInPeriod + scheduledRevenue, 900)

  if (isLoading) {
    return (
      <div className="rounded-card p-10 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', minHeight: 200 }}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-64" />
        <div className="flex gap-8">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    )
  }

  const paidPct = muvxRevenueNet > 0 ? (muvxRevenuePaid / muvxRevenueNet) * 100 : 0

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
      <div style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(8,248,135,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <p className="text-xs font-sans font-600 uppercase tracking-widest mb-3" style={{ color: 'rgba(8,248,135,0.6)' }}>
        Receita líquida MUVX no período
      </p>

      <div className="font-grotesk font-700 leading-none mb-1" style={{ color: '#08F887', fontSize: 52 }}>
        {fmtBRL(animatedNet)}
      </div>

      <p className="text-xs font-sans mt-1 mb-6" style={{ color: 'rgba(8,248,135,0.45)' }}>
        {pagarmeAvailable
          ? `Soma dos recebíveis líquidos do período. Share efetivo: ${(muvxShareObserved * 100).toFixed(2)}% sobre o volume transacionado.`
          : 'Dados Pagar.me indisponíveis.'}
      </p>

      <div style={{ width: '100%', maxWidth: 420, marginBottom: 24 }}>
        <div style={{
          height: 8,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 100,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, paidPct)}%`,
            background: 'linear-gradient(90deg, #08F887 0%, #06D474 100%)',
            borderRadius: 100,
            boxShadow: '0 0 12px rgba(8,248,135,.4)',
          }} />
        </div>
        <div className="flex justify-between mt-2 text-xs font-sans" style={{ color: 'rgba(255,255,255,.5)' }}>
          <span>{paidPct.toFixed(1)}% já disponível</span>
          <span>{(100 - paidPct).toFixed(1)}% aguardando liberação</span>
        </div>
      </div>

      <div className="flex items-center gap-10 flex-wrap justify-center">
        <div className="text-center">
          <p className="font-grotesk font-700 text-lg leading-none" style={{ color: '#F9FAFB' }}>
            {fmtBRL(animatedPaid)}
          </p>
          <p className="text-xs font-sans mt-1" style={{ color: '#6B7280' }}>
            Já disponível
          </p>
        </div>

        <div className="w-px h-8" style={{ backgroundColor: 'rgba(8,248,135,0.15)' }} />

        <div className="text-center">
          <p className="font-grotesk font-700 text-lg leading-none" style={{ color: 'rgba(8,248,135,0.85)' }}>
            {fmtBRL(animatedWaiting)}
          </p>
          <p className="text-xs font-sans mt-1" style={{ color: '#6B7280' }}>
            Aguardando liberação
          </p>
        </div>

        <div className="w-px h-8" style={{ backgroundColor: 'rgba(8,248,135,0.15)' }} />

        <div className="text-center">
          <p className="font-grotesk font-700 text-lg leading-none" style={{ color: '#F9FAFB' }}>
            {fmtBRL(animatedBalance)}
          </p>
          <p className="text-xs font-sans mt-1" style={{ color: '#6B7280' }}>
            Saldo total atual
          </p>
        </div>

        <div className="w-px h-8" style={{ backgroundColor: 'rgba(8,248,135,0.15)' }} />

        <div className="text-center">
          <p className="font-grotesk font-700 text-lg leading-none" style={{ color: '#F9FAFB' }}>
            {fmtBRL(animatedVolume)}
          </p>
          <p className="text-xs font-sans mt-1" style={{ color: '#6B7280' }}>
            Volume transacionado
          </p>
        </div>
      </div>
    </div>
  )
}
