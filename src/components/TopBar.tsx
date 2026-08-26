import { useSettings } from '../contexts/SettingsContext'

interface TopBarProps {
  onOpenSettings: () => void
}

export function TopBar({ onOpenSettings }: TopBarProps) {
  const { t } = useSettings()

  return (
    <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-black/5 bg-white/90 px-5 py-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur dark:border-white/5 dark:bg-[#141413]/90">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-black text-white dark:bg-white dark:text-neutral-900">
          J
        </span>
        <span className="text-sm font-bold text-neutral-900 dark:text-white">{t('app.title', 'Journey')}</span>
      </div>
      <button
        type="button"
        onClick={onOpenSettings}
        aria-label={t('settings.title', 'Configurações')}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-500 transition-colors hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
      >
        ⚙️
      </button>
    </header>
  )
}
