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

  // Estado dos filtros por responsável em cada seção com múltiplos responsáveis.
  const [filtroAcompanhando, setFiltroAcompanhando] = useState<string>(ALL)
  const [filtroEntrega, setFiltroEntrega] = useState<string>(ALL)

  // Atrasados: qualquer tarefa com prazo vencido, independente da categoria.
  // Sempre aparece no topo — é um alerta, não uma categoria.
  const atrasados = useMemo(
    () =>
      tasks
        .filter((t) => t.prazo && t.prazo < today)
        .sort((a, b) => (a.prazo ?? '').localeCompare(b.prazo ?? '')),
    [tasks, today],
  )

  // Tarefas "ativas no dia-a-dia" — exclui atrasados (que já aparecem no topo)
  // e separa em 3 blocos mutuamente exclusivos.
  const naoAtrasadas = useMemo(
    () => tasks.filter((t) => !(t.prazo && t.prazo < today)),
    [tasks, today],
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

  // Listas de responsáveis únicos para popular os dropdowns de filtro.
  const respsAcompanhando = useMemo(
    () => Array.from(new Set(acompanhando.map((t) => t.responsavel))).sort(),
    [acompanhando],
  )
  const respsEntrega = useMemo(
    () => Array.from(new Set(entregaTrabalho.map((t) => t.responsavel))).sort(),
    [entregaTrabalho],
  )

  const acompanhandoFiltrado =
    filtroAcompanhando === ALL
      ? acompanhando
      : acompanhando.filter((t) => t.responsavel === filtroAcompanhando)

  const entregaFiltrada =
    filtroEntrega === ALL
      ? entregaTrabalho
      : entregaTrabalho.filter((t) => t.responsavel === filtroEntrega)

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
            <TaskCard key={t.id} task={t} onEdit={onEdit} onFinalize={finalize} />
          ))}
        </Section>
      )}

      {acompanhando.length > 0 && (
        <Section
          title="Acompanhando"
          count={acompanhandoFiltrado.length}
          totalCount={acompanhando.length}
          filter={
            respsAcompanhando.length > 1 ? (
              <FiltroResponsavel
                value={filtroAcompanhando}
                onChange={setFiltroAcompanhando}
                options={respsAcompanhando}
              />
            ) : null
          }
        >
          {acompanhandoFiltrado.map((t) => (
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
          count={entregaFiltrada.length}
          totalCount={entregaTrabalho.length}
          filter={
            respsEntrega.length > 1 ? (
              <FiltroResponsavel
                value={filtroEntrega}
                onChange={setFiltroEntrega}
                options={respsEntrega}
              />
            ) : null
          }
        >
          {entregaFiltrada.map((t) => (
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

function FiltroResponsavel({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
      aria-label="Filtrar por responsável"
    >
      <option value={ALL}>Todos</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function Section({
  title,
  count,
  totalCount,
  tone,
  filter,
  children,
}: {
  title: string
  count: number
  totalCount?: number
  tone?: 'late'
  filter?: ReactNode
  children: ReactNode
}) {
  const showingFiltered =
    typeof totalCount === 'number' && totalCount !== count
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
        <div className="flex items-center gap-2">
          {filter}
          <span className="text-xs text-slate-400 tabular-nums">
            {showingFiltered ? `${count}/${totalCount}` : count}
          </span>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
