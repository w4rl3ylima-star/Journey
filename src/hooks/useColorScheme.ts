import { useEffect, useState } from 'react'

export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [])

  return isDark
}
