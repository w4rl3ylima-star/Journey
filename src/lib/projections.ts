import { CATEGORIES, type CategoryId } from './categories'
import type { Transaction, Goal } from './types'
import { addMonthsToKey, currentMonthKey, monthKey as toMonthKey } from './format'

export interface MonthSummary {
  key: string
  income: number
  expense: number
  net: number
  byCategory: Record<string, number>
}

/** Groups transactions into per-month totals, always including the current month even if empty. */
export function summarizeByMonth(transactions: Transaction[]): MonthSummary[] {
  const map = new Map<string, MonthSummary>()
  const ensure = (key: string): MonthSummary => {
    let entry = map.get(key)
    if (!entry) {
      entry = { key, income: 0, expense: 0, net: 0, byCategory: {} }
      map.set(key, entry)
    }
    return entry
  }
  ensure(currentMonthKey())
  for (const tx of transactions) {
    const key = toMonthKey(tx.date)
    const entry = ensure(key)
    if (tx.type === 'income') {
      entry.income += tx.amount
    } else {
      entry.expense += tx.amount
      if (tx.categoryId) entry.byCategory[tx.categoryId] = (entry.byCategory[tx.categoryId] ?? 0) + tx.amount
    }
    entry.net = entry.income - entry.expense
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
}

export interface PeriodSummary {
  key: string
  income: number
  expense: number
}

function toISODate(d: Date): string {
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

/** Monday of the week containing `date`, at local midnight. */
function startOfWeek(date: Date): Date {
  const day = date.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/** Groups transactions into the last N weeks (Monday-start), ending with the current week. */
export function summarizeByWeek(transactions: Transaction[], weeksBack = 8): PeriodSummary[] {
  const currentWeekStart = startOfWeek(new Date())
  const weeks: PeriodSummary[] = []
  for (let i = weeksBack - 1; i >= 0; i--) {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() - i * 7)
    weeks.push({ key: toISODate(d), income: 0, expense: 0 })
  }
  const byKey = new Map(weeks.map((w) => [w.key, w]))
  for (const tx of transactions) {
    const weekStart = toISODate(startOfWeek(new Date(`${tx.date}T00:00:00`)))
    const bucket = byKey.get(weekStart)
    if (!bucket) continue
    if (tx.type === 'income') bucket.income += tx.amount
    else bucket.expense += tx.amount
  }
  return weeks
}

/** Groups transactions into the last N calendar days, ending today. */
export function summarizeByDay(transactions: Transaction[], daysBack = 14): PeriodSummary[] {
  const today = new Date()
  const days: PeriodSummary[] = []
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push({ key: toISODate(d), income: 0, expense: 0 })
  }
  const byKey = new Map(days.map((d) => [d.key, d]))
  for (const tx of transactions) {
    const bucket = byKey.get(tx.date)
    if (!bucket) continue
    if (tx.type === 'income') bucket.income += tx.amount
    else bucket.expense += tx.amount
  }
  return days
}

/** Average monthly expense per category over the last N complete-or-partial months (excluding the current one when it has too little data is not handled here — caller decides). */
export function averageMonthlyByCategory(transactions: Transaction[], monthsBack = 3): Record<string, number> {
  const months = summarizeByMonth(transactions).slice(-monthsBack)
  const denom = Math.max(1, months.length)
  const totals: Record<string, number> = {}
  for (const month of months) {
    for (const [cat, amount] of Object.entries(month.byCategory)) {
      totals[cat] = (totals[cat] ?? 0) + amount
    }
  }
  for (const cat of Object.keys(totals)) totals[cat] = totals[cat] / denom
  return totals
}

/** Percentage change of `current` vs `previous`, or null when there's no previous value to compare against. */
export function monthOverMonthDelta(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

export function averageMonthlyIncomeExpense(transactions: Transaction[], monthsBack = 3) {
  const months = summarizeByMonth(transactions).slice(-monthsBack)
  const denom = Math.max(1, months.length)
  const income = months.reduce((sum, m) => sum + m.income, 0) / denom
  const expense = months.reduce((sum, m) => sum + m.expense, 0) / denom
  return { income, expense, net: income - expense }
}

export interface ProjectedMonth {
  key: string
  projectedIncome: number
  projectedExpense: number
  projectedNet: number
}

/** Projects the next N months forward using the average of the last few months plus known recurring transactions. */
export function projectForward(transactions: Transaction[], monthsAhead = 3, lookback = 3): ProjectedMonth[] {
  const { income, expense } = averageMonthlyIncomeExpense(transactions, lookback)
  const recurringIncome = sumRecurring(transactions, 'income')
  const recurringExpense = sumRecurring(transactions, 'expense')
  // Blend the historical average with known recurring commitments so a single big one-off
  // month doesn't overly skew the projection.
  const baseIncome = Math.max(income, recurringIncome)
  const baseExpense = Math.max(expense, recurringExpense)

  const start = currentMonthKey()
  const result: ProjectedMonth[] = []
  for (let i = 1; i <= monthsAhead; i++) {
    const key = addMonthsToKey(start, i)
    result.push({ key, projectedIncome: baseIncome, projectedExpense: baseExpense, projectedNet: baseIncome - baseExpense })
  }
  return result
}

function sumRecurring(transactions: Transaction[], type: 'income' | 'expense'): number {
  const seen = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== type || !tx.recurring) continue
    const dedupeKey = `${tx.categoryId ?? 'na'}:${tx.description.toLowerCase()}`
    seen.set(dedupeKey, tx.amount)
  }
  return [...seen.values()].reduce((sum, v) => sum + v, 0)
}

