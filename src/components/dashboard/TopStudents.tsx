'use client'

import type { TopStudent } from '@/lib/types'
import { fmtBRL, fmtNum } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  topStudents: TopStudent[]
  isLoading?: boolean
}

export function TopStudents({ topStudents, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card rounded-card p-8">
        <Skeleton className="h-5 w-40 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card rounded-card p-8">
      <div className="mb-6">
        <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
          Top Alunos por Gasto
        </h3>
        <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Alunos com maior valor em compras concluídas no período
        </p>
      </div>

      {topStudents.length === 0 ? (
        <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Sem dados no período.</p>
      ) : (
        <div className="space-y-3">
          {topStudents.map((s, i) => (
            <div key={s.studentId} className="flex items-center gap-3">
              <span
                className="w-5 text-xs font-grotesk font-700 text-right flex-shrink-0"
                style={{ color: i === 0 ? '#08F887' : 'var(--text-muted)' }}
              >
                {i + 1}
              </span>
              <span
                className="flex-1 text-sm font-sans font-500 truncate"
                style={{ color: 'var(--text-primary)' }}
                title={s.studentName}
              >
                {s.studentName}
              </span>
              <span className="text-xs font-sans flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {fmtNum(s.purchasesCount)}x
              </span>
              <span className="text-sm font-grotesk font-700 flex-shrink-0" style={{ color: '#08F887' }}>
                {fmtBRL(s.totalSpent)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
