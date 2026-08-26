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

function App() {
  const { transactions, goals, addTransaction, updateTransaction, removeTransaction, addGoal, updateGoal, removeGoal } =
    useAppData()
  const [view, setView] = useState<View>('dashboard')
  const [addTarget, setAddTarget] = useState<'new' | Transaction | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <TopBar onOpenSettings={() => setShowSettings(true)} />

      <main className="no-scrollbar flex-1 overflow-y-auto pb-4">
        {view === 'dashboard' && (
          <Dashboard transactions={transactions} goals={goals} onViewGoals={() => setView('goals')} />
        )}
        {view === 'transactions' && (
          <TransactionsList transactions={transactions} onEdit={(tx) => setAddTarget(tx)} onRemove={removeTransaction} />
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

      <BottomNav active={view} onNavigate={setView} onAdd={() => setAddTarget('new')} />

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
