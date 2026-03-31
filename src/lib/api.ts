const BASE = process.env.MUVX_API_BASE ?? 'https://api.muvx.app'

interface TokenCache {
  token: string
  expiresAt: number
}

let _tokenCache: TokenCache | null = null

export async function getMuvxToken(): Promise<string> {
  // 1. Cache em memória com margem de 60s
  if (_tokenCache && _tokenCache.expiresAt > Date.now() + 60_000) {
    return _tokenCache.token
  }

  // 2. Token fixo via env var (para ambientes sem login dinâmico)
  if (process.env.MUVX_API_TOKEN) {
    const token = process.env.MUVX_API_TOKEN
    _tokenCache = { token, expiresAt: Date.now() + 23 * 3600 * 1000 }
    return token
  }

  // 3. Login dinâmico com credenciais admin
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

  _tokenCache = { token, expiresAt: Date.now() + 23 * 3600 * 1000 }
  return token
}

export async function muvxGet<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    })

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
