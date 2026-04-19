import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase, APP_EMAIL } from '../lib/supabase'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!APP_EMAIL) {
      setError('Configuração ausente: defina VITE_APP_EMAIL no .env.')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({
      email: APP_EMAIL,
      password,
    })
    if (err) setError('Senha incorreta.')
    setLoading(false)
  }

  return (
    <div className="flex h-full items-center justify-center p-6 safe-top safe-bottom">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center">
            <svg viewBox="0 0 64 64" className="h-8 w-8">
              <path
                d="M18 32 L28 42 L46 22"
                stroke="#22d3ee"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold">Painel de Controle Pessoal</h1>
          <p className="text-sm text-slate-500 mt-1">Acesso restrito.</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          autoFocus
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        {error && <div className="text-sm text-rose-500">{error}</div>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-cyan-600 text-white py-3 font-medium disabled:opacity-50"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
