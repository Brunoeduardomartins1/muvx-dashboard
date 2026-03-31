'use client'

import dynamic from 'next/dynamic'
import { RingSkeleton } from '@/components/ui/Skeleton'

const ConversionRingInner = dynamic(() => import('./ConversionRingInner'), {
  ssr: false,
  loading: () => <RingSkeleton />,
})

interface Props {
  rate: number
  isLoading?: boolean
}

export function ConversionRing({ rate, isLoading }: Props) {
  if (isLoading) return <RingSkeleton />

  return (
    <div className="card rounded-card p-8 h-full flex flex-col" style={{ minHeight: 300 }}>
      <div className="mb-4">
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
          Taxa de Conversão
        </h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Compras pagas / total do período
        </p>
      </div>
      <div className="flex-1" style={{ minHeight: 180 }}>
        <ConversionRingInner rate={rate} />
      </div>
    </div>
  )
}
