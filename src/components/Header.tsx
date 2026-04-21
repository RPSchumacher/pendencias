import { supabase } from '../lib/supabase'
import type { Section } from '../lib/types'

type Props = {
  section: Section
  onSection: (s: Section) => void
  onNew: () => void
  isAdmin: boolean
  pendingCount?: number
}

export default function Header({
  section,
  onSection,
  onNew,
  isAdmin,
  pendingCount = 0,
}: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur safe-top">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
        <h1 className="font-semibold text-lg flex-1">Painel de Controle Pessoal</h1>
        <nav className="flex rounded-lg bg-slate-100 dark:bg-slate-900 p-0.5 text-sm">
          <button
            onClick={() => onSection('dashboard')}
            className={`px-3 py-1 rounded-md transition ${
              section === 'dashboard'
                ? 'bg-white dark:bg-slate-800 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Ativas
          </button>
          <button
            onClick={() => onSection('historico')}
            className={`px-3 py-1 rounded-md transition ${
              section === 'historico'
                ? 'bg-white dark:bg-slate-800 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Histórico
          </button>
          {isAdmin && (
            <button
              onClick={() => onSection('admin')}
              className={`px-3 py-1 rounded-md transition relative ${
                section === 'admin'
                  ? 'bg-white dark:bg-slate-800 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Admin
              {pendingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-semibold rounded-full bg-amber-500 text-white px-1">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </nav>
        {section !== 'admin' && (
          <button
            onClick={onNew}
            className="ml-1 rounded-full bg-cyan-600 text-white h-9 w-9 flex items-center justify-center text-xl leading-none"
            title="Nova tarefa"
            aria-label="Nova tarefa"
          >
            +
          </button>
        )}
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-xs text-slate-500 ml-1 px-1"
          title="Sair"
        >
          Sair
        </button>
      </div>
    </header>
  )
}
