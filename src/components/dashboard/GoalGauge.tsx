'use client'

import dynamic from 'next/dynamic'
import { RingSkeleton } from '@/components/ui/Skeleton'

const GoalGaugeInner = dynamic(() => import('./GoalGaugeInner'), {
  ssr: false,
  loading: () => <RingSkeleton />,
})

interface Props {
  revenue: number
  goal?: number
  isLoading?: boolean
}

export function GoalGauge({ revenue, goal = 50000, isLoading }: Props) {
  if (isLoading) return <RingSkeleton />

  return (
    <div className="rounded-card p-8 bg-surface border border-border card-hover h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-grotesk font-700 text-base text-text">Meta do Período</h3>
        <p className="text-xs font-sans text-text-muted mt-0.5">Receita vs meta mensal</p>
      </div>
      <div className="flex-1" style={{ minHeight: 160 }}>
        <GoalGaugeInner revenue={revenue} goal={goal} />
      </div>
    </div>
  )
}
