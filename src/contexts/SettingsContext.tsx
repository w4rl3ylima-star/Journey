import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { translate, categoryLabel, categoryShort, type CurrencyCode, type Language } from '../lib/i18n'
import { formatCurrency as formatCurrencyBase, formatCurrencyCompact as formatCurrencyCompactBase, formatMonthLabel as formatMonthLabelBase, formatDateLabel as formatDateLabelBase } from '../lib/format'

export type Theme = 'light' | 'dark' | 'system'

interface StoredSettings {
  theme: Theme
  currency: CurrencyCode
  language: Language
}

const STORAGE_KEY = 'journey.settings.v1'
const DATA_STORAGE_KEY = 'journey.data.v1'

const DEFAULT_SETTINGS: StoredSettings = { theme: 'system', currency: 'BRL', language: 'pt-BR' }

function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function getSystemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

interface SettingsContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  isDark: boolean
  currency: CurrencyCode
  language: Language
  setTheme: (theme: Theme) => void
  setCurrency: (currency: CurrencyCode) => void
  setLanguage: (language: Language) => void
  t: (key: string, ptFallback: string, vars?: Record<string, string>) => string
  categoryLabel: (id: string, ptFallback: string) => string
  categoryShort: (id: string, ptFallback: string) => string
  formatCurrency: (value: number) => string
  formatCurrencyCompact: (value: number) => string
  formatMonthLabel: (monthKey: string) => string
  formatDateLabel: (iso: string) => string
  resetAllData: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(() => loadSettings())
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches)
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    settings.theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : settings.theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  const setTheme = useCallback((theme: Theme) => setSettings((s) => ({ ...s, theme })), [])
  const setCurrency = useCallback((currency: CurrencyCode) => setSettings((s) => ({ ...s, currency })), [])
  const setLanguage = useCallback((language: Language) => setSettings((s) => ({ ...s, language })), [])

  const t = useCallback(
    (key: string, ptFallback: string, vars?: Record<string, string>) => translate(settings.language, key, ptFallback, vars),
    [settings.language],
  )

  const resetAllData = useCallback(() => {
    localStorage.removeItem(DATA_STORAGE_KEY)
    window.location.reload()
  }, [])

  const value = useMemo<SettingsContextValue>(
    () => ({
      theme: settings.theme,
      resolvedTheme,
      isDark: resolvedTheme === 'dark',
      currency: settings.currency,
      language: settings.language,
      setTheme,
      setCurrency,
      setLanguage,
      t,
      categoryLabel: (id: string, ptFallback: string) => categoryLabel(settings.language, id, ptFallback),
      categoryShort: (id: string, ptFallback: string) => categoryShort(settings.language, id, ptFallback),
      formatCurrency: (value: number) => formatCurrencyBase(value, settings.language, settings.currency),
      formatCurrencyCompact: (value: number) => formatCurrencyCompactBase(value, settings.language, settings.currency),
      formatMonthLabel: (monthKey: string) => formatMonthLabelBase(monthKey, settings.language),
      formatDateLabel: (iso: string) => formatDateLabelBase(iso, settings.language),
      resetAllData,
    }),
    [settings, resolvedTheme, setTheme, setCurrency, setLanguage, t, resetAllData],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider')
  return ctx
}
