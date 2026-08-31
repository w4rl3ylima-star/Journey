import { useMemo, useState } from 'react'
import type { Transaction, Goal } from '../lib/types'
import { summarizeByMonth, computeGoalProgress, monthOverMonthDelta } from '../lib/projections'
import { currentMonthKey, addMonthsToKey } from '../lib/format'
import { CategoryBarChart } from './CategoryBarChart'
import { TrendChart } from './TrendChart'
import { useSettings } from '../contexts/SettingsContext'

interface DashboardProps {
  transactions: Transaction[]
  goals: Goal[]
  onViewGoals: () => void
  onViewIncome: () => void
  onViewExpense: () => void
}

export function Dashboard({ transactions, goals, onViewGoals, onViewIncome, onViewExpense }: DashboardProps) {
  const { t, formatMonthLabel } = useSettings()
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
  const previous = months.find((m) => m.key === addMonthsToKey(selectedKey, -1))

  const goalProgress = useMemo(() => computeGoalProgress(goals, transactions), [goals, transactions])
  const topGoals = goalProgress.filter((g) => g.goal.currentAmount < g.goal.targetAmount).slice(0, 2)

  const canGoBack = selectedKey > earliestKey
  const canGoForward = selectedKey < currentMonthKey()

  const netDelta = previous ? monthOverMonthDelta(selected.net, previous.net) : null
  const incomeDelta = previous ? monthOverMonthDelta(selected.income, previous.income) : null
  const expenseDelta = previous ? monthOverMonthDelta(selected.expense, previous.expense) : null

  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{t('dashboard.greeting', 'Olá 👋')}</p>
          <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-white">
            {t('dashboard.title', 'Seu resumo')}
          </h1>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-1 text-white dark:bg-white dark:text-neutral-900">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => setSelectedKey((k) => addMonthsToKey(k, -1))}
            aria-label="Mês anterior"
            className="flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-30"
          >
            ‹
          </button>
          <span className="min-w-[64px] text-center text-sm font-semibold">{formatMonthLabel(selectedKey)}</span>
          <button
            type="button"
            disabled={!canGoForward}
            onClick={() => setSelectedKey((k) => addMonthsToKey(k, 1))}
            aria-label="Próximo mês"
            className="flex h-7 w-7 items-center justify-center rounded-full disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </header>

      <section className="rounded-3xl bg-neutral-900 p-5 text-white dark:bg-black">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{t('dashboard.balance', 'Saldo do mês')}</p>
          <DeltaBadge value={netDelta} />
        </div>
        <BalanceValue value={selected.net} />

        <div className="mt-5 flex gap-3">
          <MiniStat
            label={t('dashboard.income', 'Receita')}
            value={selected.income}
            delta={incomeDelta}
            dotClassName="bg-emerald-400"
            onClick={onViewIncome}
            hint={t('dashboard.viewIncomeHint', 'Toque para ver os lançamentos')}
          />
          <MiniStat
            label={t('dashboard.expense', 'Despesa')}
            value={selected.expense}
            delta={expenseDelta}
            dotClassName="bg-rose-400"
            invertDeltaTone
            onClick={onViewExpense}
            hint={t('dashboard.viewExpenseHint', 'Toque para ver os lançamentos')}
          />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-[#141413] dark:ring-white/5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          {t('dashboard.byCategory', 'Gastos por categoria')}
        </h2>
        <CategoryBarChart byCategory={selected.byCategory} income={selected.income} />
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-[#141413] dark:ring-white/5">
        <TrendChart transactions={transactions} />
      </section>

      {topGoals.length > 0 && (
        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-[#141413] dark:ring-white/5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{t('dashboard.goals', 'Suas metas')}</h2>
            <button type="button" onClick={onViewGoals} className="text-xs font-medium text-teal-600 dark:text-teal-400">
              {t('dashboard.goals.viewAll', 'Ver todas')}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {topGoals.map((g) => (
              <div key={g.goal.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-700 dark:text-neutral-200">
                    {g.goal.emoji} {g.goal.name}
                  </span>
                  <span className="font-bold text-neutral-400">{g.progressPct.toFixed(0)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
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

function BalanceValue({ value }: { value: number }) {
  const { formatCurrency } = useSettings()
  return <p className="mt-1 text-4xl font-black tabular-nums tracking-tight">{formatCurrency(value)}</p>
}

function DeltaBadge({ value, invertTone = false }: { value: number | null; invertTone?: boolean }) {
  if (value === null) return null
  const isUp = value >= 0
  const isGood = invertTone ? !isUp : isUp
  return (
    <span
      className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        isGood ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-950'
      }`}
    >
      {isUp ? '+' : ''}
      {value.toFixed(0)}%
    </span>
  )
}

function MiniStat({
  label,
  value,
  delta,
  dotClassName,
  invertDeltaTone = false,
  onClick,
  hint,
}: {
  label: string
  value: number
  delta: number | null
  dotClassName: string
  invertDeltaTone?: boolean
  onClick: () => void
  hint: string
}) {
  const { formatCurrency } = useSettings()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={hint}
      className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-2xl bg-white/10 px-3 py-2.5 text-left transition-transform active:scale-[0.97]"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/60">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClassName}`} />
        {label}
      </span>
      <span className="truncate text-base font-bold tabular-nums">{formatCurrency(value)}</span>
      <DeltaBadge value={delta} invertTone={invertDeltaTone} />
    </button>
  )
}
