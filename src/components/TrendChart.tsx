import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MonthSummary, ProjectedMonth } from '../lib/projections'
import { chartChrome } from '../lib/chartTheme'
import { useIsDarkMode } from '../hooks/useColorScheme'
import { useSettings } from '../contexts/SettingsContext'

interface TrendChartProps {
  history: MonthSummary[]
  projected: ProjectedMonth[]
}

const INCOME_COLOR = { light: '#1baf7a', dark: '#199e70' }
const EXPENSE_COLOR = { light: '#e34948', dark: '#e66767' }

interface Point {
  key: string
  label: string
  incomeActual: number | null
  incomeProjected: number | null
  expenseActual: number | null
  expenseProjected: number | null
  pctOfIncome: number | null
}

export function TrendChart({ history, projected }: TrendChartProps) {
  const isDark = useIsDarkMode()
  const chrome = chartChrome(isDark)
  const { t, formatCurrency, formatCurrencyCompact, formatMonthLabel } = useSettings()
  const income = isDark ? INCOME_COLOR.dark : INCOME_COLOR.light
  const expense = isDark ? EXPENSE_COLOR.dark : EXPENSE_COLOR.light
  const incomeLabel = t('dashboard.trend.legend.income', 'Receita')
  const expenseLabel = t('dashboard.trend.legend.expense', 'Despesa')
  const forecastSuffix = ` (${t('dashboard.trend.legend.forecast', 'projeção')})`

  const points: Point[] = history.map((m) => ({
    key: m.key,
    label: formatMonthLabel(m.key),
    incomeActual: m.income,
    incomeProjected: null,
    expenseActual: m.expense,
    expenseProjected: null,
    pctOfIncome: m.income > 0 ? (m.expense / m.income) * 100 : null,
  }))

  if (points.length > 0 && projected.length > 0) {
    const bridge = points[points.length - 1]
    bridge.incomeProjected = bridge.incomeActual
    bridge.expenseProjected = bridge.expenseActual
  }

  for (const p of projected) {
    points.push({
      key: p.key,
      label: formatMonthLabel(p.key),
      incomeActual: null,
      incomeProjected: p.projectedIncome,
      expenseActual: null,
      expenseProjected: p.projectedExpense,
      pctOfIncome: p.projectedIncome > 0 ? (p.projectedExpense / p.projectedIncome) * 100 : null,
    })
  }

  return (
    <div style={{ width: '100%', height: 232 }}>
      <ResponsiveContainer>
        <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="trendIncomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={income} stopOpacity={0.22} />
              <stop offset="100%" stopColor={income} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="trendExpenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={expense} stopOpacity={0.22} />
              <stop offset="100%" stopColor={expense} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chrome.gridline} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: chrome.muted, fontSize: 11 }} tickLine={false} axisLine={{ stroke: chrome.baseline }} />
          <YAxis
            tick={{ fill: chrome.muted, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => formatCurrencyCompact(v)}
          />
          <Tooltip
            content={
              <TrendTooltip
                chrome={chrome}
                incomeLabel={incomeLabel}
                expenseLabel={expenseLabel}
                forecastSuffix={forecastSuffix}
                formatCurrency={formatCurrency}
                pctSuffix={(pct) => t('dashboard.expenseIsPctOfIncome', 'despesa = {pct}% da renda', { pct: pct.toFixed(0) })}
              />
            }
          />
          <Area type="monotone" dataKey="incomeActual" stroke="none" fill="url(#trendIncomeFill)" connectNulls={false} />
          <Area type="monotone" dataKey="expenseActual" stroke="none" fill="url(#trendExpenseFill)" connectNulls={false} />
          <Line type="monotone" dataKey="incomeActual" name={incomeLabel} stroke={income} strokeWidth={2.5} dot={{ r: 3.5 }} connectNulls={false} />
          <Line
            type="monotone"
            dataKey="incomeProjected"
            name={`${incomeLabel}${forecastSuffix}`}
            stroke={income}
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={{ r: 3.5 }}
            connectNulls
          />
          <Line type="monotone" dataKey="expenseActual" name={expenseLabel} stroke={expense} strokeWidth={2.5} dot={{ r: 3.5 }} connectNulls={false} />
          <Line
            type="monotone"
            dataKey="expenseProjected"
            name={`${expenseLabel}${forecastSuffix}`}
            stroke={expense}
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={{ r: 3.5 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-1 flex items-center justify-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <LegendDot color={income} label={incomeLabel} />
        <LegendDot color={expense} label={expenseLabel} />
        <span className="text-neutral-300 dark:text-neutral-600">┄ {t('dashboard.trend.legend.forecast', 'projeção')}</span>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

interface TooltipEntry {
  dataKey?: string | number
  value?: number | string | null
  stroke?: string
  payload?: Point
}

/**
 * Custom tooltip: the chart renders an Area and a Line per series sharing the same dataKey (the
 * fill is decorative), so Recharts' default tooltip would list each value twice. This filters to
 * the stroked (Line) entries only, in a fixed income-then-expense order.
 */
function TrendTooltip({
  active,
  payload,
  label,
  chrome,
  incomeLabel,
  expenseLabel,
  forecastSuffix,
  formatCurrency,
  pctSuffix,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  chrome: ReturnType<typeof chartChrome>
  incomeLabel: string
  expenseLabel: string
  forecastSuffix: string
  formatCurrency: (value: number) => string
  pctSuffix: (pct: number) => string
}) {
  if (!active || !payload || payload.length === 0) return null

  const seen = new Set<string>()
  const rows = payload
    .filter((entry) => entry.stroke && entry.stroke !== 'none' && entry.value !== null && entry.value !== undefined)
    .filter((entry) => {
      const key = String(entry.dataKey ?? '')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => String(a.dataKey).localeCompare(String(b.dataKey)))
    .map((entry) => {
      const key = String(entry.dataKey ?? '')
      const isProjected = key.endsWith('Projected')
      const isIncome = key.startsWith('income')
      return {
        key,
        color: entry.stroke ?? chrome.textPrimary,
        label: `${isIncome ? incomeLabel : expenseLabel}${isProjected ? forecastSuffix : ''}`,
        value: formatCurrency(Number(entry.value)),
      }
    })

  // The bridge month between actual and forecast repeats the same value under both an "Actual"
  // and a "Projected" dataKey so the line segments connect; only show it once there.
  const actualValues = new Map(rows.filter((r) => r.key.endsWith('Actual')).map((r) => [r.key.replace('Actual', ''), r.value]))
  const finalRows = rows.filter((r) => {
    if (!r.key.endsWith('Projected')) return true
    return actualValues.get(r.key.replace('Projected', '')) !== r.value
  })

  const pct = payload[0]?.payload?.pctOfIncome
  const heading = pct !== null && pct !== undefined ? `${label} · ${pctSuffix(pct)}` : label

  return (
    <div
      style={{
        background: chrome.surface,
        border: `1px solid ${chrome.gridline}`,
        borderRadius: 12,
        padding: '8px 12px',
        fontSize: 12,
        color: chrome.textPrimary,
      }}
    >
      <p style={{ margin: '0 0 4px', color: chrome.textSecondary, fontSize: 11 }}>{heading}</p>
      {finalRows.map((row) => (
        <p key={row.key} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: row.color, display: 'inline-block' }} />
          <span>
            {row.label}: <strong>{row.value}</strong>
          </span>
        </p>
      ))}
    </div>
  )
}
