import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const d = iso.length === 10 ? parseISO(iso + 'T00:00:00') : parseISO(iso)
    return format(d, "dd 'de' MMM", { locale: ptBR })
  } catch {
    return ''
  }
}

export function formatDateFull(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const d = iso.length === 10 ? parseISO(iso + 'T00:00:00') : parseISO(iso)
    return format(d, "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return ''
  }
}

export function daysSince(iso: string): number {
  try {
    return differenceInCalendarDays(new Date(), parseISO(iso))
  } catch {
    return 0
  }
}

export function daysUntil(iso: string): number {
  try {
    const d = iso.length === 10 ? parseISO(iso + 'T00:00:00') : parseISO(iso)
    return differenceInCalendarDays(d, new Date())
  } catch {
    return 0
  }
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function agingLabel(days: number): string {
  if (days <= 0) return 'hoje'
  if (days === 1) return 'há 1 dia'
  return `há ${days} dias`
}

export function prazoLabel(prazoISO: string): { text: string; tone: 'late' | 'soon' | 'ok' } {
  const d = daysUntil(prazoISO)
  if (d < 0) return { text: `atrasado ${Math.abs(d)}d`, tone: 'late' }
  if (d === 0) return { text: 'hoje', tone: 'soon' }
  if (d <= 2) return { text: `em ${d}d`, tone: 'soon' }
  return { text: formatDate(prazoISO), tone: 'ok' }
}
