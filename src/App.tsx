import { useState } from 'react'
import { useAppData } from './hooks/useAppData'
import { BottomNav, type View } from './components/BottomNav'
import { Dashboard } from './components/Dashboard'
import { TransactionsList } from './components/TransactionsList'
import { GoalsView } from './components/GoalsView'
import { AddSheet } from './components/AddSheet'
import { TopBar } from './components/TopBar'
import { SettingsSheet } from './components/SettingsSheet'
import type { Transaction } from './lib/types'

type TransactionFilter = 'all' | 'expense' | 'income'

function App() {
  const { transactions, goals, addTransaction, updateTransaction, removeTransaction, addGoal, updateGoal, removeGoal } =
    useAppData()
  const [view, setView] = useState<View>('dashboard')
  const [transactionsFilter, setTransactionsFilter] = useState<TransactionFilter>('all')
  const [addTarget, setAddTarget] = useState<'new' | Transaction | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const goToTransactions = (filter: TransactionFilter) => {
    setTransactionsFilter(filter)
    setView('transactions')
  }

  return (
    <>
      <TopBar onOpenSettings={() => setShowSettings(true)} />

      <main className="no-scrollbar flex-1 overflow-y-auto pb-4">
        {view === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            goals={goals}
            onViewGoals={() => setView('goals')}
            onViewIncome={() => goToTransactions('income')}
            onViewExpense={() => goToTransactions('expense')}
          />
        )}
        {view === 'transactions' && (
          <TransactionsList
            transactions={transactions}
            initialFilter={transactionsFilter}
            onEdit={(tx) => setAddTarget(tx)}
            onRemove={removeTransaction}
          />
        )}
        {view === 'goals' && (
          <GoalsView
            goals={goals}
            transactions={transactions}
            onAddGoal={addGoal}
            onUpdateGoal={updateGoal}
            onRemoveGoal={removeGoal}
          />
        )}
      </main>

      <BottomNav
        active={view}
        onNavigate={(v) => {
          if (v === 'transactions') setTransactionsFilter('all')
          setView(v)
        }}
        onAdd={() => setAddTarget('new')}
      />

      {addTarget && (
        <AddSheet
          transaction={addTarget === 'new' ? undefined : addTarget}
          onClose={() => setAddTarget(null)}
          onSave={(entry) => {
            if (addTarget === 'new') {
              addTransaction(entry)
            } else {
              updateTransaction(addTarget.id, entry)
            }
            setAddTarget(null)
          }}
        />
      )}

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </>
  )
}

export default App
