import type { AppData, Transaction, Goal } from './types'

const STORAGE_KEY = 'journey.data.v1'

const EMPTY_DATA: AppData = { transactions: [], goals: [] }

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_DATA
    const parsed = JSON.parse(raw) as AppData
    return {
      transactions: parsed.transactions ?? [],
      goals: parsed.goals ?? [],
    }
  } catch {
    return EMPTY_DATA
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function makeId(): string {
  return (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

export function todayISO(): string {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

export function newTransaction(partial: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  return { ...partial, id: makeId(), createdAt: new Date().toISOString() }
}

export function newGoal(partial: Omit<Goal, 'id' | 'createdAt'>): Goal {
  return { ...partial, id: makeId(), createdAt: new Date().toISOString() }
}
