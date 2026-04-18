import { supabase } from '../lib/supabase'

type Props = {
  section: 'dashboard' | 'historico'
  onSection: (s: 'dashboard' | 'historico') => void
  onNew: () => void
}

export default function Header({ section, onSection, onNew }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur safe-top">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
        <h1 className="font-semibold text-lg flex-1">Pendências</h1>
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
        </nav>
        <button
          onClick={onNew}
          className="ml-1 rounded-full bg-cyan-600 text-white h-9 w-9 flex items-center justify-center text-xl leading-none"
          title="Nova tarefa"
          aria-label="Nova tarefa"
        >
          +
        </button>
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
