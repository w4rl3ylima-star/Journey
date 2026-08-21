const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
})

const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatCurrencyCompact(value: number): string {
  return compactCurrencyFormatter.format(value)
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  const label = date.toLocaleDateString('pt-BR', { month: 'short' })
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '')
}

export function formatDateLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
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
