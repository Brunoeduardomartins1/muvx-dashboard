import { NextRequest, NextResponse } from 'next/server'
import { getMuvxToken, muvxGet } from '@/lib/api'
import type { MetricsResponse, Purchase, TopPersonal, PersonalRow } from '@/lib/types'

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
  personal?: { id?: string; name?: string; email?: string }
  paymentTransaction?: { status?: string }
}

interface AdminPurchasesResponse {
  data?: RawPurchase[]
  total?: number
  totalPages?: number
  page?: number
  limit?: number
}

interface RawPersonal {
  id?: string
  user?: { fullName?: string; name?: string; email?: string }
  _count?: {
    products?: number
    salesReceived?: number
  }
}

interface AdminPersonalsResponse {
  data?: RawPersonal[]
  meta?: { total?: number; totalPages?: number }
}

const CANCELLED_STATUSES = ['CANCELLED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_PERSONAL']
const COMPLETED_STATUS = 'COMPLETED'
const SCHEDULED_STATUS = 'SCHEDULED'
const MUVX_FEE_PCT = 0.02
const MUVX_FEE_FIXED = 3.99

function toStartOfDay(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`
}

function toEndOfDay(dateStr: string): string {
  return `${dateStr}T23:59:59.999Z`
}

export async function GET(req: NextRequest) {
  const errors: string[] = []

  // Período via query params — default: mês corrente
  const { searchParams } = new URL(req.url)
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const defaultTo = now.toISOString().split('T')[0]
  const fromDate = searchParams.get('from') ?? defaultFrom
  const toDate = searchParams.get('to') ?? defaultTo

  const createdFrom = toStartOfDay(fromDate)
  const createdTo = toEndOfDay(toDate)

  let token: string
  try {
    token = await getMuvxToken()
  } catch (err) {
    return NextResponse.json(
      { message: String(err) },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const purchasesPath = `/admin/purchases?limit=100&page=1&createdFrom=${encodeURIComponent(createdFrom)}&createdTo=${encodeURIComponent(createdTo)}`

  // Busca página 1 de personals para descobrir totalPages, depois busca o restante em paralelo
  const [dashboardResult, statsResult, overviewResult, purchasesResult, personalsPage1Result] =
    await Promise.allSettled([
      muvxGet<AdminDashboard>('/admin/dashboard', token),
      muvxGet<AdminStats>('/admin/dashboard/stats', token),
      muvxGet<AdminOverview>('/admin/stats/overview', token),
      muvxGet<AdminPurchasesResponse>(purchasesPath, token),
      muvxGet<AdminPersonalsResponse>('/admin/personals?limit=100&page=1', token),
    ])

  const dashboard = dashboardResult.status === 'fulfilled' ? dashboardResult.value : null
  const stats = statsResult.status === 'fulfilled' ? statsResult.value : null
  const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null
  const purchasesData = purchasesResult.status === 'fulfilled' ? purchasesResult.value : null
  const personalsPage1 = personalsPage1Result.status === 'fulfilled' ? personalsPage1Result.value : null

  if (!dashboard) errors.push('admin/dashboard indisponível')
  if (!stats) errors.push('admin/dashboard/stats indisponível')
  if (!overview) errors.push('admin/stats/overview indisponível')
  if (!purchasesData) errors.push('admin/purchases indisponível')
  if (!personalsPage1) errors.push('admin/personals indisponível')

  // Busca páginas restantes de personals em paralelo
  const totalPersonalsPages = personalsPage1?.meta?.totalPages ?? 1
  let allPersonals: RawPersonal[] = personalsPage1?.data ?? []
  if (totalPersonalsPages > 1) {
    const extraPages = Array.from({ length: totalPersonalsPages - 1 }, (_, i) => i + 2)
    const extraResults = await Promise.allSettled(
      extraPages.map(page => muvxGet<AdminPersonalsResponse>(`/admin/personals?limit=100&page=${page}`, token))
    )
    for (const r of extraResults) {
      if (r.status === 'fulfilled' && r.value?.data) {
        allPersonals = allPersonals.concat(r.value.data)
      }
    }
  }

  // --- Totais globais (não mudam com período) ---
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

  // --- Purchases no período ---
  const rawPurchases: RawPurchase[] = purchasesData?.data ?? []
  const purchasesTotal = purchasesData?.total ?? rawPurchases.length

  const purchasesByStatus: Record<string, number> = {}
  const purchasesByStatusDetail: Record<string, Purchase[]> = {}
  const personalSalesMap: Record<string, {
    name: string
    completed: number
    scheduled: number
    cancelled: number
    revenue: number
  }> = {}

  for (const p of rawPurchases) {
    const status = p.status ?? 'UNKNOWN'
    purchasesByStatus[status] = (purchasesByStatus[status] ?? 0) + 1

    // Acumula detalhe por status para drill-down
    const purchaseDetail: Purchase = {
      id: p.id ?? '',
      studentName: p.student?.name ?? null,
      personalName: p.personal?.name ?? null,
      amount: Number(p.totalAmount ?? 0),
      status,
      createdAt: p.createdAt ?? null,
      paymentMethod: p.paymentMethod ?? p.billingType ?? null,
      planName: p.originalProduct?.name ?? null,
    }
    if (!purchasesByStatusDetail[status]) purchasesByStatusDetail[status] = []
    purchasesByStatusDetail[status].push(purchaseDetail)

    const pid = p.personal?.id
    if (pid) {
      if (!personalSalesMap[pid]) {
        personalSalesMap[pid] = {
          name: p.personal?.name ?? 'Desconhecido',
          completed: 0,
          scheduled: 0,
          cancelled: 0,
          revenue: 0,
        }
      }
      const entry = personalSalesMap[pid]
      if (status === COMPLETED_STATUS) {
        entry.completed++
        entry.revenue += Number(p.totalAmount ?? 0)
      } else if (status === SCHEDULED_STATUS) {
        entry.scheduled++
      } else if (CANCELLED_STATUSES.includes(status)) {
        entry.cancelled++
      }
    }
  }

  const completedSales = purchasesByStatus[COMPLETED_STATUS] ?? 0
  const scheduledSales = purchasesByStatus[SCHEDULED_STATUS] ?? 0
  const cancelledSales = CANCELLED_STATUSES.reduce((sum, s) => sum + (purchasesByStatus[s] ?? 0), 0)

  const revenueInPeriod = rawPurchases
    .filter(p => p.status === COMPLETED_STATUS)
    .reduce((sum, p) => sum + Number(p.totalAmount ?? 0), 0)

  const scheduledRevenue = rawPurchases
    .filter(p => p.status === SCHEDULED_STATUS)
    .reduce((sum, p) => sum + Number(p.totalAmount ?? 0), 0)

  const muvxRevenue = revenueInPeriod * MUVX_FEE_PCT + completedSales * MUVX_FEE_FIXED

  // --- Engajamento de personais ---
  const toPersonalRow = (p: RawPersonal): PersonalRow => ({
    personalId: p.id ?? '',
    personalName: p.user?.fullName ?? p.user?.name ?? 'Desconhecido',
    email: p.user?.email ?? null,
    productsCount: p._count?.products ?? 0,
    salesCount: p._count?.salesReceived ?? 0,
  })

  const personalsWithProductList: PersonalRow[] = allPersonals
    .filter(p => (p._count?.products ?? 0) > 0)
    .map(toPersonalRow)
  const personalsWithProduct = personalsWithProductList.length

  const personalsWithSaleTotal = allPersonals.filter(p => (p._count?.salesReceived ?? 0) > 0).length

  // personalsWithSale no período: personais únicos nas purchases do período selecionado
  const personalsWithSale = Object.keys(personalSalesMap).length

  // Lista de personais com venda no período (do personalSalesMap, com detalhes)
  const personalsWithSaleList: PersonalRow[] = Object.entries(personalSalesMap).map(([pid, s]) => {
    const found = allPersonals.find(p => p.id === pid)
    return {
      personalId: pid,
      personalName: s.name,
      email: found?.user?.email ?? null,
      productsCount: found?._count?.products ?? 0,
      salesCount: s.completed + s.scheduled + s.cancelled,
    }
  })

  // Todas as compras do período para modais de totais
  const allPurchasesInPeriod: Purchase[] = rawPurchases.map(p => ({
    id: p.id ?? '',
    studentName: p.student?.name ?? null,
    personalName: p.personal?.name ?? null,
    amount: Number(p.totalAmount ?? 0),
    status: p.status ?? 'UNKNOWN',
    createdAt: p.createdAt ?? null,
    paymentMethod: p.paymentMethod ?? p.billingType ?? null,
    planName: p.originalProduct?.name ?? null,
  }))

  // --- Top Personais no período ---
  const topPersonals: TopPersonal[] = Object.entries(personalSalesMap)
    .map(([personalId, s]) => {
      const muvxRev = s.revenue * MUVX_FEE_PCT + s.completed * MUVX_FEE_FIXED
      return {
        personalId,
        personalName: s.name,
        completedSales: s.completed,
        scheduledSales: s.scheduled,
        totalSales: s.completed + s.scheduled,
        cancelledSales: s.cancelled,
        grossRevenue: s.revenue,
        muvxRevenue: muvxRev,
      }
    })
    .sort((a, b) => b.grossRevenue - a.grossRevenue || b.totalSales - a.totalSales)
    .slice(0, 10)

  // Conversão: personais que venderam no período / total geral de personais da plataforma
  const conversionRate = totalPersonals > 0 ? (personalsWithSale / totalPersonals) * 100 : 0

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
    muvxRevenue,
    purchasesTotal,
    completedSales,
    scheduledSales,
    scheduledRevenue,
    cancelledSales,
    purchasesByStatus,
    purchasesByStatusDetail,
    recentPurchases,
    personalsWithProduct,
    personalsWithSale,
    personalsWithSaleTotal,
    personalsWithProductList,
    personalsWithSaleList,
    allPurchasesInPeriod,
    topPersonals,
    conversionRate,
    errors,
  }

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
