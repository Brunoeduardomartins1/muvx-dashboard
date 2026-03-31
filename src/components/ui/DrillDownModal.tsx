'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { Purchase } from '@/lib/types'
import { fmtBRL, fmtDate, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'

interface Props {
  title: string
  subtitle?: string
  purchases: Purchase[]
  onClose: () => void
}

export function DrillDownModal({ title, subtitle, purchases, onClose }: Props) {
  // Fecha com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Impede scroll do body enquanto modal aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-card overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h2 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#08F887')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {purchases.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Nenhum registro encontrado.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-card)' }}>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Aluno', 'Personal', 'Plano', 'Valor', 'Status', 'Método', 'Data'].map(col => (
                    <th key={col} className="px-6 py-3 text-left text-xs font-sans font-600 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr
                    key={p.id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-6 py-3.5 text-sm font-sans font-500 max-w-[130px] truncate" style={{ color: 'var(--text-primary)' }} title={p.studentName ?? undefined}>
                      {p.studentName ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-sans max-w-[130px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.personalName ?? undefined}>
                      {p.personalName ?? '—'}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-sans max-w-[130px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.planName ?? undefined}>
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
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 flex-shrink-0 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color)' }}>
          <span className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
            {purchases.length} {purchases.length === 1 ? 'registro' : 'registros'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-sans font-600 border transition-all duration-150"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
