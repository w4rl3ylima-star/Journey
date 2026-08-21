import { useState } from 'react'
import type { Goal } from '../lib/types'

interface GoalFormProps {
  onClose: () => void
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
}

const EMOJI_OPTIONS = ['🎯', '✈️', '🏡', '🚗', '🎓', '💍', '👶', '🩺', '🖥️', '🐷']

export function GoalForm({ onClose, onSave }: GoalFormProps) {
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0])
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const canSave = name.trim().length > 0 && Number(targetAmount) > 0

  const handleSave = () => {
    if (!canSave) return
    onSave({
      name: name.trim(),
      emoji,
      targetAmount: Number(targetAmount.replace(',', '.')),
      currentAmount: Number(currentAmount.replace(',', '.')) || 0,
      targetDate: targetDate || null,
    })
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-white pb-[calc(env(safe-area-inset-bottom)+16px)] dark:bg-[#141413]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-black/5 bg-white px-5 py-4 dark:border-white/5 dark:bg-[#141413]">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Nova meta</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl transition-colors ${
                  emoji === e ? 'bg-teal-500' : 'bg-neutral-100 dark:bg-white/5'
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">Nome da meta</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Viagem para a praia"
              className="w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">Valor alvo</p>
              <input
                type="number"
                inputMode="decimal"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">Já tenho</p>
              <input
                type="number"
                inputMode="decimal"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">Data alvo (opcional)</p>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="w-full rounded-2xl bg-teal-500 py-4 text-base font-semibold text-white transition-opacity disabled:opacity-30"
          >
            Criar meta
          </button>
        </div>
      </div>
    </div>
  )
}
