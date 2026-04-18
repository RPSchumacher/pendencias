import type { ReactNode } from 'react'
import type { Task } from '../lib/types'
import { supabase, isMe } from '../lib/supabase'
import { todayISO } from '../lib/utils'
import TaskCard from './TaskCard'

type Props = {
  tasks: Task[]
  loading: boolean
  onEdit: (t: Task) => void
  onReload: () => void
}

export default function Dashboard({ tasks, loading, onEdit, onReload }: Props) {
  const today = todayISO()

  const atrasados = tasks
    .filter((t) => t.prazo && t.prazo < today)
    .sort((a, b) => (a.prazo ?? '').localeCompare(b.prazo ?? ''))

  const minhas = tasks
    .filter((t) => isMe(t.responsavel) && !(t.prazo && t.prazo < today))
    .sort((a, b) => {
      if (a.prazo && b.prazo) return a.prazo.localeCompare(b.prazo)
      if (a.prazo) return -1
      if (b.prazo) return 1
      return b.criado_em.localeCompare(a.criado_em)
    })

  const acompanhando = tasks
    .filter((t) => !isMe(t.responsavel) && !(t.prazo && t.prazo < today))
    .sort((a, b) => a.atualizado_em.localeCompare(b.atualizado_em))

  async function finalize(t: Task) {
    await supabase
      .from('tasks')
      .update({ finalizado: true, finalizado_em: new Date().toISOString() })
      .eq('id', t.id)
    onReload()
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-12">Carregando…</div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-base">Tudo limpo por aqui.</p>
        <p className="text-sm mt-1">Toque no + para adicionar uma pendência.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {atrasados.length > 0 && (
        <Section title="Atrasados" count={atrasados.length} tone="late">
          {atrasados.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onEdit={onEdit}
              onFinalize={finalize}
              showAging={!isMe(t.responsavel)}
            />
          ))}
        </Section>
      )}
      {minhas.length > 0 && (
        <Section title="Minhas tarefas" count={minhas.length}>
          {minhas.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onEdit={onEdit}
              onFinalize={finalize}
            />
          ))}
        </Section>
      )}
      {acompanhando.length > 0 && (
        <Section title="Acompanhando" count={acompanhando.length}>
          {acompanhando.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onEdit={onEdit}
              onFinalize={finalize}
              showAging
            />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({
  title,
  count,
  tone,
  children,
}: {
  title: string
  count: number
  tone?: 'late'
  children: ReactNode
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2 px-1">
        <h2
          className={`text-xs font-semibold uppercase tracking-wide ${
            tone === 'late'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500'
          }`}
        >
          {title}
        </h2>
        <span className="text-xs text-slate-400">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
