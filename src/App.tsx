import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import type { Profile, Section, Task } from './lib/types'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Historico from './components/Historico'
import TaskForm from './components/TaskForm'
import Header from './components/Header'
import AguardandoAprovacao from './components/AguardandoAprovacao'
import AdminPanel from './components/AdminPanel'

type Editing = Task | 'new' | null

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [section, setSection] = useState<Section>('dashboard')
  const [editing, setEditing] = useState<Editing>(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Quando logar, busca o profile. Quando deslogar, limpa tudo.
  useEffect(() => {
    if (!session) {
      setProfile(null)
      setTasks([])
      setPendingCount(0)
      setSection('dashboard')
      return
    }
    fetchProfile(session.user.id)
  }, [session?.user.id])

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar profile:', error)
      setProfile(null)
      return
    }
    setProfile((data as Profile | null) ?? null)
  }

  // Quando o profile fica aprovado, carrega as tarefas.
  useEffect(() => {
    if (profile?.aprovado) fetchTasks()
  }, [profile?.aprovado])

  // Se for admin, mantém a contagem de pendentes para o badge da aba Admin.
  useEffect(() => {
    if (!profile?.is_admin) {
      setPendingCount(0)
      return
    }
    refreshPendingCount()
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshPendingCount()
    }, 60_000)
    return () => window.clearInterval(id)
  }, [profile?.is_admin])

  async function refreshPendingCount() {
    const { count, error } = await supabase
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('aprovado', false)
    if (!error && typeof count === 'number') setPendingCount(count)
  }

  // Sincronização automática entre dispositivos: puxa as tarefas do servidor
  // a cada 30s enquanto a aba estiver visível.
  useEffect(() => {
    if (!profile?.aprovado) return

    const tick = () => {
      if (document.visibilityState === 'visible') {
        fetchTasksSilent()
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchTasksSilent()
      }
    }

    const id = window.setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [profile?.aprovado])

  async function fetchTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('atualizado_em', { ascending: false })
    if (!error && data) setTasks(data as Task[])
    setLoading(false)
  }

  async function fetchTasksSilent() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('atualizado_em', { ascending: false })
    if (!error && data) setTasks(data as Task[])
  }

  if (session === undefined || (session && profile === undefined)) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Carregando…
      </div>
    )
  }

  if (!session) return <Login />

  // Sessão ativa mas ainda sem profile — improvável (há trigger), mas por
  // segurança tratamos como aguardando também.
  if (!profile || !profile.aprovado) {
    return <AguardandoAprovacao email={session.user.email} />
  }

  const responsaveis = Array.from(
    new Set(tasks.map((t) => t.responsavel).filter(Boolean)),
  )
  const clientes = Array.from(
    new Set(
      tasks
        .map((t) => t.cliente)
        .filter((c): c is string => !!c && c.trim().length > 0),
    ),
  )

  return (
    <div className="min-h-full flex flex-col">
      <Header
        section={section}
        onSection={(s) => {
          setSection(s)
          if (s === 'admin') refreshPendingCount()
        }}
        onNew={() => setEditing('new')}
        isAdmin={profile.is_admin}
        pendingCount={pendingCount}
      />
      <main className="flex-1 px-4 pb-24 pt-4 max-w-2xl w-full mx-auto safe-bottom">
        {section === 'dashboard' && (
          <Dashboard
            tasks={tasks.filter((t) => !t.finalizado)}
            loading={loading}
            onEdit={(t) => setEditing(t)}
            onReload={fetchTasks}
          />
        )}
        {section === 'historico' && (
          <Historico
            tasks={tasks.filter((t) => t.finalizado)}
            onEdit={(t) => setEditing(t)}
          />
        )}
        {section === 'admin' && profile.is_admin && (
          <AdminPanel currentUserId={session.user.id} />
        )}
      </main>
      {editing && (
        <TaskForm
          task={editing === 'new' ? null : editing}
          existingResponsaveis={responsaveis}
          existingClientes={clientes}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            fetchTasks()
          }}
        />
      )}
    </div>
  )
}
