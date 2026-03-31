'use client'

import { Users, UserCheck, DollarSign } from 'lucide-react'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { Header } from './Header'
import { StatCard } from './StatCard'
import { BarChartComponent } from './BarChartComponent'
import { ConversionRing } from './ConversionRing'
import { GoalGauge } from './GoalGauge'
import { PipelineBar } from './PipelineBar'
import { DataTable } from './DataTable'
import { StatCardSkeleton } from '@/components/ui/Skeleton'

const REVENUE_GOAL = Number(process.env.NEXT_PUBLIC_MUVX_GOAL ?? 50000)

export function DashboardClient() {
  const { data, isLoading, isError, lastUpdated, refresh } = useAutoRefresh()

  return (
    <div className="min-h-screen bg-background">
      <Header
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        onRefresh={refresh}
      />

      <main className="max-w-[1440px] mx-auto px-6 py-8 space-y-6">

        {/* Faixa de erro discreto se API falhar */}
        {isError && !data && (
          <div className="rounded-xl border border-status-error/20 bg-status-error/5 px-6 py-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-error flex-shrink-0" />
            <p className="text-sm font-sans text-status-error">
              Não foi possível conectar à API MUVX. Verifique as credenciais no .env.local.
            </p>
          </div>
        )}

        {data?.errors && data.errors.length > 0 && (
          <div className="rounded-xl border border-status-processing/20 bg-status-processing/5 px-6 py-3">
            <p className="text-xs font-sans text-status-processing">
              Alguns dados podem estar incompletos: {data.errors.join(' · ')}
            </p>
          </div>
        )}

        {/* Row 1 — Stat Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="KPIs principais">
          {isLoading && !data ? (
            <>
              <StatCardSkeleton dark />
              <StatCardSkeleton dark />
              <StatCardSkeleton dark />
            </>
          ) : (
            <>
              <StatCard
                dark
                label="Total de Alunos"
                value={data?.totalStudents ?? 0}
                delta={data?.studentsGrowthLastMonth}
                icon={<Users size={16} />}
                sublabel={`${data?.totalPersonals ?? 0} personais cadastrados`}
              />
              <StatCard
                dark
                label="Usuários Ativos"
                value={data?.activeUsers ?? 0}
                delta={data?.usersGrowthLastMonth}
                icon={<UserCheck size={16} />}
                sublabel={`${data?.inactiveUsers ?? 0} inativos`}
              />
              <StatCard
                dark
                label="Receita no Período"
                value={data?.revenueInPeriod ?? 0}
                format="currency"
                icon={<DollarSign size={16} />}
                sublabel={`${data?.purchasesTotal ?? 0} compras no mês`}
              />
            </>
          )}
        </section>

        {/* Row 2 — Gráficos */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Análises">
          <BarChartComponent
            purchasesByStatus={data?.purchasesByStatus ?? {}}
            isLoading={isLoading && !data}
          />
          <ConversionRing
            rate={data?.conversionRate ?? 0}
            isLoading={isLoading && !data}
          />
          <GoalGauge
            revenue={data?.revenueInPeriod ?? 0}
            goal={REVENUE_GOAL}
            isLoading={isLoading && !data}
          />
        </section>

        {/* Row 3 — Pipeline + Tabela */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Pipeline e transações">
          <PipelineBar
            purchasesByStatus={data?.purchasesByStatus ?? {}}
            totalPersonals={data?.totalPersonals ?? 0}
            crefPending={data?.crefPending ?? 0}
            isLoading={isLoading && !data}
          />
          <DataTable
            purchases={data?.recentPurchases ?? []}
            isLoading={isLoading && !data}
          />
        </section>

      </main>

      <footer className="text-center py-6">
        <p className="text-xs font-sans text-text-muted">
          MUVX Dashboard · Dados atualizados automaticamente a cada hora
        </p>
      </footer>
    </div>
  )
}
