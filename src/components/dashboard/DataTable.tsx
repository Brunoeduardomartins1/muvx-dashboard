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
    <div className="rounded-card bg-surface border border-border overflow-hidden card-hover">
      <div className="px-8 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-grotesk font-700 text-base text-text">Compras Recentes</h3>
          <p className="text-xs font-sans text-text-muted mt-0.5">
            Top 100 do período · mostrando {purchases.length}
          </p>
        </div>
      </div>

      {purchases.length === 0 ? (
        <div className="px-8 py-12 text-center">
          <p className="text-sm font-sans text-text-muted">Nenhuma compra no período selecionado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-border">
                {['Aluno', 'Personal', 'Plano', 'Valor', 'Status', 'Método', 'Data'].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-sans font-600 text-text-muted uppercase tracking-widest"
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
                  className="border-b border-border last:border-0 hover:bg-[#FAFAFA] transition-colors duration-150"
                  role="row"
                >
                  <td className="px-6 py-3.5 text-sm font-sans text-text font-500 max-w-[120px] truncate">
                    {p.studentName ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-sans text-text-secondary max-w-[120px] truncate">
                    {p.personalName ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-sans text-text-secondary max-w-[120px] truncate">
                    {p.planName ?? '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-grotesk font-600 text-text whitespace-nowrap">
                    {fmtBRL(p.amount)}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-3.5 text-sm font-sans text-text-secondary">
                    {p.paymentMethod
                      ? PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod
                      : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-sans text-text-muted whitespace-nowrap">
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
