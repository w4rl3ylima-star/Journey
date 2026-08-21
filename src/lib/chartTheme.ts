import type { CategoryMeta } from './categories'

export const CHART_CHROME = {
  light: {
    surface: '#fcfcfb',
    page: '#f9f9f7',
    textPrimary: '#0b0b0b',
    textSecondary: '#52514e',
    muted: '#898781',
    gridline: '#e1e0d9',
    baseline: '#c3c2b7',
  },
  dark: {
    surface: '#1a1a19',
    page: '#0d0d0d',
    textPrimary: '#ffffff',
    textSecondary: '#c3c2b7',
    muted: '#898781',
    gridline: '#2c2c2a',
    baseline: '#383835',
  },
} as const

export const STATUS = {
  light: { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' },
  dark: { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' },
} as const

export function categoryColor(category: CategoryMeta, isDark: boolean): string {
  return isDark ? category.colorDark : category.colorLight
}

export function chartChrome(isDark: boolean) {
  return isDark ? CHART_CHROME.dark : CHART_CHROME.light
}
