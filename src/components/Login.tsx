import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

const LAST_EMAIL_KEY = 'pendencias:lastEmail'

type Mode = 'signin' | 'signup'

function initialEmail(): string {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

function rememberEmail(email: string) {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, email)
  } catch {
    // ignorar — localStorage pode estar desabilitado no Safari privativo
  }
}

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState<string>(initialEmail())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  function friendlyError(raw: string): string {
    const msg = raw.toLowerCase()
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return 'E-mail ou senha incorretos.'
    }
    if (msg.includes('email not confirmed')) {
      return 'Abra o e-mail de confirmação antes de entrar.'
    }
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already')) {
      return 'Esse e-mail já tem conta. Tente entrar.'
    }
    if (msg.includes('password') && msg.includes('6')) {
      return 'A senha precisa ter pelo menos 6 caracteres.'
    }
    if (msg.includes('rate limit') || msg.includes('too many')) {
      return 'Muitas tentativas. Espere um minuto e tente de novo.'
    }
    if (msg.includes('invalid email') || msg.includes('email address')) {
      return 'E-mail inválido.'
    }
    return raw || 'Não foi possível completar a operação.'
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const emailNormalizado = email.trim().toLowerCase()
    if (!emailNormalizado) {
      setError('Digite seu e-mail.')
      return
    }
    if (!password) {
      setError('Digite a senha.')
      return
    }

    setLoading(true)
    setError('')
    setInfo('')

    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: emailNormalizado,
          password,
        })
        if (err) {
          setError(friendlyError(err.message))
        } else {
          rememberEmail(emailNormalizado)
        }
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: emailNormalizado,
          password,
        })
        if (err) {
          setError(friendlyError(err.message))
        } else if (data.session) {
          // Confirmação de e-mail desligada — já está logado
          rememberEmail(emailNormalizado)
        } else {
          // Confirmação de e-mail ligada — espera clicar no link
          rememberEmail(emailNormalizado)
          setInfo(
            'Conta criada. Enviamos um link de confirmação para o seu e-mail — abra para ativar a conta e depois entre.',
          )
          setPassword('')
          setMode('signin')
        }
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string } | null)?.message ?? ''
      setError(friendlyError(msg))
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setError('')
    setInfo('')
  }

  const isSignup = mode === 'signup'

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
          <p className="text-sm text-slate-500 mt-1">
            {isSignup ? 'Crie sua conta para começar.' : 'Entre com seu e-mail e senha.'}
          </p>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          autoComplete="email"
          autoCapitalize="off"
          autoCorrect="off"
          inputMode="email"
          autoFocus={!email}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isSignup ? 'Senha (mínimo 6 caracteres)' : 'Senha'}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          autoFocus={!!email}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        {error && <div className="text-sm text-rose-500">{error}</div>}
        {info && (
          <div className="text-sm text-emerald-600 dark:text-emerald-400">{info}</div>
        )}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full rounded-lg bg-cyan-600 text-white py-3 font-medium disabled:opacity-50"
        >
          {loading
            ? isSignup
              ? 'Criando…'
              : 'Entrando…'
            : isSignup
              ? 'Criar conta'
              : 'Entrar'}
        </button>
        <button
          type="button"
          onClick={toggleMode}
          className="w-full text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-4"
        >
          {isSignup ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
        </button>
      </form>
    </div>
  )
}
