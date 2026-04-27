'use client'

import dynamic from 'next/dynamic'
import { Activity, Users, UserCheck, UserX, Target, TrendingUp, Calendar, BarChart2 } from 'lucide-react'
import { StatCard } from './StatCard'
import { Skeleton, StatCardSkeleton, ChartSkeleton } from '@/components/ui/Skeleton'
import { fmtNum } from '@/lib/utils'
import type { CheckinsData } from '@/lib/types'

const CheckinsDayChartInner  = dynamic(() => import('./CheckinsDayChartInner'),  { ssr: false })
const CheckinsHistoryInner   = dynamic(() => import('./CheckinsHistoryInner'),   { ssr: false })

interface Props {
  data: CheckinsData | null
  isLoading?: boolean
}

export function CheckinsSection({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-6 w-40" />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>

        {/* Engagement */}
        <div className="grid grid-cols-2 gap-4 mb-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </section>
    )
  }

  if (!data) return null

  const { checkinSummary, studentEngagement, weeklyGoalAchievement, topActivities, dayOfWeekDistribution, dailyHistory } = data

  const hasActivity = checkinSummary.period > 0 || checkinSummary.last30Days > 0

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(8,248,135,0.1)', color: '#08F887' }}>
          <Activity size={16} />
        </div>
        <h2 className="font-grotesk font-700 text-xl" style={{ color: 'var(--text-primary)' }}>
          Engajamento & Check-ins
        </h2>
      </div>

      {/* Check-in Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4 lg:grid-cols-4">
        <StatCard
          label="Check-ins hoje"
          value={checkinSummary.today}
          icon={<Activity size={16} />}
        />
        <StatCard
          label="Últimos 7 dias"
          value={checkinSummary.last7Days}
          icon={<Calendar size={16} />}
        />
        <StatCard
          label="Últimos 30 dias"
          value={checkinSummary.last30Days}
          icon={<BarChart2 size={16} />}
        />
        <StatCard
          label="No período"
          value={checkinSummary.period}
          icon={<TrendingUp size={16} />}
        />
      </div>

      {/* Student Engagement */}
      <div className="grid grid-cols-2 gap-4 mb-4 lg:grid-cols-3">
        <StatCard
          label="Alunos totais"
          value={studentEngagement.totalStudents}
          icon={<Users size={16} />}
        />
        <StatCard
          label="Alunos ativos"
          value={studentEngagement.activeStudents}
          sublabel={`${fmtNum(studentEngagement.activePercentage)}% do total`}
          icon={<UserCheck size={16} />}
        />
        <StatCard
          label="Alunos inativos"
          value={studentEngagement.inactiveStudents}
          icon={<UserX size={16} />}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 lg:grid-cols-3">
        <StatCard
          label="Novos alunos no período"
          value={studentEngagement.newStudents}
          icon={<Users size={16} />}
        />
        <StatCard
          label="Média check-ins/aluno"
          value={studentEngagement.averageCheckinsPerStudent}
          icon={<Activity size={16} />}
        />
        <StatCard
          label="Meta semanal atingida"
          value={weeklyGoalAchievement.studentsWhoMetGoal}
          sublabel={`de ${fmtNum(weeklyGoalAchievement.totalStudentsWithGoal)} alunos — ${fmtNum(weeklyGoalAchievement.achievementRate)}%`}
          icon={<Target size={16} />}
        />
      </div>

      {/* Charts */}
      {hasActivity ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Distribuição por dia da semana */}
          <div className="card rounded-card p-8">
            <div className="mb-6">
              <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
                Check-ins por Dia da Semana
              </h3>
              <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Distribuição dos check-ins no período
              </p>
            </div>
            <div style={{ height: 160 }}>
              <CheckinsDayChartInner data={dayOfWeekDistribution} />
            </div>
          </div>

          {/* Histórico diário */}
          <div className="card rounded-card p-8">
            <div className="mb-6">
              <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
                Histórico Diário de Check-ins
              </h3>
              <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Série temporal no período selecionado
              </p>
            </div>
            <div style={{ height: 160 }}>
              <CheckinsHistoryInner data={dailyHistory} />
            </div>
          </div>
        </div>
      ) : (
        <div className="card rounded-card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <Activity size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-sans text-sm">Nenhum check-in registrado no período</p>
          <p className="font-sans text-xs mt-1 opacity-70">Os dados aparecerão aqui conforme os alunos utilizarem o app</p>
        </div>
      )}

      {/* Top atividades */}
      {topActivities.length > 0 && (
        <div className="card rounded-card p-8 mt-4">
          <div className="mb-6">
            <h3 className="font-grotesk font-700 text-base" style={{ color: 'var(--text-primary)' }}>
              Top Atividades
            </h3>
            <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Modalidades mais praticadas no período
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {topActivities.map((act, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-grotesk font-700 text-sm w-5 text-right" style={{ color: '#08F887' }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-sans text-sm" style={{ color: 'var(--text-primary)' }}>
                      {act.activity}
                    </span>
                    <span className="font-grotesk font-700 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {fmtNum(act.count)}
                    </span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 4, backgroundColor: 'var(--border-color)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${act.percentage}%`,
                        backgroundColor: '#08F887',
                        opacity: 0.7 + (0.3 * (1 - i / topActivities.length)),
                      }}
                    />
                  </div>
                </div>
                <span className="font-sans text-xs w-10 text-right" style={{ color: 'var(--text-muted)' }}>
                  {fmtNum(act.percentage)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
