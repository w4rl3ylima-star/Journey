import { getCategory, type CategoryId } from '../lib/categories'
import { categoryColor } from '../lib/chartTheme'
import { useIsDarkMode } from '../hooks/useColorScheme'
import { useSettings } from '../contexts/SettingsContext'

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
  pctOfTotal: number
  pctOfIncome: number | null
}

const MIN_BAR = 26
const MAX_BAR = 116

export function CategoryBarChart({ byCategory, income }: CategoryBarChartProps) {
  const isDark = useIsDarkMode()
  const { t, categoryLabel, categoryShort, formatCurrency, formatCurrencyCompact } = useSettings()

  const total = Object.values(byCategory).reduce((sum, v) => sum + v, 0)

  const rows: Row[] = Object.entries(byCategory)
    .map(([id, amount]) => {
      const cat = getCategory(id as CategoryId)
      return {
        categoryId: cat.id,
        label: categoryLabel(cat.id, cat.label),
        short: categoryShort(cat.id, cat.short),
        emoji: cat.emoji,
        amount,
        pctOfTotal: total > 0 ? (amount / total) * 100 : 0,
        pctOfIncome: income > 0 ? (amount / income) * 100 : null,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-black/10 text-sm text-neutral-400 dark:border-white/10">
        {t('dashboard.noExpenses', 'Nenhuma despesa neste mês ainda.')}
      </div>
    )
  }

  const max = Math.max(...rows.map((r) => r.amount))
  const pctOfIncomeTotal = income > 0 ? (total / income) * 100 : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('dashboard.totalSpent', 'Total gasto')}{' '}
          <span className="font-semibold text-neutral-800 dark:text-neutral-100">{formatCurrency(total)}</span>
        </p>
        {pctOfIncomeTotal !== null && (
          <p className="text-xs text-neutral-400">
            {pctOfIncomeTotal.toFixed(0)}% {t('dashboard.ofIncome', 'da renda')}
          </p>
        )}
      </div>

      <div className="no-scrollbar flex h-[196px] items-end gap-3 overflow-x-auto px-1 pb-1">
        {rows.map((row) => {
          const barHeight = Math.max(MIN_BAR, (row.amount / max) * MAX_BAR)
          const color = categoryColor(getCategory(row.categoryId), isDark)
          return (
            <div
              key={row.categoryId}
              className="flex h-full w-[72px] shrink-0 flex-col items-center justify-end gap-2"
              title={`${row.label}: ${formatCurrency(row.amount)} (${row.pctOfTotal.toFixed(0)}%)`}
            >
              <span
                className="whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-neutral-900 shadow-sm ring-1 ring-black/5 dark:bg-neutral-800 dark:text-white dark:ring-white/10"
                aria-hidden
              >
                {row.pctOfTotal.toFixed(0)}%
              </span>
              <div className="w-11 rounded-2xl transition-[height]" style={{ height: barHeight, backgroundColor: color }} />
              <span className="flex max-w-full flex-col items-center whitespace-nowrap rounded-full bg-neutral-100 px-2.5 py-1.5 text-center text-[11px] font-medium text-neutral-500 dark:bg-white/5 dark:text-neutral-400">
                <span aria-hidden>{row.emoji}</span>
                <span className="max-w-full truncate text-neutral-600 dark:text-neutral-300">{row.short}</span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{formatCurrencyCompact(row.amount)}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
