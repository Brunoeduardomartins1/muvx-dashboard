import { getMuvxToken, muvxGet } from '@/lib/api'

interface RawPersonal {
  id?: string
  createdAt?: string
  user?: { fullName?: string; name?: string; email?: string }
  _count?: { products?: number; salesReceived?: number }
}

interface AdminPersonalsResponse {
  data?: RawPersonal[]
  meta?: { total?: number; totalPages?: number }
}

interface ActivationStep { completed?: boolean }
interface ActivationResponse {
  steps?: {
    firstProductCreated?: ActivationStep
    firstStudentInvited?: ActivationStep
    firstTransactionGenerated?: ActivationStep
  }
}

export interface NewPersonalActivation {
  id: string
  name: string
  createdAt: string
  email: string | null
  hasProduct: boolean
  hasStudent: boolean
  hasSale: boolean
}

/**
 * Lista todos os personais cadastrados em [fromISO, toISO] e classifica cada um
 * com flags de ativação (produto / aluno / venda) via /admin/activation-indicators.
 */
export async function fetchNewPersonalsWithActivation(fromISO: string, toISO: string): Promise<NewPersonalActivation[]> {
  const token = await getMuvxToken()

  const fromQ = encodeURIComponent(fromISO)
  const toQ = encodeURIComponent(toISO)

  // Página 1
  const first = await muvxGet<AdminPersonalsResponse>(
    `/admin/personals?limit=100&page=1&createdFrom=${fromQ}&createdTo=${toQ}`,
    token,
  )
  const totalPages = first?.meta?.totalPages ?? 1
  let all = first?.data ?? []

  for (let p = 2; p <= totalPages; p++) {
    const page = await muvxGet<AdminPersonalsResponse>(
      `/admin/personals?limit=100&page=${p}&createdFrom=${fromQ}&createdTo=${toQ}`,
      token,
    )
    if (page?.data) all = all.concat(page.data)
  }

  // Classifica em paralelo (concorrência 6 para caber em 60s)
  const concurrency = 6
  const results: NewPersonalActivation[] = []
  let idx = 0

  async function worker() {
    while (idx < all.length) {
      const i = idx++
      const p = all[i]
      if (!p?.id) continue
      try {
        const ind = await muvxGet<ActivationResponse>(
          `/admin/activation-indicators/personal/${p.id}`,
          token,
        )
        const s = ind?.steps ?? {}
        results.push({
          id: p.id,
          name: p.user?.fullName ?? p.user?.name ?? '—',
          createdAt: p.createdAt ?? '',
          email: p.user?.email ?? null,
          hasProduct: !!s.firstProductCreated?.completed,
          hasStudent: !!s.firstStudentInvited?.completed,
          hasSale: !!s.firstTransactionGenerated?.completed || (p._count?.salesReceived ?? 0) > 0,
        })
      } catch {
        // Em caso de falha, conta como "só cadastrado" (conservador)
        results.push({
          id: p.id,
          name: p.user?.fullName ?? p.user?.name ?? '—',
          createdAt: p.createdAt ?? '',
          email: p.user?.email ?? null,
          hasProduct: (p._count?.products ?? 0) > 0,
          hasStudent: false,
          hasSale: (p._count?.salesReceived ?? 0) > 0,
        })
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  // Ordena por createdAt asc (mais antigos primeiro)
  results.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return results
}
