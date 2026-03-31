'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import type { Purchase } from '@/lib/types'
import { fmtBRL, fmtDate, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'

interface Props {
  purchases: Purchase[]
  isLoading?: boolean
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'CANCELLED_BY_STUDENT', label: 'Canc. pelo aluno' },
  { value: 'CANCELLED_BY_PERSONAL', label: 'Canc. pelo personal' },
  { value: 'PENDING', label: 'Pendente' },
]

export function DataTable({ purchases, isLoading }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return purchases.filter(p => {
      if (statusFilter && p.status !== statusFilter) return false
      if (!q) return true
      return (
        (p.studentName ?? '').toLowerCase().includes(q) ||
        (p.personalName ?? '').toLowerCase().includes(q) ||
        (p.planName ?? '').toLowerCase().includes(q) ||
        (p.paymentMethod ?? '').toLowerCase().includes(q)
      )
    })
  }, [purchases, search, statusFilter])

  if (isLoading) return <TableSkeleton />

  return (
    <div
      className="rounded-card overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="px-8 py-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
            Compras Recentes
          </h3>
          <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Top 100 do período · mostrando {filtered.length} de {purchases.length}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-sans rounded-lg outline-none w-44"
              style={{
                backgroundColor: 'var(--bg-page)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-sans rounded-lg outline-none"
            style={{
              backgroundColor: 'var(--bg-page)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-8 py-12 text-center">
          <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
            Nenhuma compra encontrada.
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
              {filtered.map((p) => (
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
