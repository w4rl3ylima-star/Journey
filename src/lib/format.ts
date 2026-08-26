import type { CurrencyCode, Language } from './i18n'

export function formatCurrency(value: number, locale: Language = 'pt-BR', currency: CurrencyCode = 'BRL'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
}

export function formatCurrencyCompact(value: number, locale: Language = 'pt-BR', currency: CurrencyCode = 'BRL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatMonthLabel(monthKey: string, locale: Language = 'pt-BR'): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  const label = date.toLocaleDateString(locale, { month: 'short' })
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '')
}

export function formatDateLabel(iso: string, locale: Language = 'pt-BR'): string {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString(locale, { day: '2-digit', month: 'short' })
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7)
}

export function addMonthsToKey(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
