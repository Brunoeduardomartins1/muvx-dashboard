'use client'

import { useEffect, useState, useMemo } from 'react'
import { X } from 'lucide-react'
import type { Purchase, PersonalRow } from '@/lib/types'
import { fmtBRL, fmtDate, fmtNum, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { ExcelFilter } from '@/components/ui/ExcelFilter'

interface PurchasesModal {
  kind: 'purchases'
  title: string
  subtitle?: string
  items: Purchase[]
}

interface PersonalsModal {
  kind: 'personals'
  title: string
  subtitle?: string
  items: PersonalRow[]
}

type Props = (PurchasesModal | PersonalsModal) & { onClose: () => void }

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Concluído', ACTIVE: 'Ativo', SCHEDULED: 'Agendado',
  CANCELLED: 'Cancelado', CANCELLED_BY_STUDENT: 'Canc. aluno',
  CANCELLED_BY_PERSONAL: 'Canc. personal', PENDING: 'Pendente',
}

function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)) }

export function DrillDownModal(props: Props) {
  const { title, subtitle, onClose } = props

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

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
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-card overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h2 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            {subtitle && <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
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
        <div className="overflow-auto flex-1">
          {props.items.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <p className="text-sm font-sans" style={{ color: 'var(--text-muted)' }}>Nenhum registro encontrado.</p>
            </div>
          ) : props.kind === 'purchases' ? (
            <PurchasesTable items={props.items} />
          ) : (
            <PersonalsTable items={props.items} />
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 flex-shrink-0 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color)' }}>
          <span className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
            {props.items.length} {props.items.length === 1 ? 'registro' : 'registros'}
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

interface PF { student: Set<string>; personal: Set<string>; plan: Set<string>; amount: Set<string>; status: Set<string>; method: Set<string>; date: Set<string> }
const PF0: PF = { student: new Set(), personal: new Set(), plan: new Set(), amount: new Set(), status: new Set(), method: new Set(), date: new Set() }

function PurchasesTable({ items }: { items: Purchase[] }) {
  const [f, setF] = useState<PF>(PF0)
  const set = (key: keyof PF) => (s: Set<string>) => setF(prev => ({ ...prev, [key]: s }))

  const opts = useMemo(() => ({
    student: unique(items.map(p => p.studentName ?? '—').filter(Boolean)).sort(),
    personal: unique(items.map(p => p.personalName ?? '—').filter(Boolean)).sort(),
    plan: unique(items.map(p => p.planName ?? '—').filter(Boolean)).sort(),
    amount: unique(items.map(p => fmtBRL(p.amount))).sort(),
    status: unique(items.map(p => p.status)).sort(),
    method: unique(items.map(p => p.paymentMethod ?? '')).filter(Boolean).sort(),
    date: unique(items.map(p => fmtDate(p.createdAt))).sort(),
  }), [items])

  const filtered = useMemo(() => items.filter(p => {
    if (f.student.size && !f.student.has(p.studentName ?? '—')) return false
    if (f.personal.size && !f.personal.has(p.personalName ?? '—')) return false
    if (f.plan.size && !f.plan.has(p.planName ?? '—')) return false
    if (f.amount.size && !f.amount.has(fmtBRL(p.amount))) return false
    if (f.status.size && !f.status.has(p.status)) return false
    if (f.method.size && !f.method.has(p.paymentMethod ?? '')) return false
    if (f.date.size && !f.date.has(fmtDate(p.createdAt))) return false
    return true
  }), [items, f])

  return (
    <table className="w-full">
      <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-card)', zIndex: 10 }}>
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          <th className="px-4 py-3 text-left" style={{ minWidth: 150 }}>
            <ExcelFilter label="Aluno" values={opts.student} selected={f.student} onChangeSelected={set('student')} />
          </th>
          <th className="px-4 py-3 text-left" style={{ minWidth: 150 }}>
            <ExcelFilter label="Personal" values={opts.personal} selected={f.personal} onChangeSelected={set('personal')} />
          </th>
          <th className="px-4 py-3 text-left" style={{ minWidth: 130 }}>
            <ExcelFilter label="Plano" values={opts.plan} selected={f.plan} onChangeSelected={set('plan')} />
          </th>
          <th className="px-4 py-3 text-left" style={{ minWidth: 100 }}>
            <ExcelFilter label="Valor" values={opts.amount} selected={f.amount} onChangeSelected={set('amount')} />
          </th>
          <th className="px-4 py-3 text-left" style={{ minWidth: 120 }}>
            <ExcelFilter
              label="Status"
              values={opts.status.map(s => STATUS_LABELS[s] ?? s)}
              rawValues={opts.status}
              selected={f.status}
              onChangeSelected={set('status')}
            />
          </th>
          <th className="px-4 py-3 text-left" style={{ minWidth: 110 }}>
            <ExcelFilter
              label="Método"
              values={opts.method.map(m => PAYMENT_METHOD_LABELS[m] ?? m)}
              rawValues={opts.method}
              selected={f.method}
              onChangeSelected={set('method')}
            />
          </th>
          <th className="px-4 py-3 text-left" style={{ minWidth: 100 }}>
            <ExcelFilter label="Data" values={opts.date} selected={f.date} onChangeSelected={set('date')} />
          </th>
        </tr>
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          <td colSpan={7} className="px-4 py-1.5 text-xs font-sans" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-page)' }}>
            {filtered.length === items.length ? `${items.length} registros` : `${filtered.length} de ${items.length}`}
          </td>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-10 text-center text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
              Nenhum resultado para os filtros aplicados.
            </td>
          </tr>
        ) : filtered.map(p => (
          <tr
            key={p.id}
            className="transition-colors duration-150"
            style={{ borderBottom: '1px solid var(--border-color)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <td className="px-4 py-3.5 text-sm font-sans font-500 max-w-[150px] truncate" style={{ color: 'var(--text-primary)' }} title={p.studentName ?? undefined}>
              {p.studentName ?? '—'}
            </td>
            <td className="px-4 py-3.5 text-sm font-sans max-w-[150px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.personalName ?? undefined}>
              {p.personalName ?? '—'}
            </td>
            <td className="px-4 py-3.5 text-sm font-sans max-w-[130px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.planName ?? undefined}>
              {p.planName ?? '—'}
            </td>
            <td className="px-4 py-3.5 text-sm font-grotesk font-600 whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
              {fmtBRL(p.amount)}
            </td>
            <td className="px-4 py-3.5">
              <StatusBadge status={p.status} />
            </td>
            <td className="px-4 py-3.5 text-sm font-sans" style={{ color: 'var(--text-secondary)' }}>
              {p.paymentMethod ? (PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod) : '—'}
            </td>
            <td className="px-4 py-3.5 text-sm font-sans whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              {fmtDate(p.createdAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

interface GF { name: Set<string>; email: Set<string>; products: Set<string>; sales: Set<string> }
const GF0: GF = { name: new Set(), email: new Set(), products: new Set(), sales: new Set() }

function PersonalsTable({ items }: { items: PersonalRow[] }) {
  const [f, setF] = useState<GF>(GF0)
  const set = (key: keyof GF) => (s: Set<string>) => setF(prev => ({ ...prev, [key]: s }))

  const opts = useMemo(() => ({
    name: unique(items.map(p => p.personalName)).sort(),
    email: unique(items.map(p => p.email ?? '—')).sort(),
    products: unique(items.map(p => String(p.productsCount))).sort((a, b) => Number(b) - Number(a)),
    sales: unique(items.map(p => String(p.salesCount))).sort((a, b) => Number(b) - Number(a)),
  }), [items])

  const filtered = useMemo(() => items.filter(p => {
    if (f.name.size && !f.name.has(p.personalName)) return false
    if (f.email.size && !f.email.has(p.email ?? '—')) return false
    if (f.products.size && !f.products.has(String(p.productsCount))) return false
    if (f.sales.size && !f.sales.has(String(p.salesCount))) return false
    return true
  }), [items, f])

  return (
    <table className="w-full">
      <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-card)', zIndex: 10 }}>
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          <th className="px-4 py-3 text-left" style={{ color: 'var(--text-muted)', minWidth: 40 }}>
            <span className="text-xs font-sans font-600 uppercase tracking-widest">#</span>
          </th>
          <th className="px-4 py-3 text-left" style={{ minWidth: 180 }}>
            <ExcelFilter label="Personal" values={opts.name} selected={f.name} onChangeSelected={set('name')} />
          </th>
          <th className="px-4 py-3 text-left" style={{ minWidth: 200 }}>
            <ExcelFilter label="E-mail" values={opts.email} selected={f.email} onChangeSelected={set('email')} />
          </th>
          <th className="px-4 py-3 text-left" style={{ minWidth: 100 }}>
            <ExcelFilter label="Produtos" values={opts.products} selected={f.products} onChangeSelected={set('products')} />
          </th>
          <th className="px-4 py-3 text-left" style={{ minWidth: 100 }}>
            <ExcelFilter label="Vendas" values={opts.sales} selected={f.sales} onChangeSelected={set('sales')} />
          </th>
        </tr>
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          <td colSpan={5} className="px-4 py-1.5 text-xs font-sans" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-page)' }}>
            {filtered.length === items.length ? `${items.length} registros` : `${filtered.length} de ${items.length}`}
          </td>
        </tr>
      </thead>
      <tbody>
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-6 py-10 text-center text-sm font-sans" style={{ color: 'var(--text-muted)' }}>
              Nenhum resultado para os filtros aplicados.
            </td>
          </tr>
        ) : filtered.map((p, i) => (
          <tr
            key={p.personalId}
            className="transition-colors duration-150"
            style={{ borderBottom: '1px solid var(--border-color)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-card-dark)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <td className="px-4 py-3.5 text-sm font-grotesk font-700" style={{ color: 'var(--text-muted)' }}>
              {i + 1}
            </td>
            <td className="px-4 py-3.5 text-sm font-sans font-500 max-w-[180px] truncate" style={{ color: 'var(--text-primary)' }} title={p.personalName}>
              {p.personalName}
            </td>
            <td className="px-4 py-3.5 text-sm font-sans max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.email ?? undefined}>
              {p.email ?? '—'}
            </td>
            <td className="px-4 py-3.5 text-sm font-grotesk font-600" style={{ color: '#08F887' }}>
              {fmtNum(p.productsCount)}
            </td>
            <td className="px-4 py-3.5 text-sm font-grotesk font-600" style={{ color: 'var(--text-primary)' }}>
              {fmtNum(p.salesCount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
