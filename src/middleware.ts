import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'dash_session'
const SECRET = process.env.DASHBOARD_SECRET ?? ''

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Sempre libera: login page e login API
  if (pathname === '/login' || pathname === '/api/auth/login') {
    return NextResponse.next()
  }

  // Cron jobs: middleware roda em Edge runtime e não tem acesso confiável a process.env
  // de variáveis privadas. A verificação do CRON_SECRET acontece dentro da própria rota
  // (que roda em Node runtime). Aqui só liberamos passagem.
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next()
  }

  // Verifica cookie de sessão
  const session = req.cookies.get(SESSION_COOKIE)?.value
  if (session && SECRET && session === SECRET) {
    return NextResponse.next()
  }

  // Redireciona para login (API routes retornam 401)
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
  }

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
