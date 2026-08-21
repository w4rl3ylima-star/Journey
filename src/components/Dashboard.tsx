import { useMemo, useState } from 'react'
import type { Transaction, Goal } from '../lib/types'
import { summarizeByMonth, projectForward, computeGoalProgress } from '../lib/projections'
import { formatCurrency, formatMonthLabel, currentMonthKey, addMonthsToKey } from '../lib/format'
import { CategoryBarChart } from './CategoryBarChart'
import { TrendChart } from './TrendChart'

interface DashboardProps {
  transactions: Transaction[]
  goals: Goal[]
  onViewGoals: () => void
}

export function Dashboard({ transactions, goals, onViewGoals }: DashboardProps) {
  const months = useMemo(() => summarizeByMonth(transactions), [transactions])
  const earliestKey = months[0]?.key ?? currentMonthKey()
  const [selectedKey, setSelectedKey] = useState(currentMonthKey())

  const selected = months.find((m) => m.key === selectedKey) ?? {
    key: selectedKey,
    income: 0,
    expense: 0,
    net: 0,
    byCategory: {},
  }

  const projected = useMemo(() => projectForward(transactions, 3), [transactions])
  const history = months.slice(-6)
  const goalProgress = useMemo(() => computeGoalProgress(goals, transactions), [goals, transactions])
  const topGoals = goalProgress.filter((g) => g.goal.currentAmount < g.goal.targetAmount).slice(0, 2)

  const canGoBack = selectedKey > earliestKey
  const canGoForward = selectedKey < currentMonthKey()

  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400">Olá 👋</p>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Seu resumo</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 dark:bg-white/5">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => setSelectedKey((k) => addMonthsToKey(k, -1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 disabled:opacity-20"
          >
            ‹
          </button>
          <span className="min-w-[64px] text-center text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {formatMonthLabel(selectedKey)}
          </span>
          <button
            type="button"
            disabled={!canGoForward}
            onClick={() => setSelectedKey((k) => addMonthsToKey(k, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 disabled:opacity-20"
          >
            ›
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Receita" value={selected.income} tone="income" />
        <StatTile label="Despesa" value={selected.expense} tone="expense" />
        <StatTile label="Saldo" value={selected.net} tone={selected.net >= 0 ? 'income' : 'expense'} />
      </div>

      <section className="rounded-3xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-[#141413]">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Gastos por categoria</h2>
        <CategoryBarChart byCategory={selected.byCategory} income={selected.income} />
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-[#141413]">
        <h2 className="mb-1 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Receita x Despesa e projeção</h2>
        <p className="mb-2 text-xs text-neutral-400">Últimos meses e os próximos 3, projetados pela sua média recente.</p>
        <TrendChart history={history} projected={projected} />
      </section>

      {topGoals.length > 0 && (
        <section className="rounded-3xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-[#141413]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Suas metas</h2>
            <button type="button" onClick={onViewGoals} className="text-xs font-medium text-teal-600 dark:text-teal-400">
              Ver todas
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {topGoals.map((g) => (
              <div key={g.goal.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-700 dark:text-neutral-200">
                    {g.goal.emoji} {g.goal.name}
                  </span>
                  <span className="text-neutral-400">{g.progressPct.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                  <div className="h-full rounded-full bg-teal-500" style={{ width: `${g.progressPct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: 'income' | 'expense' }) {
  const color = tone === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-3 dark:border-white/5 dark:bg-[#141413]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${color}`}>{formatCurrency(value)}</p>
    </div>
  )
}
