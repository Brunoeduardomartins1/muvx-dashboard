const BASE = process.env.MUVX_API_BASE ?? 'https://api.muvx.app'

interface TokenCache {
  token: string
  expiresAt: number
  fromEnvVar: boolean
}

let _tokenCache: TokenCache | null = null

async function loginAdmin(): Promise<string> {
  const email = process.env.MUVX_EMAIL
  const password = process.env.MUVX_PASSWORD
  if (!email || !password) {
    throw new Error('Credenciais MUVX não configuradas. Defina MUVX_EMAIL e MUVX_PASSWORD no .env.local')
  }

  const res = await fetch(`${BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: email,
      password,
      loginType: 'NORMAL',
      deviceInfo: { deviceFid: 'muvx-dashboard' },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Falha no login admin MUVX: ${res.status} ${body}`)
  }

  const json = await res.json()
  const token =
    json?.data?.tokens?.accessToken ??
    json?.data?.accessToken ??
    json?.accessToken

  if (!token) {
    throw new Error(`Token não encontrado na resposta de login: ${JSON.stringify(json).slice(0, 200)}`)
  }

  return token
}

export async function getMuvxToken(forceRefresh = false): Promise<string> {
  // 1. Cache em memória com margem de 60s (skip se forceRefresh)
  if (!forceRefresh && _tokenCache && _tokenCache.expiresAt > Date.now() + 60_000) {
    return _tokenCache.token
  }

  // 2. Token fixo via env var (apenas se não forçando refresh)
  if (!forceRefresh && process.env.MUVX_API_TOKEN) {
    const token = process.env.MUVX_API_TOKEN
    _tokenCache = { token, expiresAt: Date.now() + 23 * 3600 * 1000, fromEnvVar: true }
    return token
  }

  // 3. Login dinâmico com credenciais admin
  const token = await loginAdmin()
  _tokenCache = { token, expiresAt: Date.now() + 23 * 3600 * 1000, fromEnvVar: false }
  return token
}

// ── Pagar.me ────────────────────────────────────────────────────────────────

const PAGARME_BASE = 'https://api.pagar.me/core/v5'
// Recipient ID da ASSUMFIT/MUVX no Pagar.me — saques da própria plataforma, não repasse
const PAGARME_MUVX_RECIPIENT_ID = 're_cme2x6m46560l0l9txosl5o9x'

// Pagar.me whitelist é por IPv4. Em Node, precisamos forçar família IPv4
// para que a requisição saia do IP que foi liberado no painel.
// Criamos um agente HTTPS com option `family: 4`.
import https from 'https'
const pagarmeAgent = new https.Agent({ family: 4, keepAlive: true })

function getPagarmeAuth(): string {
  const key = process.env.PAGARME_SECRET_KEY
  if (!key) throw new Error('PAGARME_SECRET_KEY não configurada no .env.local')
  return 'Basic ' + Buffer.from(key + ':').toString('base64')
}

// Node fetch não aceita agent diretamente; precisamos usar a extensão de runtime.
// Opção mais simples: wrapper que usa https.request diretamente.
async function pagarmeFetch(url: string, auth: string): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers: { Authorization: auth, 'User-Agent': 'muvx-dashboard' },
      agent: pagarmeAgent,
    }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8')
        resolve({
          ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
          status: res.statusCode ?? 0,
          json: async () => {
            try { return JSON.parse(body) } catch { return null }
          },
        })
      })
    })
    req.on('error', reject)
    req.end()
  })
}

export interface PagarmeTransfer {
  id: number
  amount: number          // em centavos
  status: string          // 'transferred' | 'failed' | 'pending' | 'canceled'
  source_id: string       // recipient_id de origem
  date_created: string    // ISO
  bank_account?: { legal_name?: string }
}

/**
 * Busca todos os transfers efetivados do Pagar.me num intervalo de datas.
 * Retorna SEPARADOS:
 *  - personalTransfers: repasses aos personais (source_id ≠ recipient MUVX)
 *  - muvxTransfers: saques para a conta da própria plataforma (source_id = recipient MUVX)
 *
 * O total de muvxTransfers é a RECEITA REAL da MUVX (dinheiro que de fato entrou no banco).
 * Não confundir com estimativas teóricas baseadas no GMV.
 */
export interface PagarmeTransferSplit {
  personalTransfers: PagarmeTransfer[]
  muvxTransfers: PagarmeTransfer[]
}

export async function getPagarmeTransfersSplit(fromDate: string, toDate: string): Promise<PagarmeTransferSplit> {
  let auth: string
  try { auth = getPagarmeAuth() } catch { return { personalTransfers: [], muvxTransfers: [] } }

  const from = encodeURIComponent(fromDate + 'T00:00:00Z')
  const to   = encodeURIComponent(toDate   + 'T23:59:59Z')

  const allTransfers: PagarmeTransfer[] = []
  let page = 1

  // Pagar.me ignora `size` e retorna ~10 por página. Paginamos até página vazia.
  const MAX_PAGES = 50
  while (page <= MAX_PAGES) {
    const url = `${PAGARME_BASE}/transfers?size=100&page=${page}&created_since=${from}&created_until=${to}`
    try {
      const res = await pagarmeFetch(url, auth)
      if (!res.ok) break
      const data = await res.json() as PagarmeTransfer[] | { data?: PagarmeTransfer[] }
      const arr: PagarmeTransfer[] = Array.isArray(data) ? data : (data?.data ?? [])
      if (!arr.length) break
      allTransfers.push(...arr)
      page++
    } catch {
      break
    }
  }

  // O filtro created_since/until da Pagar.me nem sempre é respeitado.
  // Refiltramos no client para garantir aderência ao período pedido.
  const fromMs = new Date(fromDate + 'T00:00:00Z').getTime()
  const toMs   = new Date(toDate   + 'T23:59:59.999Z').getTime()
  const inRange = (t: PagarmeTransfer) => {
    const ts = new Date(t.date_created).getTime()
    return ts >= fromMs && ts <= toMs
  }
  const transferred = allTransfers.filter(t => t.status === 'transferred' && inRange(t))
  return {
    personalTransfers: transferred.filter(t => t.source_id !== PAGARME_MUVX_RECIPIENT_ID),
    muvxTransfers:     transferred.filter(t => t.source_id === PAGARME_MUVX_RECIPIENT_ID),
  }
}

