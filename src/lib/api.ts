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

export async function muvxGet<T>(path: string, token: string): Promise<T | null> {
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
