import { useState } from 'react'
import { useAppData } from './hooks/useAppData'
import { BottomNav, type View } from './components/BottomNav'
import { Dashboard } from './components/Dashboard'
import { TransactionsList } from './components/TransactionsList'
import { GoalsView } from './components/GoalsView'
import { AddSheet } from './components/AddSheet'

function App() {
  const { transactions, goals, addTransaction, removeTransaction, addGoal, updateGoal, removeGoal } = useAppData()
  const [view, setView] = useState<View>('dashboard')
  const [showAdd, setShowAdd] = useState(false)

  return (
    <>
      <main className="no-scrollbar flex-1 overflow-y-auto pb-4">
        {view === 'dashboard' && (
          <Dashboard transactions={transactions} goals={goals} onViewGoals={() => setView('goals')} />
        )}
        {view === 'transactions' && <TransactionsList transactions={transactions} onRemove={removeTransaction} />}
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

      <BottomNav active={view} onNavigate={setView} onAdd={() => setShowAdd(true)} />

      {showAdd && (
        <AddSheet
          onClose={() => setShowAdd(false)}
          onSave={(entry) => {
            addTransaction(entry)
            setShowAdd(false)
          }}
        />
      )}
    </>
  )
}

export default App
