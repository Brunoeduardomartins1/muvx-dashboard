import type { Purchase, PersonalRow, TopPlan } from './types'
import { PAYMENT_METHOD_LABELS, STATUS_LABELS } from './utils'

function escape(v: string | number | null | undefined): string {
  const s = String(v ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

function download(filename: string, content: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function exportPurchasesCsv(items: Purchase[], filename = 'compras.csv') {
  const header = ['Aluno', 'Personal', 'Plano', 'Valor (R$)', 'Status', 'Método', 'Data']
  const rows = items.map(p => [
    p.studentName ?? '',
    p.personalName ?? '',
    p.planName ?? '',
    p.amount.toFixed(2).replace('.', ','),
    STATUS_LABELS[p.status] ?? p.status,
    p.paymentMethod ? (PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod) : '',
    p.createdAt ? p.createdAt.split('T')[0] : '',
  ])
  const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n')
  download(filename, csv)
}

export function exportPersonalsCsv(items: PersonalRow[], filename = 'personais.csv') {
  const header = ['Personal', 'E-mail', 'Produtos', 'Vendas']
  const rows = items.map(p => [p.personalName, p.email ?? '', p.productsCount, p.salesCount])
  const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n')
  download(filename, csv)
}

export function exportPlansCsv(items: TopPlan[], filename = 'planos.csv') {
  const header = ['Plano', 'Vendas', 'Receita (R$)']
  const rows = items.map(p => [p.planName, p.count, p.revenue.toFixed(2).replace('.', ',')])
  const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n')
  download(filename, csv)
}
