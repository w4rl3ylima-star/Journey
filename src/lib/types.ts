import type { CategoryId } from './categories'

export type TransactionType = 'expense' | 'income'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: CategoryId | null
  description: string
  /** ISO date (yyyy-mm-dd) of when the expense/income happened. */
  date: string
  /** True for expenses/income that repeat every month (rent, salary, subscriptions...). */
  recurring: boolean
  createdVia: 'voice' | 'text'
  createdAt: string
}

export interface Goal {
  id: string
  name: string
  emoji: string
  targetAmount: number
  currentAmount: number
  /** ISO date the user wants to reach the goal by, optional. */
  targetDate: string | null
  createdAt: string
}

export interface AppData {
  transactions: Transaction[]
  goals: Goal[]
}