// ── Payables (recebíveis) ──
// Cada payable é um crédito para a MUVX, JÁ LÍQUIDO das taxas do gateway.
// status: 'paid' (disponível na conta) | 'waiting_funds' (aguardando liberação) | 'prepaid'
export interface PagarmePayable {
  id: number
  status: 'paid' | 'waiting_funds' | 'prepaid' | string
  amount: number              // em centavos — valor LÍQUIDO que cabe à MUVX
  fee: number                 // taxa do Pagar.me (já descontada do amount, mostrada para referência)
  anticipation_fee: number
  fraud_coverage_fee: number
  gateway_id: number
  charge_id: string
  recipient_id: string
  payment_date: string        // ISO — data em que o valor fica disponível
  accrual_at: string          // ISO — data em que o payable foi reconhecido
  payment_method: 'pix' | 'credit_card' | 'boleto' | string
  type: 'credit' | 'refund' | string
}

/**
 * Busca todos os payables (recebíveis) da MUVX no período, líquidos de taxas.
 * Filtra por accrual_at (data de reconhecimento contábil).
 */
export async function getMuvxPayables(fromDate: string, toDate: string): Promise<PagarmePayable[]> {
  let auth: string
  try { auth = getPagarmeAuth() } catch { return [] }

  const all: PagarmePayable[] = []
  let page = 1
  const MAX_PAGES = 50
  while (page <= MAX_PAGES) {
    const url = `${PAGARME_BASE}/payables?size=100&page=${page}&recipient_id=${PAGARME_MUVX_RECIPIENT_ID}`
    try {
      const res = await pagarmeFetch(url, auth)
      if (!res.ok) break
      const data = await res.json() as PagarmePayable[] | { data?: PagarmePayable[] }
      const arr: PagarmePayable[] = Array.isArray(data) ? data : (data?.data ?? [])
      if (!arr.length) break
      all.push(...arr)
      page++
    } catch {
      break
    }
  }

  // Filtrar por accrual_at (data em que o payable foi contabilizado)
  const fromMs = new Date(fromDate + 'T00:00:00Z').getTime()
  const toMs   = new Date(toDate   + 'T23:59:59.999Z').getTime()
  return all.filter(p => {
    const ts = new Date(p.accrual_at).getTime()
    return ts >= fromMs && ts <= toMs
  })
}

// ── Balance (saldo da conta MUVX no Pagar.me) ──
export interface PagarmeBalance {
  currency: string
  available_amount: number      // em centavos — disponível para transferir
  waiting_funds_amount: number  // em centavos — aguardando liberação
  transferred_amount: number    // em centavos — histórico transferido
}

export async function getMuvxBalance(): Promise<PagarmeBalance | null> {
  let auth: string
  try { auth = getPagarmeAuth() } catch { return null }
  try {
    const url = `${PAGARME_BASE}/recipients/${PAGARME_MUVX_RECIPIENT_ID}/balance`
    const res = await pagarmeFetch(url, auth)
    if (!res.ok) return null
    const data = await res.json() as { currency?: string; available_amount?: number; waiting_funds_amount?: number; transferred_amount?: number } | null
    if (!data) return null
    return {
      currency: data.currency ?? 'BRL',
      available_amount: data.available_amount ?? 0,
      waiting_funds_amount: data.waiting_funds_amount ?? 0,
      transferred_amount: data.transferred_amount ?? 0,
    }
  } catch {
    return null
  }
}

/**
 * @deprecated Use getPagarmeTransfersSplit. Mantido para compatibilidade.
 */
export async function getPagarmePersonalTransfers(fromDate: string, toDate: string): Promise<PagarmeTransfer[]> {
  const split = await getPagarmeTransfersSplit(fromDate, toDate)
  return split.personalTransfers
}

export async function muvxGet<T>(path: string, token: string, retryCount = 0): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    })

    // Token expirado: tenta renovar via login dinâmico e repete
    if (res.status === 401) {
      console.warn(`[muvx] GET ${path} → 401, renovando token...`)
      _tokenCache = null
      const newToken = await getMuvxToken(true)
      const retry = await fetch(`${BASE}${path}`, {
        headers: { Authorization: `Bearer ${newToken}` },
        next: { revalidate: 0 },
      })
      if (!retry.ok) {
        console.warn(`[muvx] GET ${path} → ${retry.status} após renovação`)
        return null
      }
      const json = await retry.json()
      return (json?.data ?? json) as T
    }

    // Rate limit: backoff exponencial (até 3 tentativas)
    if (res.status === 429 && retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 500
      console.warn(`[muvx] GET ${path} → 429, aguardando ${Math.round(delay)}ms (tentativa ${retryCount + 1})`)
      await new Promise(r => setTimeout(r, delay))
      return muvxGet<T>(path, token, retryCount + 1)
    }

    if (!res.ok) {
      console.warn(`[muvx] GET ${path} → ${res.status}`)
      return null
    }

    const json = await res.json()
    return (json?.data ?? json) as T
  } catch (err) {
    console.warn(`[muvx] GET ${path} → erro:`, err)
    return null
  }
}
