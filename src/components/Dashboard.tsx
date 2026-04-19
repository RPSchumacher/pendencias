import { useMemo, useState } from 'react'
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

const ALL = '__all__'

export default function Dashboard({ tasks, loading, onEdit, onReload }: Props) {
  const today = todayISO()

  // Filtros globais que cruzam todos os blocos.
  const [query, setQuery] = useState('')
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>(ALL)

  const hasFilter = query.trim().length > 0 || responsavelFiltro !== ALL

  // Lista de responsáveis únicos em todas as tarefas ativas, para popular o
  // dropdown. "Eu" aparece como label amigável.
  const responsaveisOptions = useMemo(() => {
    const nomes = Array.from(new Set(tasks.map((t) => t.responsavel))).sort(
      (a, b) => {
        // "eu" no topo
        if (isMe(a)) return -1
        if (isMe(b)) return 1
        return a.localeCompare(b)
      },
    )
    return nomes
  }, [tasks])

  // Aplica os filtros globais antes de computar as seções.
  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks.filter((t) => {
      if (
        responsavelFiltro !== ALL &&
        t.responsavel.trim().toLowerCase() !==
          responsavelFiltro.trim().toLowerCase()
      ) {
        return false
      }
      if (!q) return true
      return (
        t.titulo.toLowerCase().includes(q) ||
        t.responsavel.toLowerCase().includes(q) ||
        (t.cliente?.toLowerCase().includes(q) ?? false) ||
        (t.notas?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [tasks, query, responsavelFiltro])

  // Atrasados: qualquer tarefa com prazo vencido, independente da categoria.
  // Sempre aparece no topo — é um alerta, não uma categoria.
  const atrasados = useMemo(
    () =>
      filteredTasks
        .filter((t) => t.prazo && t.prazo < today)
        .sort((a, b) => (a.prazo ?? '').localeCompare(b.prazo ?? '')),
    [filteredTasks, today],
  )

  // Tarefas "ativas no dia-a-dia" — exclui atrasados (que já aparecem no topo)
  // e separa em 3 blocos mutuamente exclusivos.
  const naoAtrasadas = useMemo(
    () => filteredTasks.filter((t) => !(t.prazo && t.prazo < today)),
    [filteredTasks, today],
  )

  // Entrega de trabalho: qualquer tarefa com a flag ligada (tem precedência
  // sobre minhas/acompanhando — se está marcada, aparece só aqui).
  const entregaTrabalho = useMemo(
    () =>
      naoAtrasadas
        .filter((t) => t.entrega_trabalho)
        .sort((a, b) => a.atualizado_em.localeCompare(b.atualizado_em)),
    [naoAtrasadas],
  )

  const minhas = useMemo(
    () =>
      naoAtrasadas
        .filter((t) => !t.entrega_trabalho && isMe(t.responsavel))
        .sort((a, b) => {
          if (a.prazo && b.prazo) return a.prazo.localeCompare(b.prazo)
          if (a.prazo) return -1
          if (b.prazo) return 1
          return b.criado_em.localeCompare(a.criado_em)
        }),
    [naoAtrasadas],
  )

  const acompanhando = useMemo(
    () =>
      naoAtrasadas
        .filter((t) => !t.entrega_trabalho && !isMe(t.responsavel))
        .sort((a, b) => a.atualizado_em.localeCompare(b.atualizado_em)),
    [naoAtrasadas],
  )

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

  const nadaCasouFiltro =
    hasFilter &&
    atrasados.length === 0 &&
    minhas.length === 0 &&
    acompanhando.length === 0 &&
    entregaTrabalho.length === 0

  return (
    <div className="space-y-4">
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        responsavel={responsavelFiltro}
        onResponsavelChange={setResponsavelFiltro}
        responsaveis={responsaveisOptions}
        hasFilter={hasFilter}
        onClear={() => {
          setQuery('')
          setResponsavelFiltro(ALL)
        }}
      />

      {nadaCasouFiltro ? (
        <div className="text-center py-10 text-sm text-slate-500">
          Nada encontrado para esse filtro.
        </div>
      ) : (
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

          {entregaTrabalho.length > 0 && (
            <Section
              title="Acompanhamento de entrega de trabalho"
              count={entregaTrabalho.length}
            >
              {entregaTrabalho.map((t) => (
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
      )}
    </div>
  )
}

function FilterBar({
  query,
  onQueryChange,
  responsavel,
  onResponsavelChange,
  responsaveis,
  hasFilter,
  onClear,
}: {
  query: string
  onQueryChange: (v: string) => void
  responsavel: string
  onResponsavelChange: (v: string) => void
  responsaveis: string[]
  hasFilter: boolean
  onClear: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Buscar por título, cliente, notas…"
        className="flex-1 min-w-[12rem] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        aria-label="Buscar"
      />
      <select
        value={responsavel}
        onChange={(e) => onResponsavelChange(e.target.value)}
        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-sm"
        aria-label="Filtrar por responsável"
      >
        <option value={ALL}>Todos os responsáveis</option>
        {responsaveis.map((r) => (
          <option key={r} value={r}>
            {isMe(r) ? 'Eu' : r}
          </option>
        ))}
      </select>
      {hasFilter && (
        <button
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-2"
          aria-label="Limpar filtros"
        >
          Limpar
        </button>
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
      <div className="flex items-center justify-between mb-2 px-1 gap-2">
        <h2
          className={`text-xs font-semibold uppercase tracking-wide ${
            tone === 'late'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500'
          }`}
        >
          {title}
        </h2>
        <span className="text-xs text-slate-400 tabular-nums">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
