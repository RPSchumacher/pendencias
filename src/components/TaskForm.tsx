import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, isMe, ME } from '../lib/supabase'
import type { Task, TaskInput } from '../lib/types'
import { formatDateFull } from '../lib/utils'
import AutocompleteInput from './AutocompleteInput'

type Props = {
  task: Task | null
  existingResponsaveis: string[]
  existingClientes: string[]
  onClose: () => void
  onSaved: () => void
}

export default function TaskForm({
  task,
  existingResponsaveis,
  existingClientes,
  onClose,
  onSaved,
}: Props) {
  const [titulo, setTitulo] = useState(task?.titulo ?? '')
  const [responsavel, setResponsavel] = useState(task?.responsavel ?? ME)
  const [cliente, setCliente] = useState(task?.cliente ?? '')
  const [prazo, setPrazo] = useState(task?.prazo ?? '')
  const [notas, setNotas] = useState(task?.notas ?? '')
  const [entregaTrabalho, setEntregaTrabalho] = useState(
    task?.entrega_trabalho ?? false,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const responsaveisList = Array.from(
    new Set([ME, ...existingResponsaveis]),
  )

  async function handleSave() {
    if (!titulo.trim()) {
      setError('Dê um título.')
      return
    }
    setSaving(true)
    setError('')

    const normalized: TaskInput = {
      titulo: titulo.trim(),
      responsavel: responsavel.trim() || ME,
      cliente: cliente.trim() || null,
      prazo: prazo || null,
      notas: notas.trim() || null,
      entrega_trabalho: entregaTrabalho,
    }

    try {
      if (task) {
        const respBefore = task.responsavel.trim()
        const respAfter = normalized.responsavel.trim()
        const delegationChanged =
          respBefore.toLowerCase() !== respAfter.toLowerCase()

        let finalNotas = normalized.notas
        if (delegationChanged) {
          const who =
            respAfter.toLowerCase() === ME ? 'mim' : respAfter
          const from =
            respBefore && respBefore.toLowerCase() !== ME
              ? ` (antes: ${respBefore})`
              : ''
          const logLine = `— ${formatDateFull(new Date().toISOString())}: delegado para ${who}${from}`
          finalNotas = [finalNotas, logLine].filter(Boolean).join('\n')
        }

        const { error: err } = await supabase
          .from('tasks')
          .update({
            titulo: normalized.titulo,
            responsavel: normalized.responsavel,
            cliente: normalized.cliente,
            prazo: normalized.prazo,
            notas: finalNotas,
            entrega_trabalho: normalized.entrega_trabalho,
          })
          .eq('id', task.id)
        if (err) throw err
      } else {
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) throw new Error('Sessão expirada.')
        const { error: err } = await supabase.from('tasks').insert({
          ...normalized,
          user_id: auth.user.id,
        })
        if (err) throw err
      }
      onSaved()
    } catch (e: unknown) {
      const msg =
        (e as { message?: string } | null)?.message ??
        (typeof e === 'string' ? e : '') ??
        ''
      setError(msg || 'Erro ao salvar.')
      // eslint-disable-next-line no-console
      console.error('Erro ao salvar tarefa:', e)
    } finally {
      setSaving(false)
    }
  }

  async function handleFinalize() {
    if (!task) return
    await supabase
      .from('tasks')
      .update({ finalizado: true, finalizado_em: new Date().toISOString() })
      .eq('id', task.id)
    onSaved()
  }

  async function handleReopen() {
    if (!task) return
    await supabase
      .from('tasks')
      .update({ finalizado: false, finalizado_em: null })
      .eq('id', task.id)
    onSaved()
  }

  async function handleDelete() {
    if (!task) return
    if (!confirm('Excluir definitivamente? Essa ação não pode ser desfeita.'))
      return
    await supabase.from('tasks').delete().eq('id', task.id)
    onSaved()
  }

  const willDelegate =
    !!task && isMe(task.responsavel) && !isMe(responsavel) && responsavel.trim() !== ''

  return (
    <div
      className="fixed inset-0 z-20 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center">
          <h2 className="font-semibold flex-1">
            {task ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          <button onClick={onClose} className="text-slate-500 text-sm">
            Cancelar
          </button>
        </div>

        <div className="p-4 space-y-4">
          <Field label="Título">
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              autoFocus={!task}
              placeholder="Ex.: cobrar proposta do cliente X"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </Field>

          <Field label="Responsável">
            <AutocompleteInput
              value={responsavel}
              onChange={setResponsavel}
              suggestions={responsaveisList}
              placeholder='"eu" ou nome de terceiro'
            />
            {willDelegate && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Vai para "Acompanhando" e o contador de dias sem movimento
                começa do zero.
              </p>
            )}
          </Field>

          <Field label="Cliente / parceiro (opcional)">
            <AutocompleteInput
              value={cliente}
              onChange={setCliente}
              suggestions={existingClientes}
              placeholder="Ex.: Acme Ltda"
            />
          </Field>

          <Field label="Prazo final (opcional)">
            <input
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </Field>

          <Field label="Notas">
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={5}
              placeholder="Contexto, histórico de interações, próximos passos…"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </Field>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={entregaTrabalho}
              onChange={(e) => setEntregaTrabalho(e.target.checked)}
              className="h-4 w-4 accent-cyan-600"
            />
            <span className="text-sm">Acompanhamento de entrega de trabalho</span>
            <span className="ml-auto text-xs text-slate-500">
              {entregaTrabalho ? 'Sim' : 'Não'}
            </span>
          </label>

          {error && <div className="text-sm text-rose-500">{error}</div>}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 flex flex-wrap gap-2">
          {task && !task.finalizado && (
            <button
              onClick={handleFinalize}
              className="rounded-lg px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950"
            >
              Finalizar
            </button>
          )}
          {task && task.finalizado && (
            <button
              onClick={handleReopen}
              className="rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800"
            >
              Reabrir
            </button>
          )}
          {task && (
            <button
              onClick={handleDelete}
              className="rounded-lg px-3 py-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950"
            >
              Excluir
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm bg-cyan-600 text-white disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
        {label}
      </span>
      {children}
    </label>
  )
}
