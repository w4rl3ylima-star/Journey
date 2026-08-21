import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getCategory, type CategoryId } from '../lib/categories'
import { formatCurrency, formatCurrencyCompact } from '../lib/format'
import { categoryColor, chartChrome } from '../lib/chartTheme'
import { useIsDarkMode } from '../hooks/useColorScheme'

interface CategoryBarChartProps {
  byCategory: Record<string, number>
  income: number
}

interface Row {
  categoryId: CategoryId
  label: string
  emoji: string
  amount: number
  pctOfIncome: number | null
}

export function CategoryBarChart({ byCategory, income }: CategoryBarChartProps) {
  const isDark = useIsDarkMode()
  const chrome = chartChrome(isDark)

  const rows: Row[] = Object.entries(byCategory)
    .map(([id, amount]) => {
      const cat = getCategory(id as CategoryId)
      return {
        categoryId: cat.id,
        label: cat.label,
        emoji: cat.emoji,
        amount,
        pctOfIncome: income > 0 ? (amount / income) * 100 : null,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-black/10 text-sm text-neutral-400 dark:border-white/10">
        Nenhuma despesa neste mês ainda.
      </div>
    )
  }

  const height = Math.max(160, rows.length * 44)

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }} barCategoryGap={10}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={112}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chrome.textSecondary, fontSize: 12 }}
            tickFormatter={(value: string) => {
              const row = rows.find((r) => r.label === value)
              return row ? `${row.emoji} ${value}` : value
            }}
          />
          <Tooltip
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
            contentStyle={{
              background: chrome.surface,
              border: `1px solid ${chrome.gridline}`,
              borderRadius: 12,
              fontSize: 12,
              color: chrome.textPrimary,
            }}
            formatter={(value, _name, item) => {
              const row = item.payload as Row
              const pct = row.pctOfIncome !== null ? ` · ${row.pctOfIncome.toFixed(0)}% da renda` : ''
              return [`${formatCurrency(Number(value))}${pct}`, row.label]
            }}
            labelFormatter={() => ''}
          />
          <Bar dataKey="amount" radius={[0, 8, 8, 0]} maxBarSize={22}>
            {rows.map((row) => (
              <Cell key={row.categoryId} fill={categoryColor(getCategory(row.categoryId), isDark)} />
            ))}
            <LabelList
              dataKey="amount"
              position="right"
              formatter={(value: unknown) => formatCurrencyCompact(Number(value))}
              style={{ fill: chrome.textPrimary, fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
