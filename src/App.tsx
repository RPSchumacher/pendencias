import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Task } from './lib/types'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Historico from './components/Historico'
import TaskForm from './components/TaskForm'
import Header from './components/Header'

type Editing = Task | 'new' | null

export default function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [section, setSection] = useState<'dashboard' | 'historico'>('dashboard')
  const [editing, setEditing] = useState<Editing>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (authed) fetchTasks()
  }, [authed])

  // Sincronização automática entre dispositivos: puxa as tarefas do servidor
  // a cada 30s enquanto a aba estiver visível. Se você edita algo no celular,
  // o desktop se atualiza sozinho em até 30s (e vice-versa). Quando a aba
  // volta ao foco, puxa imediatamente — assim não precisa esperar o próximo
  // tick ao desbloquear o celular.
  useEffect(() => {
    if (!authed) return

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
  }, [authed])

  async function fetchTasks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('atualizado_em', { ascending: false })
    if (!error && data) setTasks(data as Task[])
    setLoading(false)
  }

  // Variante "silenciosa" do fetch usada pelo polling automático. Não mexe no
  // loading para não piscar "Carregando…" a cada 30 segundos.
  async function fetchTasksSilent() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('atualizado_em', { ascending: false })
    if (!error && data) setTasks(data as Task[])
  }

  if (authed === null) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Carregando…
      </div>
    )
  }

  if (!authed) return <Login />

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
        onSection={setSection}
        onNew={() => setEditing('new')}
      />
      <main className="flex-1 px-4 pb-24 pt-4 max-w-2xl w-full mx-auto safe-bottom">
        {section === 'dashboard' ? (
          <Dashboard
            tasks={tasks.filter((t) => !t.finalizado)}
            loading={loading}
            onEdit={(t) => setEditing(t)}
            onReload={fetchTasks}
          />
        ) : (
          <Historico
            tasks={tasks.filter((t) => t.finalizado)}
            onEdit={(t) => setEditing(t)}
          />
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
