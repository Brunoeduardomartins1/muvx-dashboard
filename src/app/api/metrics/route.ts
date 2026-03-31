import { NextResponse } from 'next/server'
import { getMuvxToken, muvxGet } from '@/lib/api'
import type { MetricsResponse, Purchase } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface AdminDashboard {
  totals?: {
    users?: number
    students?: number
    personals?: number
    activeUsers?: number
  }
}

interface AdminStats {
  growth?: {
    usersLastMonth?: number
    studentsLastMonth?: number
    personalsLastMonth?: number
  }
  cref?: { verified?: number; pending?: number }
}

interface AdminOverview {
  users?: { total?: number; active?: number; inactive?: number }
  profiles?: { students?: number; personals?: number; admins?: number }
}

interface RawPurchase {
  id?: string
  status?: string
  totalAmount?: number | string
  createdAt?: string
  paymentMethod?: string
  billingType?: string
  recurrenceInterval?: string
  originalProduct?: { name?: string }
  student?: { name?: string; email?: string }
  personal?: { name?: string; email?: string }
}

interface AdminPurchasesResponse {
  data?: RawPurchase[]
  total?: number
  totalPages?: number
  page?: number
  limit?: number
}

export async function GET() {
  const errors: string[] = []

  let token: string
  try {
    token = await getMuvxToken()
  } catch (err) {
    return NextResponse.json(
      { message: String(err) },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const [dashboardResult, statsResult, overviewResult, purchasesResult] =
    await Promise.allSettled([
      muvxGet<AdminDashboard>('/admin/dashboard', token),
      muvxGet<AdminStats>('/admin/dashboard/stats', token),
      muvxGet<AdminOverview>('/admin/stats/overview', token),
      muvxGet<AdminPurchasesResponse>('/admin/purchases?limit=100&page=1', token),
    ])

  const dashboard = dashboardResult.status === 'fulfilled' ? dashboardResult.value : null
  const stats = statsResult.status === 'fulfilled' ? statsResult.value : null
  const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null
  const purchasesData = purchasesResult.status === 'fulfilled' ? purchasesResult.value : null

  if (!dashboard) errors.push('admin/dashboard indisponível')
  if (!stats) errors.push('admin/dashboard/stats indisponível')
  if (!overview) errors.push('admin/stats/overview indisponível')
  if (!purchasesData) errors.push('admin/purchases indisponível')

  const totalUsers = dashboard?.totals?.users ?? 0
  const totalStudents = dashboard?.totals?.students ?? 0
  const totalPersonals = dashboard?.totals?.personals ?? 0

  const activeUsers = overview?.users?.active ?? dashboard?.totals?.activeUsers ?? 0
  const inactiveUsers = overview?.users?.inactive ?? 0

  const usersGrowthLastMonth = stats?.growth?.usersLastMonth ?? 0
  const studentsGrowthLastMonth = stats?.growth?.studentsLastMonth ?? 0
  const personalsGrowthLastMonth = stats?.growth?.personalsLastMonth ?? 0

  const crefVerified = stats?.cref?.verified ?? 0
  const crefPending = stats?.cref?.pending ?? 0

  const rawPurchases: RawPurchase[] = purchasesData?.data ?? []
  const purchasesTotal = purchasesData?.total ?? rawPurchases.length

  const purchasesByStatus: Record<string, number> = {}
  let revenueInPeriod = 0

  for (const p of rawPurchases) {
    const status = p.status ?? 'UNKNOWN'
    purchasesByStatus[status] = (purchasesByStatus[status] ?? 0) + 1
    // Considera receita gerada pelas compras completadas e agendadas
    if (['COMPLETED', 'SCHEDULED', 'PAYMENT_PENDING'].includes(status)) {
      revenueInPeriod += Number(p.totalAmount ?? 0)
    }
  }

  const recentPurchases: Purchase[] = rawPurchases.slice(0, 10).map((p) => ({
    id: p.id ?? '',
    studentName: p.student?.name ?? null,
    personalName: p.personal?.name ?? null,
    amount: Number(p.totalAmount ?? 0),
    status: p.status ?? 'UNKNOWN',
    createdAt: p.createdAt ?? null,
    paymentMethod: p.paymentMethod ?? p.billingType ?? null,
    planName: p.originalProduct?.name ?? null,
  }))

  // Compras com pagamento confirmado / total de compras no período
  const paidStatuses = ['COMPLETED', 'SCHEDULED']
  const paidCount = paidStatuses.reduce((sum, s) => sum + (purchasesByStatus[s] ?? 0), 0)
  const conversionRate = purchasesTotal > 0 ? (paidCount / purchasesTotal) * 100 : 0

  const response: MetricsResponse = {
    fetchedAt: new Date().toISOString(),
    totalUsers,
    totalStudents,
    totalPersonals,
    activeUsers,
    inactiveUsers,
    usersGrowthLastMonth,
    studentsGrowthLastMonth,
    personalsGrowthLastMonth,
    crefVerified,
    crefPending,
    revenueInPeriod,
    purchasesTotal,
    purchasesByStatus,
    recentPurchases,
    conversionRate,
    errors,
  }

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
