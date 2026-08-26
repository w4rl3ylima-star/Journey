import { useSettings } from '../contexts/SettingsContext'

/** Resolves the user's Settings → Theme choice (light/dark/system) to a boolean. */
export function useIsDarkMode(): boolean {
  return useSettings().isDark
}
