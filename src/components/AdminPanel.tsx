import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

type Props = {
  currentUserId: string
}

export default function AdminPanel({ currentUserId }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'pendentes' | 'aprovados'>('pendentes')

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('criado_em', { ascending: false })
    if (error) {
      setError('Erro ao carregar usuários: ' + error.message)
    } else if (data) {
      setProfiles(data as Profile[])
    }
    setLoading(false)
  }

  async function aprovar(p: Profile) {
    setActing(p.user_id)
    setError(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        aprovado: true,
        aprovado_em: new Date().toISOString(),
        aprovado_por: currentUserId,
      })
      .eq('user_id', p.user_id)
    if (error) {
      setError('Erro ao aprovar: ' + error.message)
    } else {
      await fetchProfiles()
    }
    setActing(null)
  }

  async function revogar(p: Profile) {
    if (p.user_id === currentUserId) return
    if (!confirm(`Revogar acesso de ${p.email ?? 'usuário'}?`)) return
    setActing(p.user_id)
    setError(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        aprovado: false,
        aprovado_em: null,
        aprovado_por: null,
      })
      .eq('user_id', p.user_id)
    if (error) {
      setError('Erro ao revogar: ' + error.message)
    } else {
      await fetchProfiles()
    }
    setActing(null)
  }

  async function rejeitar(p: Profile) {
    if (p.user_id === currentUserId) return
    if (
      !confirm(
        `Rejeitar e remover ${p.email ?? 'usuário'}? Isso apaga o registro de perfil. O usuário continuará existindo em auth.users até você remover pelo painel do Supabase.`,
      )
    )
      return
    setActing(p.user_id)
    setError(null)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', p.user_id)
    if (error) {
      setError('Erro ao rejeitar: ' + error.message)
    } else {
      await fetchProfiles()
    }
    setActing(null)
  }

  const pendentes = profiles.filter((p) => !p.aprovado)
  const aprovados = profiles.filter((p) => p.aprovado)
  const lista = tab === 'pendentes' ? pendentes : aprovados

  function fmtData(d: string | null): string {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return d
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold flex-1">Usuários</h2>
        <button
          onClick={fetchProfiles}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-4"
          disabled={loading}
        >
          {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      <nav className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-900 p-0.5 text-sm">
        <button
          onClick={() => setTab('pendentes')}
          className={`px-3 py-1 rounded-md transition ${
            tab === 'pendentes'
              ? 'bg-white dark:bg-slate-800 shadow-sm'
              : 'text-slate-500'
          }`}
        >
          Pendentes ({pendentes.length})
        </button>
        <button
          onClick={() => setTab('aprovados')}
          className={`px-3 py-1 rounded-md transition ${
            tab === 'aprovados'
              ? 'bg-white dark:bg-slate-800 shadow-sm'
              : 'text-slate-500'
          }`}
        >
          Aprovados ({aprovados.length})
        </button>
      </nav>

      {error && (
        <div className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading && profiles.length === 0 ? (
        <div className="text-sm text-slate-500">Carregando…</div>
      ) : lista.length === 0 ? (
        <div className="text-sm text-slate-500">
          {tab === 'pendentes'
            ? 'Nenhum usuário aguardando aprovação.'
            : 'Nenhum usuário aprovado.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {lista.map((p) => {
            const eh_voce = p.user_id === currentUserId
            const busy = acting === p.user_id
            return (
              <li
                key={p.user_id}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-2">
                      {p.email ?? '(sem e-mail)'}
                      {p.is_admin && (
                        <span className="text-[10px] uppercase tracking-wide bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 px-1.5 py-0.5 rounded">
                          admin
                        </span>
                      )}
                      {eh_voce && (
                        <span className="text-[10px] uppercase tracking-wide bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                          você
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Cadastrou em {fmtData(p.criado_em)}
                      {p.aprovado && p.aprovado_em
                        ? ` · aprovado em ${fmtData(p.aprovado_em)}`
                        : ''}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!p.aprovado ? (
                      <>
                        <button
                          onClick={() => aprovar(p)}
                          disabled={busy}
                          className="text-sm rounded-md bg-emerald-600 text-white px-3 py-1.5 disabled:opacity-50"
                        >
                          {busy ? '…' : 'Aprovar'}
                        </button>
                        {!eh_voce && (
                          <button
                            onClick={() => rejeitar(p)}
                            disabled={busy}
                            className="text-sm rounded-md border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-3 py-1.5 disabled:opacity-50"
                          >
                            Rejeitar
                          </button>
                        )}
                      </>
                    ) : (
                      !eh_voce && (
                        <button
                          onClick={() => revogar(p)}
                          disabled={busy}
                          className="text-sm rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 disabled:opacity-50"
                        >
                          {busy ? '…' : 'Revogar'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-xs text-slate-500 pt-2">
        Aprovar libera o acesso às tarefas. Rejeitar apaga apenas o perfil — para
        remover o usuário completamente, use o painel do Supabase em
        Authentication → Users.
      </p>
    </div>
  )
}
