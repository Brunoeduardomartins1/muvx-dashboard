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
    <div className="card rounded-card p-8 h-full flex flex-col" style={{ minHeight: 300 }}>
      <div className="mb-4">
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
          Meta do Período
        </h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Receita vs meta mensal
        </p>
      </div>
      <div className="flex-1" style={{ minHeight: 180 }}>
        <GoalGaugeInner revenue={revenue} goal={goal} />
      </div>
    </div>
  )
}
