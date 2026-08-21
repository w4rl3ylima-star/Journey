import { getCategory, type CategoryId } from '../lib/categories'
import { formatCurrency, formatCurrencyCompact } from '../lib/format'
import { categoryColor } from '../lib/chartTheme'
import { useIsDarkMode } from '../hooks/useColorScheme'

interface CategoryBarChartProps {
  byCategory: Record<string, number>
  income: number
}

interface Row {
  categoryId: CategoryId
  label: string
  short: string
  emoji: string
  amount: number
  pctOfIncome: number | null
}

const MIN_BAR = 26
const MAX_BAR = 128

export function CategoryBarChart({ byCategory, income }: CategoryBarChartProps) {
  const isDark = useIsDarkMode()

  const rows: Row[] = Object.entries(byCategory)
    .map(([id, amount]) => {
      const cat = getCategory(id as CategoryId)
      return {
        categoryId: cat.id,
        label: cat.label,
        short: cat.short,
        emoji: cat.emoji,
        amount,
        pctOfIncome: income > 0 ? (amount / income) * 100 : null,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-black/10 text-sm text-neutral-400 dark:border-white/10">
        Nenhuma despesa neste mês ainda.
      </div>
    )
  }

  const max = Math.max(...rows.map((r) => r.amount))

  return (
    <div className="no-scrollbar flex h-[210px] items-end gap-3 overflow-x-auto px-1 pb-1">
      {rows.map((row) => {
        const barHeight = Math.max(MIN_BAR, (row.amount / max) * MAX_BAR)
        const color = categoryColor(getCategory(row.categoryId), isDark)
        const badge = row.pctOfIncome !== null ? `${row.pctOfIncome.toFixed(0)}%` : formatCurrencyCompact(row.amount)
        return (
          <div key={row.categoryId} className="flex h-full w-16 shrink-0 flex-col items-center justify-end gap-2" title={`${row.label}: ${formatCurrency(row.amount)}`}>
            <span
              className="whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-neutral-900 shadow-sm ring-1 ring-black/5 dark:bg-neutral-800 dark:text-white dark:ring-white/10"
              aria-hidden
            >
              {badge}
            </span>
            <div className="w-11 rounded-2xl transition-[height]" style={{ height: barHeight, backgroundColor: color }} />
            <span className="flex max-w-full flex-col items-center whitespace-nowrap rounded-full bg-neutral-100 px-2.5 py-1.5 text-[11px] font-medium text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
              <span aria-hidden>{row.emoji}</span>
              <span className="truncate">{row.short}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
