'use client'

import type { TopPersonal } from '@/lib/types'
import { fmtBRL, fmtNum } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  topPersonals: TopPersonal[]
  isLoading?: boolean
}

function TopPersonaisSkeleton() {
  return (
    <div className="rounded-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="px-8 py-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Skeleton className="h-5 w-48 mb-1" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="px-8 py-4 space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TopPersonais({ topPersonals, isLoading }: Props) {
  if (isLoading) return <TopPersonaisSkeleton />

  return (
    <div className="rounded-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
            Top Personais
          </h3>
          <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Ranking por receita gerada · top 10
          </p>
        </div>
      </div>

      {topPersonals.length === 0 ? (
        <div className="px-8 py-12 text-center">
          <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Nenhuma venda registrada.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['#', 'Personal', 'Concluídas', 'Agendadas', 'Canceladas', 'Receita Bruta', 'Fat. MUVX'].map(col => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-sans font-600 uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topPersonals.map((p, i) => (
                <tr
                  key={p.personalId}
                  className="transition-colors duration-150"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-6 py-3.5 text-sm font-grotesk font-700" style={{ color: i === 0 ? '#08F887' : 'var(--text-muted)' }}>
                    {i + 1}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-sans font-500 max-w-[160px] truncate" style={{ color: 'var(--text-primary)' }} title={p.personalName}>
                    {p.personalName}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-grotesk font-600" style={{ color: '#08F887' }}>
                    {fmtNum(p.completedSales)}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-grotesk font-600" style={{ color: '#06B6D4' }}>
                    {fmtNum(p.scheduledSales)}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-grotesk font-600" style={{ color: p.cancelledSales > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                    {fmtNum(p.cancelledSales)}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-grotesk font-600 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {fmtBRL(p.grossRevenue)}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-grotesk font-600 whitespace-nowrap" style={{ color: '#08F887' }}>
                    {fmtBRL(p.muvxRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
