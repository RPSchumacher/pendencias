import { supabase } from '../lib/supabase'

type Props = {
  email: string | null | undefined
}

export default function AguardandoAprovacao({ email }: Props) {
  return (
    <div className="flex h-full items-center justify-center p-6 safe-top safe-bottom">
      <div className="w-full max-w-sm space-y-5 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold">Acesso pendente</h1>
          <p className="text-sm text-slate-500 mt-2">
            Sua conta{email ? ` (${email})` : ''} foi criada e o e-mail foi
            confirmado. Agora falta o administrador liberar o acesso.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Quando isso acontecer, é só entrar de novo.
          </p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full rounded-lg bg-slate-900 dark:bg-slate-800 text-white py-3 font-medium"
        >
          Sair
        </button>
      </div>
    </div>
  )
}
