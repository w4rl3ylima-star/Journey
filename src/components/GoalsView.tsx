import { useMemo, useState } from 'react'
import type { Goal, Transaction } from '../lib/types'
import { computeGoalProgress, suggestCuts } from '../lib/projections'
import { formatCurrency } from '../lib/format'
import { GoalForm } from './GoalForm'

interface GoalsViewProps {
  goals: Goal[]
  transactions: Transaction[]
  onAddGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  onUpdateGoal: (id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => void
  onRemoveGoal: (id: string) => void
}

export function GoalsView({ goals, transactions, onAddGoal, onUpdateGoal, onRemoveGoal }: GoalsViewProps) {
  const [showForm, setShowForm] = useState(false)
  const [contributingId, setContributingId] = useState<string | null>(null)

  const progress = useMemo(() => computeGoalProgress(goals, transactions), [goals, transactions])
  const cuts = useMemo(() => suggestCuts(transactions), [transactions])
  const totalCut = cuts.reduce((sum, c) => sum + c.cutAmount, 0)

  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Metas</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white"
        >
          + Nova meta
        </button>
      </header>

      {goals.length === 0 && (
        <p className="mt-6 text-center text-sm text-neutral-400">
          Você ainda não tem metas. Crie uma para receber sugestões de corte de gastos.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {progress.map((p) => (
          <GoalCard
            key={p.goal.id}
            progress={p}
            onContribute={() => setContributingId(p.goal.id)}
            onRemove={() => onRemoveGoal(p.goal.id)}
          />
        ))}
      </div>

      {cuts.length > 0 && (
        <section className="rounded-3xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-[#141413]">
          <h2 className="mb-1 text-sm font-semibold text-neutral-700 dark:text-neutral-200">💡 Sugestões de corte</h2>
          <p className="mb-3 text-xs text-neutral-400">
            Reduzindo estas categorias você economiza {formatCurrency(totalCut)}/mês a mais para suas metas.
          </p>
          <div className="flex flex-col gap-2.5">
            {cuts.map((c) => (
              <div key={c.categoryId} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700 dark:text-neutral-200">
                  {c.emoji} {c.label}
                </span>
                <span className="text-right text-neutral-500 dark:text-neutral-400">
                  corte de {(c.cutPct * 100).toFixed(0)}%{' '}
                  <span className="font-semibold text-teal-600 dark:text-teal-400">-{formatCurrency(c.cutAmount)}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {showForm && (
        <GoalForm
          onClose={() => setShowForm(false)}
          onSave={(goal) => {
            onAddGoal(goal)
            setShowForm(false)
          }}
        />
      )}

      {contributingId && (
        <ContributionModal
          onClose={() => setContributingId(null)}
          onConfirm={(amount) => {
            const goal = goals.find((g) => g.id === contributingId)
            if (goal) onUpdateGoal(goal.id, { currentAmount: goal.currentAmount + amount })
            setContributingId(null)
          }}
        />
      )}
    </div>
  )
}

function GoalCard({
  progress,
  onContribute,
  onRemove,
}: {
  progress: ReturnType<typeof computeGoalProgress>[number]
  onContribute: () => void
  onRemove: () => void
}) {
  const { goal, progressPct, remaining, monthsToReachCurrentPace, monthsToReachWithCuts } = progress
  const complete = goal.currentAmount >= goal.targetAmount

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-4 dark:border-white/5 dark:bg-[#141413]">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-neutral-900 dark:text-white">
            {goal.emoji} {goal.name}
          </p>
          <p className="text-xs text-neutral-400">
            {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
          </p>
        </div>
        <button type="button" onClick={onRemove} aria-label="Remover meta" className="text-neutral-300 hover:text-rose-500">
          ✕
        </button>
      </div>

      <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
        <div
          className={`h-full rounded-full ${complete ? 'bg-emerald-500' : 'bg-teal-500'}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {complete ? (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">🎉 Meta alcançada!</p>
      ) : (
        <div className="mb-3 flex flex-col gap-1 text-xs text-neutral-500 dark:text-neutral-400">
          <p>Faltam {formatCurrency(remaining)}</p>
          <p>
            {monthsToReachCurrentPace !== null
              ? `No ritmo atual: ~${monthsToReachCurrentPace} ${monthsToReachCurrentPace === 1 ? 'mês' : 'meses'}`
              : 'Adicione renda ou reduza despesas para estimar o prazo'}
          </p>
          {monthsToReachWithCuts !== null && monthsToReachCurrentPace !== null && monthsToReachWithCuts < monthsToReachCurrentPace && (
            <p className="font-medium text-teal-600 dark:text-teal-400">
              Com os cortes sugeridos: ~{monthsToReachWithCuts} {monthsToReachWithCuts === 1 ? 'mês' : 'meses'} 🚀
            </p>
          )}
        </div>
      )}

      {!complete && (
        <button
          type="button"
          onClick={onContribute}
          className="w-full rounded-2xl bg-neutral-100 py-2.5 text-sm font-semibold text-neutral-700 dark:bg-white/5 dark:text-neutral-200"
        >
          + Adicionar valor
        </button>
      )}
    </div>
  )
}

function ContributionModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (amount: number) => void }) {
  const [amount, setAmount] = useState('')
  const value = Number(amount.replace(',', '.'))

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-6" onClick={onClose}>
      <div
        className="w-full max-w-xs rounded-3xl bg-white p-5 dark:bg-[#141413]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">Adicionar valor à meta</p>
        <div className="mb-4 flex items-center justify-center gap-1 rounded-2xl border border-black/10 px-4 py-3 dark:border-white/10">
          <span className="text-xl font-semibold text-neutral-400">R$</span>
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="w-full max-w-[140px] bg-transparent text-center text-2xl font-semibold text-neutral-900 placeholder:text-neutral-300 focus:outline-none dark:text-white"
          />
        </div>
        <button
          type="button"
          disabled={!(value > 0)}
          onClick={() => onConfirm(value)}
          className="w-full rounded-2xl bg-teal-500 py-3 text-sm font-semibold text-white disabled:opacity-30"
        >
          Confirmar
        </button>
      </div>
    </div>
  )
}