export interface CutSuggestion {
  categoryId: CategoryId
  label: string
  emoji: string
  avgMonthly: number
  cutPct: number
  cutAmount: number
}

const CUT_TIERS = [0.3, 0.2, 0.15, 0.1]

/** Suggests percentage cuts on the biggest discretionary categories, biggest spend cut first. */
export function suggestCuts(transactions: Transaction[], monthsBack = 3, maxSuggestions = 4): CutSuggestion[] {
  const averages = averageMonthlyByCategory(transactions, monthsBack)
  const discretionary = CATEGORIES.filter((c) => !c.essential)
    .map((c) => ({ category: c, avgMonthly: averages[c.id] ?? 0 }))
    .filter((c) => c.avgMonthly > 5)
    .sort((a, b) => b.avgMonthly - a.avgMonthly)
    .slice(0, maxSuggestions)

  return discretionary.map((entry, index) => {
    const cutPct = CUT_TIERS[Math.min(index, CUT_TIERS.length - 1)]
    const cutAmount = entry.avgMonthly * cutPct
    return {
      categoryId: entry.category.id,
      label: entry.category.label,
      emoji: entry.category.emoji,
      avgMonthly: entry.avgMonthly,
      cutPct,
      cutAmount,
    }
  })
}

export interface GoalProgress {
  goal: Goal
  remaining: number
  progressPct: number
  monthsToReachCurrentPace: number | null
  monthsToReachWithCuts: number | null
  monthlyContribution: number
  monthlyContributionWithCuts: number
}

/**
 * Estimates time-to-goal by splitting the household's average monthly net savings evenly
 * across all still-open goals, then shows how much sooner suggested cuts would get there.
 */
export function computeGoalProgress(
  goals: Goal[],
  transactions: Transaction[],
  monthsBack = 3,
): GoalProgress[] {
  const { net } = averageMonthlyIncomeExpense(transactions, monthsBack)
  const totalCuts = suggestCuts(transactions, monthsBack).reduce((sum, c) => sum + c.cutAmount, 0)
  const openGoals = goals.filter((g) => g.currentAmount < g.targetAmount)
  const share = openGoals.length > 0 ? Math.max(net, 0) / openGoals.length : 0
  const shareWithCuts = openGoals.length > 0 ? Math.max(net + totalCuts, 0) / openGoals.length : 0

  return goals.map((goal) => {
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
    const progressPct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0
    const isOpen = goal.currentAmount < goal.targetAmount
    const monthlyContribution = isOpen ? share : 0
    const monthlyContributionWithCuts = isOpen ? shareWithCuts : 0
    return {
      goal,
      remaining,
      progressPct,
      monthlyContribution,
      monthlyContributionWithCuts,
      monthsToReachCurrentPace: monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : null,
      monthsToReachWithCuts: monthlyContributionWithCuts > 0 ? Math.ceil(remaining / monthlyContributionWithCuts) : null,
    }
  })
}
