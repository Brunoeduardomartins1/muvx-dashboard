'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.message ?? 'Senha incorreta')
        setPassword('')
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      <div
        className="w-full max-w-sm rounded-card p-8"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Logo / título */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(8,248,135,0.1)', border: '1px solid rgba(8,248,135,0.3)' }}
          >
            <Lock size={22} style={{ color: '#08F887' }} />
          </div>
          <h1 className="font-grotesk font-700 text-xl" style={{ color: 'var(--text-primary)' }}>
            MUVX Dashboard
          </h1>
          <p className="text-xs font-sans mt-1" style={{ color: 'var(--text-muted)' }}>
            Acesso restrito · insira a senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo senha */}
          <div className="relative">
            <input
              ref={inputRef}
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              autoFocus
              autoComplete="current-password"
              className="w-full px-4 py-3 pr-10 rounded-xl text-sm font-sans outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-page)',
                border: error ? '1px solid #EF4444' : '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              onFocus={e => { if (!error) e.currentTarget.style.borderColor = '#08F887' }}
              onBlur={e => { e.currentTarget.style.borderColor = error ? '#EF4444' : 'var(--border-color)' }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
              tabIndex={-1}
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Erro */}
          {error && (
            <p className="text-xs font-sans text-center" style={{ color: '#EF4444' }}>
              {error}
            </p>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl text-sm font-sans font-700 transition-all duration-150 disabled:opacity-50"
            style={{ backgroundColor: '#08F887', color: '#0A0C10' }}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
