import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MonthSummary, ProjectedMonth } from '../lib/projections'
import { formatCurrency, formatCurrencyCompact, formatMonthLabel } from '../lib/format'
import { chartChrome } from '../lib/chartTheme'
import { useIsDarkMode } from '../hooks/useColorScheme'

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
}

export function TrendChart({ history, projected }: TrendChartProps) {
  const isDark = useIsDarkMode()
  const chrome = chartChrome(isDark)
  const income = isDark ? INCOME_COLOR.dark : INCOME_COLOR.light
  const expense = isDark ? EXPENSE_COLOR.dark : EXPENSE_COLOR.light

  const points: Point[] = history.map((m) => ({
    key: m.key,
    label: formatMonthLabel(m.key),
    incomeActual: m.income,
    incomeProjected: null,
    expenseActual: m.expense,
    expenseProjected: null,
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
    })
  }

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
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
            contentStyle={{
              background: chrome.surface,
              border: `1px solid ${chrome.gridline}`,
              borderRadius: 12,
              fontSize: 12,
              color: chrome.textPrimary,
            }}
            formatter={(value, name) => {
              if (value === null || value === undefined) return ['', '']
              const seriesName = String(name)
              const isProjected = seriesName.includes('projetad')
              const label = seriesName.includes('Receita') ? 'Receita' : 'Despesa'
              return [`${formatCurrency(Number(value))}${isProjected ? ' (projeção)' : ''}`, label]
            }}
          />
          <Line type="monotone" dataKey="incomeActual" name="Receita" stroke={income} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
          <Line
            type="monotone"
            dataKey="incomeProjected"
            name="Receita projetada"
            stroke={income}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            connectNulls
          />
          <Line type="monotone" dataKey="expenseActual" name="Despesa" stroke={expense} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
          <Line
            type="monotone"
            dataKey="expenseProjected"
            name="Despesa projetada"
            stroke={expense}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-1 flex items-center justify-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <LegendDot color={income} label="Receita" />
        <LegendDot color={expense} label="Despesa" />
        <span className="text-neutral-300 dark:text-neutral-600">┄ projeção</span>
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
