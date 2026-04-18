export interface Task {
  id: string
  user_id: string
  titulo: string
  responsavel: string
  cliente: string | null
  prazo: string | null // YYYY-MM-DD
  notas: string | null
  finalizado: boolean
  finalizado_em: string | null
  criado_em: string
  atualizado_em: string
}

export type TaskInput = {
  titulo: string
  responsavel: string
  cliente: string | null
  prazo: string | null
  notas: string | null
}

export type Section = 'dashboard' | 'historico'
