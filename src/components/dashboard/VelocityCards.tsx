'use client'

import { TrendingUp, Zap, Target } from 'lucide-react'
import { fmtBRL, fmtNum } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  ltv: number
  salesVelocity: number
  projectedMonthRevenue: number
  periodStudents: number
  isLoading?: boolean
}

function MiniCard({ label, sublabel, value, icon, color = '#08F887' }: {
  label: string
  sublabel: string
  value: string
  icon: React.ReactNode
  color?: string
}) {
  return (
    <div
      className="card rounded-card p-6 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-sans font-600 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18`, color }}>
          {icon}
        </span>
      </div>
      <p className="font-grotesk font-700 text-2xl" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>{sublabel}</p>
    </div>
  )
}

export function VelocityCards({ ltv, salesVelocity, projectedMonthRevenue, periodStudents, isLoading }: Props) {
  if (isLoading) {
    return (
      <>
        {[1, 2, 3].map(i => (
          <div key={i} className="card rounded-card p-6 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </>
    )
  }

  return (
    <>
      <MiniCard
        label="LTV médio"
        sublabel={`Receita ÷ ${fmtNum(periodStudents)} alunos únicos no período`}
        value={fmtBRL(ltv)}
        icon={<TrendingUp size={14} />}
      />
      <MiniCard
        label="Velocidade de Vendas"
        sublabel="Vendas concluídas por dia no período"
        value={`${salesVelocity.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} / dia`}
        icon={<Zap size={14} />}
        color="#06B6D4"
      />
      <MiniCard
        label="Projeção de Transação no Mês"
        sublabel="Já realizado + agendado para ser pago"
        value={fmtBRL(projectedMonthRevenue)}
        icon={<Target size={14} />}
        color="#F59E0B"
      />
    </>
  )
}
