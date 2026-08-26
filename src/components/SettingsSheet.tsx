import { useSettings, type Theme } from '../contexts/SettingsContext'
import { CURRENCIES, LANGUAGES, type CurrencyCode, type Language } from '../lib/i18n'

interface SettingsSheetProps {
  onClose: () => void
}

export function SettingsSheet({ onClose }: SettingsSheetProps) {
  const { theme, setTheme, currency, setCurrency, language, setLanguage, t, resetAllData } = useSettings()

  const handleReset = () => {
    const confirmed = window.confirm(
      t(
        'settings.reset.confirm',
        'Isso apaga todos os lançamentos e metas deste aparelho. Não dá pra desfazer. Continuar?',
      ),
    )
    if (confirmed) resetAllData()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="no-scrollbar max-h-[92dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-white pb-[calc(env(safe-area-inset-bottom)+16px)] dark:bg-[#141413]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-black/5 bg-white px-5 py-4 dark:border-white/5 dark:bg-[#141413]">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{t('settings.title', 'Configurações')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {t('settings.theme', 'Tema')}
            </p>
            <div className="flex rounded-2xl bg-neutral-100 p-1 text-sm font-medium dark:bg-white/5">
              {(
                [
                  ['light', '☀️', t('settings.theme.light', 'Claro')],
                  ['dark', '🌙', t('settings.theme.dark', 'Escuro')],
                  ['system', '⚙️', t('settings.theme.system', 'Sistema')],
                ] as [Theme, string, string][]
              ).map(([id, icon, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 transition-colors ${
                    theme === id
                      ? 'bg-white text-neutral-900 shadow dark:bg-[#2a2a28] dark:text-white'
                      : 'text-neutral-400'
                  }`}
                >
                  <span aria-hidden>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {t('settings.currency', 'Moeda')}
            </p>
            <div className="flex flex-col gap-2">
              {CURRENCIES.map((c) => (
                <OptionRow
                  key={c.id}
                  active={currency === c.id}
                  onClick={() => setCurrency(c.id as CurrencyCode)}
                  leading={<span className="w-6 text-center font-semibold">{c.symbol}</span>}
                  label={`${c.label} (${c.id})`}
                />
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {t('settings.language', 'Idioma')}
            </p>
            <div className="flex flex-col gap-2">
              {LANGUAGES.map((l) => (
                <OptionRow
                  key={l.id}
                  active={language === l.id}
                  onClick={() => setLanguage(l.id as Language)}
                  leading={<span aria-hidden>{l.flag}</span>}
                  label={l.label}
                />
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {t('settings.data', 'Dados')}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="w-full rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-600 transition-colors dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
            >
              {t('settings.reset', 'Apagar todos os dados')}
            </button>
            <p className="mt-3 text-center text-xs text-neutral-400">
              {t('settings.about', 'O Journey guarda tudo localmente neste aparelho — nada é enviado para servidor.')}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

function OptionRow({
  active,
  onClick,
  leading,
  label,
}: {
  active: boolean
  onClick: () => void
  leading: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
        active
          ? 'border-teal-500 bg-teal-50 text-teal-700 dark:border-teal-400 dark:bg-teal-400/10 dark:text-teal-300'
          : 'border-black/10 text-neutral-600 dark:border-white/10 dark:text-neutral-300'
      }`}
    >
      {leading}
      <span className="flex-1">{label}</span>
      {active && <span aria-hidden>✓</span>}
    </button>
  )
}
