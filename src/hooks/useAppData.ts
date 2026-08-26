import { useCallback, useEffect, useState } from 'react'
import type { AppData, Goal, Transaction } from '../lib/types'
import { loadData, saveData, newTransaction, newGoal } from '../lib/storage'

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  const addTransaction = useCallback((partial: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tx = newTransaction(partial)
    setData((prev) => ({ ...prev, transactions: [tx, ...prev.transactions] }))
    return tx
  }, [])

  const updateTransaction = useCallback((id: string, patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }, [])

  const removeTransaction = useCallback((id: string) => {
    setData((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => t.id !== id) }))
  }, [])

  const addGoal = useCallback((partial: Omit<Goal, 'id' | 'createdAt'>) => {
    const goal = newGoal(partial)
    setData((prev) => ({ ...prev, goals: [goal, ...prev.goals] }))
    return goal
  }, [])

  const updateGoal = useCallback((id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }))
  }, [])

  const removeGoal = useCallback((id: string) => {
    setData((prev) => ({ ...prev, goals: prev.goals.filter((g) => g.id !== id) }))
  }, [])

  return {
    transactions: data.transactions,
    goals: data.goals,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addGoal,
    updateGoal,
    removeGoal,
  }
}
