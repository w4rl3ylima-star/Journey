export type Language = 'pt-BR' | 'en-US'

export const LANGUAGES: { id: Language; label: string; flag: string }[] = [
  { id: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { id: 'en-US', label: 'English', flag: '🇺🇸' },
]

export type CurrencyCode = 'BRL' | 'USD' | 'EUR' | 'GBP'

export const CURRENCIES: { id: CurrencyCode; label: string; symbol: string }[] = [
  { id: 'BRL', label: 'Real brasileiro', symbol: 'R$' },
  { id: 'USD', label: 'US Dollar', symbol: '$' },
  { id: 'EUR', label: 'Euro', symbol: '€' },
  { id: 'GBP', label: 'British Pound', symbol: '£' },
]

/**
 * English strings, keyed by feature area. Portuguese needs no dictionary: the app is written
 * PT-first, so every call site passes the Portuguese copy inline as the fallback — see `t()`.
 */
const EN: Record<string, string> = {
  'app.title': 'Journey',
  'nav.dashboard': 'Home',
  'nav.transactions': 'History',
  'nav.goals': 'Goals',
  'nav.add': 'Add entry',

  'settings.title': 'Settings',
  'settings.appearance': 'Appearance',
  'settings.theme': 'Theme',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.theme.system': 'System',
  'settings.currency': 'Currency',
  'settings.language': 'Language',
  'settings.data': 'Data',
  'settings.reset': 'Erase all data',
  'settings.reset.confirm': 'This deletes every entry and goal from this device. This can\'t be undone. Continue?',
  'settings.about': 'Journey stores everything locally on this device — nothing is sent to a server.',

  'dashboard.greeting': 'Hi 👋',
  'dashboard.title': 'Your summary',
  'dashboard.balance': 'Balance this month',
  'dashboard.income': 'Income',
  'dashboard.expense': 'Expense',
  'dashboard.byCategory': 'Spending by category',
  'dashboard.pctOfIncome': '% of income',
  'dashboard.ofIncome': 'of income',
  'dashboard.totalSpent': 'Total spent',
  'dashboard.expenseIsPctOfIncome': 'expense = {pct}% of income',
  'dashboard.trend': 'Income x Expense',
  'dashboard.trend.projected': '+ forecast',
  'dashboard.trend.caption': 'Last months and the next 3, forecast from your recent average.',
  'dashboard.trend.caption.weekly': 'Last 8 weeks.',
  'dashboard.trend.caption.daily': 'Last 14 days.',
  'dashboard.trend.monthly': 'Monthly',
  'dashboard.trend.weekly': 'Weekly',
  'dashboard.trend.daily': 'By date',
  'dashboard.trend.legend.income': 'Income',
  'dashboard.trend.legend.expense': 'Expense',
  'dashboard.trend.legend.forecast': 'forecast',
  'dashboard.viewIncomeHint': 'Tap to see income entries',
  'dashboard.viewExpenseHint': 'Tap to see expense entries',
  'dashboard.goals': 'Your goals',
  'dashboard.goals.viewAll': 'View all',
  'dashboard.noExpenses': 'No expenses this month yet.',

  'add.title': 'New entry',
  'add.editTitle': 'Edit entry',
  'add.placeholder': 'e.g. spent 45 on groceries',
  'add.editPlaceholder': 'Speak or type to redo this entry',
  'add.listening': 'Listening… say the expense and tap the mic again to stop.',
  'add.notSupported': 'Voice input isn\'t supported in this browser — use the text field.',
  'add.error': 'Couldn\'t understand the audio, try again.',
  'add.expense': 'Expense',
  'add.income': 'Income',
  'add.category': 'Category',
  'add.description': 'Description',
  'add.descriptionPlaceholder': 'e.g. Groceries',
  'add.date': 'Date',
  'add.recurring': 'Repeats monthly',
  'add.save': 'Save',
  'add.saveChanges': 'Save changes',

  'tx.title': 'History',
  'tx.all': 'All',
  'tx.expenses': 'Expenses',
  'tx.income': 'Income',
  'tx.empty': 'No entries yet. Tap + to get started.',
  'tx.income.label': 'Income',
  'tx.monthly': 'monthly',
  'tx.editHint': 'Tap to edit this entry',

  'goals.title': 'Goals',
  'goals.new': '+ New goal',
  'goals.empty': 'You don\'t have any goals yet. Create one to get spending-cut suggestions.',
  'goals.of': 'of',
  'goals.remaining': 'Remaining',
  'goals.pace': 'At the current pace',
  'goals.month': 'month',
  'goals.months': 'months',
  'goals.needMoreData': 'Add income or cut expenses to estimate a timeline',
  'goals.withCuts': 'With the suggested cuts',
  'goals.complete': '🎉 Goal reached!',
  'goals.addAmount': '+ Add amount',
  'goals.editHint': 'Tap to edit this goal',
  'goals.cutSuggestions': '💡 Cut suggestions',
  'goals.cutSuggestions.caption': 'Trimming these categories frees up {amount}/month more for your goals.',
  'goals.cutOf': 'cut of',

  'goalForm.title': 'New goal',
  'goalForm.editTitle': 'Edit goal',
  'goalForm.save': 'Save changes',
  'goalForm.name': 'Goal name',
  'goalForm.namePlaceholder': 'e.g. Beach trip',
  'goalForm.target': 'Target amount',
  'goalForm.current': 'Already have',
  'goalForm.targetDate': 'Target date (optional)',
  'goalForm.create': 'Create goal',

  'contribution.title': 'Add amount to goal',
  'contribution.confirm': 'Confirm',

  'category.alimentacao.label': 'Food',
  'category.alimentacao.short': 'Food',
  'category.transporte.label': 'Transport',
  'category.transporte.short': 'Transport',
  'category.moradia.label': 'Housing',
  'category.moradia.short': 'Housing',
  'category.contas.label': 'Bills & Utilities',
  'category.contas.short': 'Bills',
  'category.lazer.label': 'Entertainment',
  'category.lazer.short': 'Fun',
  'category.compras.label': 'Shopping',
  'category.compras.short': 'Shopping',
  'category.assinaturas.label': 'Subscriptions',
  'category.assinaturas.short': 'Subs',
  'category.saude.label': 'Health',
  'category.saude.short': 'Health',
  'category.educacao.label': 'Education',
  'category.educacao.short': 'Education',
  'category.outros.label': 'Other',
  'category.outros.short': 'Other',
}

export function categoryLabel(language: Language, id: string, ptFallback: string): string {
  return translate(language, `category.${id}.label`, ptFallback)
}

export function categoryShort(language: Language, id: string, ptFallback: string): string {
  return translate(language, `category.${id}.short`, ptFallback)
}

export function translate(language: Language, key: string, ptFallback: string, vars?: Record<string, string>): string {
  const base = language === 'pt-BR' ? ptFallback : (EN[key] ?? ptFallback)
  if (!vars) return base
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), base)
}
