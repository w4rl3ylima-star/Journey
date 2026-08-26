import { useCallback, useEffect, useRef, useState } from 'react'
import { CATEGORIES, type CategoryId } from '../lib/categories'
import { parseEntry } from '../lib/parse'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { todayISO } from '../lib/storage'
import type { Transaction } from '../lib/types'
import { useIsDarkMode } from '../hooks/useColorScheme'
import { categoryColor } from '../lib/chartTheme'
import { useSettings } from '../contexts/SettingsContext'
import { CURRENCIES } from '../lib/i18n'

interface AddSheetProps {
  /** Pass an existing transaction to edit it in place; omit to create a new one. */
  transaction?: Transaction
  onClose: () => void
  onSave: (entry: Omit<Transaction, 'id' | 'createdAt'>) => void
}

export function AddSheet({ transaction, onClose, onSave }: AddSheetProps) {
  const isEditing = !!transaction
  // Voice/text parsing understands casual Brazilian Portuguese phrasing regardless of the UI
  // language setting, so recognition stays pinned to pt-BR — switching it would break parsing.
  const speech = useSpeechRecognition('pt-BR')
  const isDark = useIsDarkMode()
  const { t, categoryLabel, currency } = useSettings()
  const currencySymbol = CURRENCIES.find((c) => c.id === currency)?.symbol ?? currency
  const [freeText, setFreeText] = useState('')
  const [usedVoice, setUsedVoice] = useState(transaction?.createdVia === 'voice')

  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [categoryId, setCategoryId] = useState<CategoryId | null>(transaction?.categoryId ?? null)
  const [type, setType] = useState<'expense' | 'income'>(transaction?.type ?? 'expense')
  const [recurring, setRecurring] = useState(transaction?.recurring ?? false)
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [date, setDate] = useState(transaction?.date ?? todayISO())

  // When editing, the fields start pre-filled from the existing transaction and "dirty" (protected
  // from the empty freeText field re-parsing over them); typing/dictating a fresh description
  // resets dirty back to false, same as starting a brand new entry.
  const dirty = useRef({
    amount: isEditing,
    category: isEditing,
    type: isEditing,
    recurring: isEditing,
    description: isEditing,
  })

  // Re-parses `text` and applies every field the user hasn't manually edited since the last
  // parse. Called directly (not only via the freeText effect below) so a final speech result
  // is always re-applied even when it's textually identical to the last interim transcript —
  // React skips the freeText state update (and thus that effect) when the value doesn't change.
  const applyParse = useCallback((text: string) => {
    if (!text.trim()) return
    const parsed = parseEntry(text)
    if (!dirty.current.amount && parsed.amount !== null) setAmount(String(parsed.amount))
    if (!dirty.current.category) setCategoryId(parsed.categoryId)
    if (!dirty.current.type) setType(parsed.type)
    if (!dirty.current.recurring) setRecurring(parsed.recurring)
    if (!dirty.current.description) setDescription(parsed.description)
  }, [])

  useEffect(() => {
    if (speech.isListening) setFreeText(speech.transcript)
  }, [speech.transcript, speech.isListening])

  useEffect(() => {
    if (!speech.isListening && speech.transcript) {
      dirty.current = { amount: false, category: false, type: false, recurring: false, description: false }
      setFreeText(speech.transcript)
      applyParse(speech.transcript)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.isListening])

  useEffect(() => {
    applyParse(freeText)
  }, [freeText, applyParse])

  const handleMicTap = () => {
    if (speech.isListening) {
      speech.stop()
    } else {
      dirty.current = { amount: false, category: false, type: false, recurring: false, description: false }
      setUsedVoice(true)
      speech.start()
    }
  }

  const numericAmount = Number(amount.replace(',', '.'))
  const canSave = numericAmount > 0

  const handleSave = () => {
    if (!canSave) return
    onSave({
      type,
      amount: numericAmount,
      categoryId: type === 'income' ? null : categoryId,
      description: description.trim() || (type === 'income' ? t('add.income', 'Receita') : t('add.expense', 'Despesa')),
      date,
      recurring,
      createdVia: usedVoice ? 'voice' : 'text',
    })
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="no-scrollbar max-h-[92dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-white pb-[calc(env(safe-area-inset-bottom)+16px)] dark:bg-[#141413]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-black/5 bg-white px-5 py-4 dark:border-white/5 dark:bg-[#141413]">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {isEditing ? t('add.editTitle', 'Editar lançamento') : t('add.title', 'Novo lançamento')}
          </h2>
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
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={freeText}
              onChange={(e) => {
                dirty.current = { amount: false, category: false, type: false, recurring: false, description: false }
                setFreeText(e.target.value)
              }}
              placeholder={isEditing ? t('add.editPlaceholder', 'Fale ou digite para refazer o lançamento') : t('add.placeholder', 'Ex: gastei 45 reais no mercado')}
              className="flex-1 rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            {speech.isSupported && (
              <button
                type="button"
                onClick={handleMicTap}
                aria-label={speech.isListening ? 'Parar gravação' : 'Falar lançamento'}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl text-white transition-colors ${
                  speech.isListening ? 'animate-pulse bg-red-500' : 'bg-teal-500'
                }`}
              >
                🎤
              </button>
            )}
          </div>
          {speech.isListening && (
            <p className="-mt-3 text-xs font-medium text-teal-600 dark:text-teal-400">
              {t('add.listening', 'Ouvindo… fale o gasto e toque no microfone de novo para parar.')}
            </p>
          )}
          {!speech.isSupported && (
            <p className="-mt-3 text-xs text-neutral-400">
              {t('add.notSupported', 'Entrada por voz não é suportada neste navegador — use o campo de texto.')}
            </p>
          )}
          {speech.error && <p className="-mt-3 text-xs text-red-500">{t('add.error', 'Não entendi o áudio, tente de novo.')}</p>}

          <div className="flex rounded-2xl bg-neutral-100 p-1 text-sm font-medium dark:bg-white/5">
            <button
              type="button"
              onClick={() => {
                setType('expense')
                dirty.current.type = true
              }}
              className={`flex-1 rounded-xl py-2 transition-colors ${
                type === 'expense' ? 'bg-white text-neutral-900 shadow dark:bg-[#2a2a28] dark:text-white' : 'text-neutral-400'
              }`}
            >
              {t('add.expense', 'Despesa')}
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income')
                dirty.current.type = true
              }}
              className={`flex-1 rounded-xl py-2 transition-colors ${
                type === 'income' ? 'bg-white text-neutral-900 shadow dark:bg-[#2a2a28] dark:text-white' : 'text-neutral-400'
              }`}
            >
              {t('add.income', 'Receita')}
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 rounded-2xl border border-black/10 px-4 py-4 dark:border-white/10">
            <span className="text-2xl font-semibold text-neutral-400">{currencySymbol}</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                dirty.current.amount = true
              }}
              placeholder="0,00"
              className="w-full max-w-[180px] bg-transparent text-center text-3xl font-semibold text-neutral-900 placeholder:text-neutral-300 focus:outline-none dark:text-white"
            />
          </div>

          {type === 'expense' && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">{t('add.category', 'Categoria')}</p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => {
                  const active = categoryId === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(cat.id)
                        dirty.current.category = true
                      }}
                      className="flex shrink-0 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition-transform active:scale-95"
                      style={{
                        backgroundColor: active ? categoryColor(cat, isDark) : isDark ? '#232322' : '#f3f3f1',
                        color: active ? '#ffffff' : isDark ? '#c3c2b7' : '#52514e',
                      }}
                    >
                      <span className="text-lg leading-none">{cat.emoji}</span>
                      {categoryLabel(cat.id, cat.label)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">{t('add.description', 'Descrição')}</p>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                dirty.current.description = true
              }}
              placeholder={t('add.descriptionPlaceholder', 'Ex: Mercado')}
              className="w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">{t('add.date', 'Data')}</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <label className="flex flex-1 items-center justify-end gap-2 text-sm text-neutral-600 dark:text-neutral-300">
              {t('add.recurring', 'Repete todo mês')}
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => {
                  setRecurring(e.target.checked)
                  dirty.current.recurring = true
                }}
                className="h-5 w-5 accent-teal-500"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="w-full rounded-2xl bg-teal-500 py-4 text-base font-semibold text-white transition-opacity disabled:opacity-30"
          >
            {isEditing ? t('add.saveChanges', 'Salvar alterações') : t('add.save', 'Salvar')}
          </button>
        </div>
      </div>
    </div>
  )
}
