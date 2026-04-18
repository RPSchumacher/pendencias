import type { Task } from '../lib/types'
import { isMe } from '../lib/supabase'
import { daysSince, agingLabel, prazoLabel } from '../lib/utils'

type Props = {
  task: Task
  onEdit: (t: Task) => void
  onFinalize: (t: Task) => void
  showAging?: boolean
}

export default function TaskCard({ task, onEdit, onFinalize, showAging }: Props) {
  const prazo = task.prazo ? prazoLabel(task.prazo) : null
  const aging =
    showAging && !isMe(task.responsavel) ? daysSince(task.atualizado_em) : null

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-start gap-3">
      <button
        onClick={() => onFinalize(task)}
        title="Marcar como finalizada"
        aria-label="Finalizar"
        className="mt-0.5 h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950 flex-shrink-0 transition"
      />
      <button
        onClick={() => onEdit(task)}
        className="flex-1 text-left min-w-0"
      >
        <div className="font-medium leading-snug break-words">{task.titulo}</div>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500">
          {!isMe(task.responsavel) && (
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {task.responsavel}
            </span>
          )}
          {task.cliente && <span>· {task.cliente}</span>}
          {prazo && (
            <span
              className={
                prazo.tone === 'late'
                  ? 'text-rose-600 dark:text-rose-400 font-medium'
                  : prazo.tone === 'soon'
                    ? 'text-amber-600 dark:text-amber-400'
                    : ''
              }
            >
              {prazo.tone === 'late' ? '' : 'prazo '}
              {prazo.text}
            </span>
          )}
          {aging !== null && aging >= 2 && (
            <span
              className={
                aging >= 7
                  ? 'text-rose-600 dark:text-rose-400 font-medium'
                  : 'text-amber-600 dark:text-amber-400'
              }
            >
              sem movimento {agingLabel(aging)}
            </span>
          )}
        </div>
      </button>
    </div>
  )
}
