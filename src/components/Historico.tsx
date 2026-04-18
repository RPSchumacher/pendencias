import { useMemo, useState } from 'react'
import type { Task } from '../lib/types'
import { isMe } from '../lib/supabase'
import { formatDate } from '../lib/utils'

type Props = {
  tasks: Task[]
  onEdit: (t: Task) => void
}

export default function Historico({ tasks, onEdit }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...tasks].sort((a, b) =>
      (b.finalizado_em ?? '').localeCompare(a.finalizado_em ?? ''),
    )
    if (!q) return sorted
    return sorted.filter(
      (t) =>
        t.titulo.toLowerCase().includes(q) ||
        t.responsavel.toLowerCase().includes(q) ||
        (t.cliente?.toLowerCase().includes(q) ?? false) ||
        (t.notas?.toLowerCase().includes(q) ?? false),
    )
  }, [tasks, query])

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar no histórico…"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          {tasks.length === 0
            ? 'Nada finalizado por aqui ainda.'
            : 'Nada encontrado para essa busca.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => onEdit(t)}
              className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
            >
              <div className="font-medium break-words">{t.titulo}</div>
              <div className="mt-1 text-xs text-slate-500 flex flex-wrap gap-x-2">
                {!isMe(t.responsavel) && <span>{t.responsavel}</span>}
                {t.cliente && <span>· {t.cliente}</span>}
                {t.finalizado_em && (
                  <span>· finalizada em {formatDate(t.finalizado_em)}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
