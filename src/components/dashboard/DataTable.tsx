'use client'

import type { Purchase } from '@/lib/types'
import { fmtBRL, fmtDate, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'

interface Props {
  purchases: Purchase[]
  isLoading?: boolean
}

export function DataTable({ purchases, isLoading }: Props) {
  if (isLoading) return <TableSkeleton />

  return (
    <div
      className="rounded-card overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
            Compras Recentes
          </h3>
          <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Top 100 do período · mostrando {purchases.length}
          </p>
        </div>
      </div>

      {purchases.length === 0 ? (
        <div className="px-8 py-12 text-center">
          <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
            Nenhuma compra no período selecionado.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Aluno', 'Personal', 'Plano', 'Valor', 'Status', 'Método', 'Data'].map((col) => (
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
            <tbody role="rowgroup">
              {purchases.map((p) => (
                <tr
                  key={p.id}
                  role="row"
                  className="transition-colors duration-150"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td className="px-6 py-3.5 text-sm font-sans font-500 max-w-[120px] truncate" style={{ color: 'var(--text-primary)' }} title={p.studentName ?? undefined}>
                    {p.studentName ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-sans max-w-[120px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.personalName ?? undefined}>
                    {p.personalName ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-sans max-w-[120px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.planName ?? undefined}>
                    {p.planName ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-grotesk font-600 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {fmtBRL(p.amount)}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-3.5 text-sm font-sans" style={{ color: 'var(--text-secondary)' }}>
                    {p.paymentMethod ? (PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod) : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-sans whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {fmtDate(p.createdAt)}
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
