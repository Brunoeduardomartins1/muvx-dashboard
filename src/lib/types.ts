export interface Purchase {
  id: string
  studentName: string | null
  personalName: string | null
  amount: number
  status: string
  createdAt: string | null
  paymentMethod: string | null
  planName: string | null
  billingType: string | null
  recurrenceInterval: string | null
}

export interface PersonalRow {
  personalId: string
  personalName: string
  email: string | null
  productsCount: number
  salesCount: number
}

export interface TopPersonal {
  personalId: string
  personalName: string
  completedSales: number
  scheduledSales: number
  totalSales: number
  cancelledSales: number
  grossRevenue: number
  muvxRevenue: number
}

export interface TopStudent {
  studentId: string
  studentName: string
  totalSpent: number
  purchasesCount: number
}

export interface TopPlan {
  planName: string
  count: number
  revenue: number
}

export interface WeekdaySales {
  day: string
  count: number
  revenue: number
}

export interface DailyHeatmapPoint {
  date: string   // 'YYYY-MM-DD'
  count: number
  revenue: number
}

export interface MetricsResponse {
  fetchedAt: string

  totalUsers: number
  totalStudents: number
  totalPersonals: number

  periodStudents: number
  periodPersonals: number

  activeUsers: number
  inactiveUsers: number

  usersGrowthLastMonth: number
  studentsGrowthLastMonth: number
  personalsGrowthLastMonth: number

  crefVerified: number
  crefPending: number
  crefApprovalRate: number

  revenueInPeriod: number
  muvxRevenue: number
  purchasesTotal: number
  completedSales: number
  scheduledSales: number
  scheduledRevenue: number
  cancelledSales: number
  avgTicket: number
  ltv: number
  salesVelocity: number
  projectedMonthRevenue: number

  purchasesByStatus: Record<string, number>
  purchasesByStatusDetail: Record<string, Purchase[]>
  recentPurchases: Purchase[]

  recurringCount: number
  oneTimeCount: number
  recurringRevenue: number
  oneTimeRevenue: number
  paymentMethodBreakdown: Record<string, number>
  recurrenceBreakdown: Record<string, number>

  churnRate: number
  inactivePersonals: number
  activationRate: number

  funnelRegistered: number
  funnelWithProduct: number
  funnelWithSale: number

  avgRating: number
  totalRatedPersonals: number

  personalsWithProduct: number
  personalsWithSale: number
  personalsWithSaleTotal: number
  personalsWithProductList: PersonalRow[]
  personalsWithSaleList: PersonalRow[]
  allPurchasesInPeriod: Purchase[]

  topPersonals: TopPersonal[]
  topStudents: TopStudent[]
  topPlans: TopPlan[]

  salesByWeekday: WeekdaySales[]
  dailyHeatmap: DailyHeatmapPoint[]

  conversionRate: number
  errors: string[]
}

export type MetricsError = {
  message: string
  code?: number
}
