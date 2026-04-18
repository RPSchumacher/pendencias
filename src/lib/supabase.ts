import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error(
    'Faltam variáveis de ambiente. Copie .env.example para .env e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
  )
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const APP_EMAIL = (import.meta.env.VITE_APP_EMAIL as string) ?? ''

export const ME = 'eu'

export function isMe(responsavel: string): boolean {
  return responsavel.trim().toLowerCase() === ME
}
