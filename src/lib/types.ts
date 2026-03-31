export interface Purchase {
  id: string
  studentName: string | null
  personalName: string | null
  amount: number
  status: string
  createdAt: string | null
  paymentMethod: string | null
  planName: string | null
}

export interface MetricsResponse {
  fetchedAt: string

  // Totais
  totalUsers: number
  totalStudents: number
  totalPersonals: number

  // Usuários ativos/inativos
  activeUsers: number
  inactiveUsers: number

  // Crescimento vs mês anterior
  usersGrowthLastMonth: number
  studentsGrowthLastMonth: number
  personalsGrowthLastMonth: number

  // CREF
  crefVerified: number
  crefPending: number

  // Financeiro (período atual = mês corrente)
  revenueInPeriod: number
  purchasesTotal: number
  purchasesByStatus: Record<string, number>
  recentPurchases: Purchase[]

  // Derivados
  conversionRate: number  // activeUsers / totalStudents * 100

  // Erros parciais (endpoints que falharam)
  errors: string[]
}

export type MetricsError = {
  message: string
  code?: number
}
