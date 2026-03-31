import { NextRequest, NextResponse } from 'next/server'
import { getMuvxToken, muvxGet } from '@/lib/api'
import type { MetricsResponse, Purchase, TopPersonal, TopStudent, PersonalRow, WeekdaySales, TopPlan, DailyHeatmapPoint } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface AdminDashboard {
  totals?: { users?: number; students?: number; personals?: number; activeUsers?: number }
}
interface AdminStats {
  growth?: { usersLastMonth?: number; studentsLastMonth?: number; personalsLastMonth?: number }
  cref?: { verified?: number; pending?: number }
}
interface AdminOverview {
  users?: { total?: number; active?: number; inactive?: number }
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
  student?: { id?: string; name?: string; email?: string }
  personal?: { id?: string; name?: string; email?: string }
}
interface AdminPurchasesResponse {
  data?: RawPurchase[]
  total?: number
}
interface RawPersonal {
  id?: string
  createdAt?: string
  user?: { fullName?: string; name?: string; email?: string }
  averageRating?: number | null
  totalRatings?: number
  _count?: { products?: number; salesReceived?: number }
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
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function toISO(d: string, end = false) {
  return end ? `${d}T23:59:59.999Z` : `${d}T00:00:00.000Z`
}

function dateDiffDays(from: string, to: string): number {
  const diff = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(1, Math.round(diff / 86_400_000) + 1)
}

export async function GET(req: NextRequest) {
  const errors: string[] = []

  const { searchParams } = new URL(req.url)
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const defaultTo = now.toISOString().split('T')[0]
  const fromDate = searchParams.get('from') ?? defaultFrom
  const toDate   = searchParams.get('to')   ?? defaultTo
  const createdFrom = toISO(fromDate)
  const createdTo   = toISO(toDate, true)

  // days in period & days in current month (for projection)
  const daysInPeriod = dateDiffDays(fromDate, toDate)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()

  let token: string
  try { token = await getMuvxToken() } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  const purchasesPath      = `/admin/purchases?limit=100&page=1&createdFrom=${encodeURIComponent(createdFrom)}&createdTo=${encodeURIComponent(createdTo)}`
  const periodPersonalsPath = `/admin/personals?limit=1&page=1&createdFrom=${encodeURIComponent(createdFrom)}&createdTo=${encodeURIComponent(createdTo)}`

  const [dashRes, statsRes, overviewRes, purchasesRes, personalsP1Res, periodPersonalsRes] =
    await Promise.allSettled([
      muvxGet<AdminDashboard>('/admin/dashboard', token),
      muvxGet<AdminStats>('/admin/dashboard/stats', token),
      muvxGet<AdminOverview>('/admin/stats/overview', token),
      muvxGet<AdminPurchasesResponse>(purchasesPath, token),
      muvxGet<AdminPersonalsResponse>('/admin/personals?limit=100&page=1', token),
      muvxGet<AdminPersonalsResponse>(periodPersonalsPath, token),
    ])

  const dashboard     = dashRes.status      === 'fulfilled' ? dashRes.value      : null
  const stats         = statsRes.status     === 'fulfilled' ? statsRes.value     : null
  const overview      = overviewRes.status  === 'fulfilled' ? overviewRes.value  : null
  const purchasesData = purchasesRes.status === 'fulfilled' ? purchasesRes.value : null
  const personalsP1   = personalsP1Res.status === 'fulfilled' ? personalsP1Res.value : null
  const periodPersonals = (periodPersonalsRes.status === 'fulfilled' ? periodPersonalsRes.value?.meta?.total : null) ?? 0

  if (!dashboard)     errors.push('admin/dashboard indisponível')
  if (!stats)         errors.push('admin/dashboard/stats indisponível')
  if (!overview)      errors.push('admin/stats/overview indisponível')
  if (!purchasesData) errors.push('admin/purchases indisponível')
  if (!personalsP1)   errors.push('admin/personals indisponível')

  // Paginar todos os personais
  const totalPersonalsPages = personalsP1?.meta?.totalPages ?? 1
  let allPersonals: RawPersonal[] = personalsP1?.data ?? []
  if (totalPersonalsPages > 1) {
    const extraPages = Array.from({ length: totalPersonalsPages - 1 }, (_, i) => i + 2)
    const extraRes = await Promise.allSettled(
      extraPages.map(p => muvxGet<AdminPersonalsResponse>(`/admin/personals?limit=100&page=${p}`, token))
    )
    for (const r of extraRes) {
      if (r.status === 'fulfilled' && r.value?.data) allPersonals = allPersonals.concat(r.value.data)
    }
  }

  // ── Totais globais ──────────────────────────────────────────────────────────
  const totalUsers     = dashboard?.totals?.users     ?? 0
  const totalStudents  = dashboard?.totals?.students  ?? 0
  const totalPersonals = dashboard?.totals?.personals ?? 0
  const activeUsers    = overview?.users?.active ?? dashboard?.totals?.activeUsers ?? 0
  const inactiveUsers  = overview?.users?.inactive ?? 0
  const usersGrowthLastMonth     = stats?.growth?.usersLastMonth    ?? 0
  const studentsGrowthLastMonth  = stats?.growth?.studentsLastMonth ?? 0
  const personalsGrowthLastMonth = stats?.growth?.personalsLastMonth ?? 0
  const crefVerified = stats?.cref?.verified ?? 0
  const crefPending  = stats?.cref?.pending  ?? 0
  const crefApprovalRate = (crefVerified + crefPending) > 0
    ? (crefVerified / (crefVerified + crefPending)) * 100 : 0

  // ── Purchases no período ────────────────────────────────────────────────────
  const rawPurchases: RawPurchase[] = purchasesData?.data ?? []
  const purchasesTotal = purchasesData?.total ?? rawPurchases.length

  const purchasesByStatus: Record<string, number> = {}
  const purchasesByStatusDetail: Record<string, Purchase[]> = {}
  const personalSalesMap: Record<string, { name: string; completed: number; scheduled: number; cancelled: number; revenue: number }> = {}
  const studentSpendMap:  Record<string, { name: string; spent: number; count: number }> = {}
  const paymentMethodBreakdown: Record<string, number> = {}
  const recurrenceBreakdown: Record<string, number> = {}
  const planMap: Record<string, { count: number; revenue: number }> = {}
  const dailyMap: Record<string, { count: number; revenue: number }> = {}
  const weekdayMap: Record<number, { count: number; revenue: number }> = {}
  let recurringCount = 0; let oneTimeCount = 0
  let recurringRevenue = 0; let oneTimeRevenue = 0

  for (const p of rawPurchases) {
    const status = p.status ?? 'UNKNOWN'
    const amount = Number(p.totalAmount ?? 0)

    // Status aggregation
    purchasesByStatus[status] = (purchasesByStatus[status] ?? 0) + 1
    const detail: Purchase = {
      id: p.id ?? '',
      studentName: p.student?.name ?? null,
      personalName: p.personal?.name ?? null,
      amount,
      status,
      createdAt: p.createdAt ?? null,
      paymentMethod: p.paymentMethod ?? null,
      planName: p.originalProduct?.name ?? null,
      billingType: p.billingType ?? null,
      recurrenceInterval: p.recurrenceInterval ?? null,
    }
    if (!purchasesByStatusDetail[status]) purchasesByStatusDetail[status] = []
    purchasesByStatusDetail[status].push(detail)

    // Personal sales map
    const pid = p.personal?.id
    if (pid) {
      if (!personalSalesMap[pid]) personalSalesMap[pid] = { name: p.personal?.name ?? '—', completed: 0, scheduled: 0, cancelled: 0, revenue: 0 }
      const pe = personalSalesMap[pid]
      if (status === COMPLETED_STATUS)              { pe.completed++; pe.revenue += amount }
      else if (status === SCHEDULED_STATUS)         { pe.scheduled++ }
      else if (CANCELLED_STATUSES.includes(status)) { pe.cancelled++ }
    }

    // Top students (by spend on COMPLETED)
    const sid = p.student?.id
    if (sid && status === COMPLETED_STATUS) {
      if (!studentSpendMap[sid]) studentSpendMap[sid] = { name: p.student?.name ?? '—', spent: 0, count: 0 }
      studentSpendMap[sid].spent += amount
      studentSpendMap[sid].count++
    }

    // Top plans (COMPLETED only)
    if (status === COMPLETED_STATUS && p.originalProduct?.name) {
      const pname = p.originalProduct.name
      if (!planMap[pname]) planMap[pname] = { count: 0, revenue: 0 }
      planMap[pname].count++
      planMap[pname].revenue += amount
    }

    // Payment method — só completed/scheduled
    const isActive = status === COMPLETED_STATUS || status === SCHEDULED_STATUS
    if (isActive && p.paymentMethod) {
      paymentMethodBreakdown[p.paymentMethod] = (paymentMethodBreakdown[p.paymentMethod] ?? 0) + 1
    }

    // Billing type
    if (p.billingType === 'RECURRING') { recurringCount++; recurringRevenue += amount }
    else if (p.billingType === 'ONE_TIME') { oneTimeCount++; oneTimeRevenue += amount }

    // Recurrence interval — só ativas
    if (isActive && p.recurrenceInterval) {
      recurrenceBreakdown[p.recurrenceInterval] = (recurrenceBreakdown[p.recurrenceInterval] ?? 0) + 1
    }

    // Weekday
    if (p.createdAt) {
      const wd = new Date(p.createdAt).getDay()
      if (!weekdayMap[wd]) weekdayMap[wd] = { count: 0, revenue: 0 }
      weekdayMap[wd].count++
      if (status === COMPLETED_STATUS) weekdayMap[wd].revenue += amount
    }

    // Daily heatmap
    if (p.createdAt) {
      const day = p.createdAt.split('T')[0]
      if (!dailyMap[day]) dailyMap[day] = { count: 0, revenue: 0 }
      dailyMap[day].count++
      if (status === COMPLETED_STATUS) dailyMap[day].revenue += amount
    }
  }

  // Alunos únicos no período
  const uniqueStudentIds = new Set(rawPurchases.map(p => p.student?.id).filter(Boolean))
  const periodStudents = uniqueStudentIds.size

  // Financeiro
  const completedSales    = purchasesByStatus[COMPLETED_STATUS] ?? 0
  const scheduledSales    = purchasesByStatus[SCHEDULED_STATUS] ?? 0
  const cancelledSales    = CANCELLED_STATUSES.reduce((sum, s) => sum + (purchasesByStatus[s] ?? 0), 0)
  const revenueInPeriod   = rawPurchases.filter(p => p.status === COMPLETED_STATUS).reduce((s, p) => s + Number(p.totalAmount ?? 0), 0)
  const scheduledRevenue  = rawPurchases.filter(p => p.status === SCHEDULED_STATUS).reduce((s, p) => s + Number(p.totalAmount ?? 0), 0)
  const muvxRevenue       = revenueInPeriod * MUVX_FEE_PCT + completedSales * MUVX_FEE_FIXED
  const avgTicket         = completedSales > 0 ? revenueInPeriod / completedSales : 0
  const churnRate         = (completedSales + cancelledSales) > 0 ? (cancelledSales / (completedSales + cancelledSales)) * 100 : 0

  // LTV: receita / alunos únicos no período
  const ltv = periodStudents > 0 ? revenueInPeriod / periodStudents : 0

  // Velocidade de vendas: vendas concluídas por dia no período
  const salesVelocity = completedSales / daysInPeriod

  // Projeção mensal: velocity * dias restantes + receita já feita no mês
  // Se o período é "este mês", projeta o mês fechado; senão usa velocity * 30
  const projectedMonthRevenue = salesVelocity * daysInMonth * avgTicket

  // Top planos
  const topPlans: TopPlan[] = Object.entries(planMap)
    .map(([planName, v]) => ({ planName, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue || b.count - a.count)
    .slice(0, 10)

  // Daily heatmap
  const dailyHeatmap: DailyHeatmapPoint[] = Object.entries(dailyMap)
    .map(([date, v]) => ({ date, count: v.count, revenue: v.revenue }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Vendas por dia da semana
  const salesByWeekday: WeekdaySales[] = WEEKDAYS.map((day, i) => ({
    day,
    count: weekdayMap[i]?.count ?? 0,
    revenue: weekdayMap[i]?.revenue ?? 0,
  }))

  // Top students
  const topStudents: TopStudent[] = Object.entries(studentSpendMap)
    .map(([studentId, s]) => ({ studentId, studentName: s.name, totalSpent: s.spent, purchasesCount: s.count }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)

  // ── Engajamento de personais ────────────────────────────────────────────────
  const toPersonalRow = (p: RawPersonal): PersonalRow => ({
    personalId: p.id ?? '',
    personalName: p.user?.fullName ?? p.user?.name ?? 'Desconhecido',
    email: p.user?.email ?? null,
    productsCount: p._count?.products ?? 0,
    salesCount: p._count?.salesReceived ?? 0,
  })

  const personalsWithProductList = allPersonals.filter(p => (p._count?.products ?? 0) > 0).map(toPersonalRow)
  const personalsWithProduct     = personalsWithProductList.length
  const personalsWithSaleTotal   = allPersonals.filter(p => (p._count?.salesReceived ?? 0) > 0).length
  const personalsWithSale        = Object.keys(personalSalesMap).length

  const personalsWithSaleList: PersonalRow[] = Object.entries(personalSalesMap).map(([pid, s]) => {
    const found = allPersonals.find(p => p.id === pid)
    return { personalId: pid, personalName: s.name, email: found?.user?.email ?? null, productsCount: found?._count?.products ?? 0, salesCount: s.completed + s.scheduled + s.cancelled }
  })

  const allPurchasesInPeriod: Purchase[] = rawPurchases.map(p => ({
    id: p.id ?? '',
    studentName: p.student?.name ?? null,
    personalName: p.personal?.name ?? null,
    amount: Number(p.totalAmount ?? 0),
    status: p.status ?? 'UNKNOWN',
    createdAt: p.createdAt ?? null,
    paymentMethod: p.paymentMethod ?? null,
    planName: p.originalProduct?.name ?? null,
    billingType: p.billingType ?? null,
    recurrenceInterval: p.recurrenceInterval ?? null,
  }))

  // Personais inativos
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const inactivePersonals = allPersonals.filter(p => {
    if (!p.createdAt) return false
    const registered = new Date(p.createdAt) < thirtyDaysAgo
    const hasSaleInPeriod = p.id ? !!personalSalesMap[p.id] : false
    return registered && !hasSaleInPeriod
  }).length

  const activationRate  = totalPersonals > 0 ? (personalsWithProduct / totalPersonals) * 100 : 0
  const conversionRate  = totalPersonals > 0 ? (personalsWithSale / totalPersonals) * 100 : 0

  // Ratings
  const ratedPersonals      = allPersonals.filter(p => p.totalRatings && p.totalRatings > 0 && p.averageRating)
  const avgRating           = ratedPersonals.length > 0 ? ratedPersonals.reduce((sum, p) => sum + (p.averageRating ?? 0), 0) / ratedPersonals.length : 0
  const totalRatedPersonals = ratedPersonals.length

  // Top personais
  const topPersonals: TopPersonal[] = Object.entries(personalSalesMap)
    .map(([personalId, s]) => ({
      personalId,
      personalName: s.name,
      completedSales: s.completed,
      scheduledSales: s.scheduled,
      totalSales: s.completed + s.scheduled,
      cancelledSales: s.cancelled,
      grossRevenue: s.revenue,
      muvxRevenue: s.revenue * MUVX_FEE_PCT + s.completed * MUVX_FEE_FIXED,
    }))
    .sort((a, b) => b.grossRevenue - a.grossRevenue || b.totalSales - a.totalSales)
    .slice(0, 10)

  const recentPurchases: Purchase[] = rawPurchases.slice(0, 10).map(p => ({
    id: p.id ?? '',
    studentName: p.student?.name ?? null,
    personalName: p.personal?.name ?? null,
    amount: Number(p.totalAmount ?? 0),
    status: p.status ?? 'UNKNOWN',
    createdAt: p.createdAt ?? null,
    paymentMethod: p.paymentMethod ?? null,
    planName: p.originalProduct?.name ?? null,
    billingType: p.billingType ?? null,
    recurrenceInterval: p.recurrenceInterval ?? null,
  }))

  // unused but kept for type completeness
  void dayOfMonth

  const response: MetricsResponse = {
    fetchedAt: new Date().toISOString(),
    totalUsers, totalStudents, totalPersonals,
    periodStudents, periodPersonals,
    activeUsers, inactiveUsers,
    usersGrowthLastMonth, studentsGrowthLastMonth, personalsGrowthLastMonth,
    crefVerified, crefPending, crefApprovalRate,
    revenueInPeriod, muvxRevenue, purchasesTotal,
    completedSales, scheduledSales, scheduledRevenue, cancelledSales,
    avgTicket, ltv, salesVelocity, projectedMonthRevenue,
    purchasesByStatus, purchasesByStatusDetail, recentPurchases,
    recurringCount, oneTimeCount, recurringRevenue, oneTimeRevenue,
    paymentMethodBreakdown, recurrenceBreakdown,
    churnRate, inactivePersonals, activationRate,
    funnelRegistered: totalPersonals,
    funnelWithProduct: personalsWithProduct,
    funnelWithSale: personalsWithSale,
    avgRating, totalRatedPersonals,
    personalsWithProduct, personalsWithSale, personalsWithSaleTotal,
    personalsWithProductList, personalsWithSaleList, allPurchasesInPeriod,
    topPersonals, topStudents, topPlans,
    salesByWeekday, dailyHeatmap,
    conversionRate,
    errors,
  }

  return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } })
}
