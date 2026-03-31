'use client'

import { Users, UserCheck, DollarSign, TrendingUp, XCircle, Clock, Package, ShoppingCart, Percent } from 'lucide-react'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { Header } from './Header'
import { StatCard } from './StatCard'
import { BarChartComponent } from './BarChartComponent'
import { ConversionRing } from './ConversionRing'
import { GoalGauge } from './GoalGauge'
import { PipelineBar } from './PipelineBar'
import { DataTable } from './DataTable'
import { TopPersonais } from './TopPersonais'
import { StatCardSkeleton } from '@/components/ui/Skeleton'

const REVENUE_GOAL = Number(process.env.NEXT_PUBLIC_MUVX_GOAL ?? 50000)

export function DashboardClient() {
  const { data, isLoading, isError, lastUpdated, refresh } = useAutoRefresh()

  const showSkeletons = isLoading && !data

  return (
    <div className="min-h-screen transition-colors duration-250" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Header lastUpdated={lastUpdated} isLoading={isLoading} onRefresh={refresh} />

      <main className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">

        {/* Erro de conexão */}
        {isError && !data && (
          <div
            className="rounded-xl px-6 py-3 flex items-center gap-2"
            style={{ border: '1px solid rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)' }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#EF4444' }} />
            <p className="text-sm font-sans" style={{ color: '#EF4444' }}>
              Não foi possível conectar à API MUVX. Verifique as variáveis de ambiente.
            </p>
          </div>
        )}

        {/* Avisos de endpoints parcialmente indisponíveis */}
        {data?.errors && data.errors.length > 0 && (
          <div
            className="rounded-xl px-6 py-3"
            style={{ border: '1px solid rgba(245,158,11,0.2)', backgroundColor: 'rgba(245,158,11,0.05)' }}
          >
            <p className="text-xs font-sans" style={{ color: '#F59E0B' }}>
              Dados parciais: {data.errors.join(' · ')}
            </p>
          </div>
        )}

        {/* Row 1 — Usuários e Alunos */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Usuários">
          {showSkeletons ? (
            <><StatCardSkeleton dark /><StatCardSkeleton dark /><StatCardSkeleton dark /></>
          ) : (
            <>
              <StatCard
                dark
                label="Total de Alunos"
                value={data?.totalStudents ?? 0}
                delta={data?.studentsGrowthLastMonth}
                icon={<Users size={16} />}
              />
              <StatCard
                dark
                label="Total de Personais"
                value={data?.totalPersonals ?? 0}
                delta={data?.personalsGrowthLastMonth}
                icon={<UserCheck size={16} />}
                sublabel={`${data?.crefPending ?? 0} CREF pendentes`}
              />
              <StatCard
                dark
                label="Total Geral de Usuários"
                value={data?.totalUsers ?? 0}
                delta={data?.usersGrowthLastMonth}
                icon={<Users size={16} />}
                sublabel={`${data?.activeUsers ?? 0} ativos · ${data?.inactiveUsers ?? 0} inativos`}
              />
            </>
          )}
        </section>

        {/* Row 2 — Engajamento de Personais */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Engajamento de personais">
          {showSkeletons ? (
            <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
          ) : (
            <>
              <StatCard
                label="Personais com Produto"
                value={data?.personalsWithProduct ?? 0}
                icon={<Package size={16} />}
                sublabel="cadastraram ao menos 1 produto"
              />
              <StatCard
                label="Personais com Venda"
                value={data?.personalsWithSale ?? 0}
                icon={<ShoppingCart size={16} />}
                sublabel="realizaram ao menos 1 venda"
              />
              <StatCard
                label="Conversão de Personais"
                value={data?.conversionRate ?? 0}
                format="number"
                icon={<Percent size={16} />}
                sublabel={`${data?.personalsWithSale ?? 0} de ${data?.totalPersonals ?? 0} personais venderam`}
              />
            </>
          )}
        </section>

        {/* Row 3 — Vendas e Financeiro */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Vendas e financeiro">
          {showSkeletons ? (
            <><StatCardSkeleton dark /><StatCardSkeleton dark /><StatCardSkeleton dark /><StatCardSkeleton dark /></>
          ) : (
            <>
              <StatCard
                dark
                label="Vendas Realizadas"
                value={data?.completedSales ?? 0}
                icon={<TrendingUp size={16} />}
                sublabel={`${data?.purchasesTotal ?? 0} total de compras`}
              />
              <StatCard
                dark
                label="Ag. Data Pagamento"
                value={data?.scheduledSales ?? 0}
                icon={<Clock size={16} />}
                sublabel="aguardando vencimento"
              />
              <StatCard
                dark
                label="Vendas Canceladas"
                value={data?.cancelledSales ?? 0}
                icon={<XCircle size={16} />}
              />
              <StatCard
                dark
                label="Vendas Transacionadas"
                value={data?.revenueInPeriod ?? 0}
                format="currency"
                icon={<DollarSign size={16} />}
                sublabel={`Fat. MUVX: R$ ${((data?.muvxRevenue ?? 0)).toFixed(2).replace('.', ',')}`}
              />
            </>
          )}
        </section>

        {/* Row 4 — Gráficos */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Análises">
          <BarChartComponent
            purchasesByStatus={data?.purchasesByStatus ?? {}}
            isLoading={showSkeletons}
          />
          <ConversionRing
            rate={data?.conversionRate ?? 0}
            isLoading={showSkeletons}
          />
          <GoalGauge
            revenue={data?.revenueInPeriod ?? 0}
            goal={REVENUE_GOAL}
            isLoading={showSkeletons}
          />
        </section>

        {/* Row 5 — Pipeline + Tabela */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Pipeline e transações">
          <PipelineBar
            purchasesByStatus={data?.purchasesByStatus ?? {}}
            totalPersonals={data?.totalPersonals ?? 0}
            crefPending={data?.crefPending ?? 0}
            isLoading={showSkeletons}
          />
          <DataTable
            purchases={data?.recentPurchases ?? []}
            isLoading={showSkeletons}
          />
        </section>

        {/* Row 6 — Top Personais */}
        <section aria-label="Top personais">
          <TopPersonais
            topPersonals={data?.topPersonals ?? []}
            isLoading={showSkeletons}
          />
        </section>

      </main>

      <footer className="text-center py-6">
        <p className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
          MUVX Dashboard · Atualização automática a cada hora
        </p>
      </footer>
    </div>
  )
}
