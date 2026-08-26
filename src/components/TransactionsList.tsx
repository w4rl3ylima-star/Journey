import { useMemo, useState } from 'react'
import type { Transaction } from '../lib/types'
import { getCategory } from '../lib/categories'
import { useIsDarkMode } from '../hooks/useColorScheme'
import { categoryColor } from '../lib/chartTheme'
import { useSettings } from '../contexts/SettingsContext'

interface TransactionsListProps {
  transactions: Transaction[]
  onRemove: (id: string) => void
}

type Filter = 'all' | 'expense' | 'income'

export function TransactionsList({ transactions, onRemove }: TransactionsListProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const isDark = useIsDarkMode()
  const { t, categoryLabel, formatCurrency, formatDateLabel } = useSettings()

  const filtered = useMemo(
    () => (filter === 'all' ? transactions : transactions.filter((t) => t.type === filter)),
    [transactions, filter],
  )

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const tx of filtered) {
      const list = map.get(tx.date) ?? []
      list.push(tx)
      map.set(tx.date, list)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const filters: [Filter, string][] = [
    ['all', t('tx.all', 'Todos')],
    ['expense', t('tx.expenses', 'Despesas')],
    ['income', t('tx.income', 'Receitas')],
  ]

  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('tx.title', 'Extrato')}</h1>
      </header>

      <div className="flex gap-2">
        {filters.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-neutral-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {groups.length === 0 && (
        <p className="mt-8 text-center text-sm text-neutral-400">
          {t('tx.empty', 'Nenhum lançamento ainda. Toque no + para começar.')}
        </p>
      )}

      {groups.map(([date, txs]) => (
        <div key={date}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">{formatDateLabel(date)}</p>
          <div className="flex flex-col gap-2">
            {txs.map((tx) => {
              const cat = tx.categoryId ? getCategory(tx.categoryId) : null
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 dark:border-white/5 dark:bg-[#141413]"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{
                      backgroundColor: cat ? `${categoryColor(cat, isDark)}22` : isDark ? '#0ca30c22' : '#0ca30c1a',
                    }}
                  >
                    {cat ? cat.emoji : '💰'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{tx.description}</p>
                    <p className="text-xs text-neutral-400">
                      {cat ? categoryLabel(cat.id, cat.label) : t('tx.income.label', 'Receita')}
                      {tx.recurring ? ` · ${t('tx.monthly', 'mensal')}` : ''}
                      {tx.createdVia === 'voice' ? ' · 🎤' : ''}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onRemove(tx.id)}
                    aria-label="Remover lançamento"
                    className="shrink-0 text-neutral-300 hover:text-rose-500"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
