import { CATEGORIES, type CategoryId } from './categories'

export interface ParsedEntry {
  amount: number | null
  categoryId: CategoryId | null
  type: 'expense' | 'income'
  recurring: boolean
  description: string
}

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalize(text: string): string {
  return stripAccents(text.toLowerCase()).trim()
}

const UNITS: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13,
  catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
}
const TENS: Record<string, number> = {
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90,
}
const HUNDREDS: Record<string, number> = {
  cem: 100, cento: 100, duzentos: 200, trezentos: 300, quatrocentos: 400,
  quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900,
}
const NUMBER_WORDS = new Set([...Object.keys(UNITS), ...Object.keys(TENS), ...Object.keys(HUNDREDS), 'mil', 'e'])

// Matches a spoken 0-99 cents value like "quarenta" or "quarenta e cinco".
const CENTS_WORDS_PATTERN = `(?:(?:${Object.keys(TENS).join('|')})(?:\\s+e\\s+(?:${Object.keys(UNITS).join('|')}))?|${Object.keys(UNITS).join('|')})`

/** Converts a run of Portuguese number words (e.g. "cento e vinte") into a number. */
function wordsToNumber(tokens: string[]): number {
  let total = 0
  let current = 0
  for (const token of tokens) {
    if (token === 'e') continue
    if (token === 'mil') {
      current = current === 0 ? 1000 : current * 1000
      total += current
      current = 0
    } else if (token in HUNDREDS) {
      current += HUNDREDS[token]
    } else if (token in TENS) {
      current += TENS[token]
    } else if (token in UNITS) {
      current += UNITS[token]
    }
  }
  return total + current
}

/** Finds the longest run of number-words in the text and converts it to a value. */
function extractWordAmount(normalized: string): number | null {
  const tokens = normalized.split(/\s+/)
  let bestRun: string[] = []
  let currentRun: string[] = []
  for (const token of tokens) {
    if (NUMBER_WORDS.has(token)) {
      currentRun.push(token)
      if (currentRun.length > bestRun.length) bestRun = currentRun
    } else {
      currentRun = []
    }
  }
  if (bestRun.length === 0) return null
  const cleaned = bestRun.filter((t, i) => !(t === 'e' && (i === 0 || i === bestRun.length - 1)))
  const value = wordsToNumber(cleaned)
  return value > 0 ? value : null
}

/** Extracts a monetary amount from free text, trying digits first, then spelled-out numbers. */
export function extractAmount(rawText: string): number | null {
  const normalized = normalize(rawText)

  // "cinquenta reais e trinta centavos" / "50 reais e 30 centavos"
  const centsWordMatch = normalized.match(/([\d.,]+|[a-z\s]+?)\s*reais?\s+e\s+([\d.,]+|[a-z\s]+?)\s*centavos?/)
  if (centsWordMatch) {
    const whole = parseAmountToken(centsWordMatch[1].trim()) ?? 0
    const cents = parseAmountToken(centsWordMatch[2].trim()) ?? 0
    if (whole || cents) return whole + cents / 100
  }

  // "145 e 40" / "145 reais e 40" -> 145,40: voice input often says the decimal part joined by
  // "e" instead of a comma, either as digits or spelled out.
  const centsDigitMatch = normalized.match(/\b(\d+)(?:\s*reais?)?\s+e\s+(\d{1,2})\b(?!\d)(?!\s*reais?)/)
  if (centsDigitMatch) {
    const whole = Number(centsDigitMatch[1])
    const cents = Number(centsDigitMatch[2])
    if (!Number.isNaN(whole)) return whole + cents / 100
  }

  // "145 e quarenta" / "145 reais e quarenta e cinco" -> 145,40 / 145,45
  const centsDigitWordMatch = normalized.match(
    new RegExp(`\\b(\\d+)(?:\\s*reais?)?\\s+e\\s+(${CENTS_WORDS_PATTERN})\\b(?!\\s*(?:mil|centos?|reais?))`),
  )
  if (centsDigitWordMatch) {
    const whole = Number(centsDigitWordMatch[1])
    const cents = wordsToNumber(centsDigitWordMatch[2].split(/\s+e\s+/))
    if (!Number.isNaN(whole)) return whole + cents / 100
  }

  // Numeric with decimals: R$ 1.234,50 / 45,50 / 45.50 / 3000
  const numericMatch = normalized.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/)
  if (numericMatch) {
    const value = parseAmountToken(numericMatch[1])
    if (value !== null && value > 0) return value
  }

  return extractWordAmount(normalized)
}

function parseAmountToken(token: string): number | null {
  if (/\d/.test(token)) {
    let numeric = token
    if (numeric.includes(',')) {
      // BR format: dot is a thousands separator, comma is the decimal point.
      numeric = numeric.replace(/\./g, '').replace(',', '.')
    } else {
      const dotParts = numeric.split('.')
      // A dot followed by exactly 3 digits (e.g. "1.234") is a thousands separator, not a decimal.
      if (dotParts.length > 1 && dotParts[dotParts.length - 1].length === 3) {
        numeric = dotParts.join('')
      }
    }
    const asNumber = Number(numeric)
    if (!Number.isNaN(asNumber)) return asNumber
  }
  return extractWordAmount(token)
}

const INCOME_KEYWORDS = [
  'recebi', 'recebimento', 'recebendo', 'salario', 'salário', 'renda', 'ganhei', 'ganho', 'entrou', 'entrada de',
  'freela', 'freelance', 'bonus', 'bônus', 'pagamento recebido', 'pix recebido', 'reembolso', '13o', 'decimo terceiro',
  'décimo terceiro', 'caiu', 'depositaram', 'depositou', 'deposito de', 'depósito de', 'transferencia recebida',
  'transferência recebida', 'vendi', 'venda de', 'comissao', 'comissão', 'cashback', 'restituicao', 'restituição',
]

const RECURRING_KEYWORDS = [
  'todo mes', 'todo mês', 'mensal', 'mensalidade', 'assinatura', 'recorrente', 'fixo', 'todo dia', 'por mes',
]

const FILLER_WORDS = new Set([
  'gastei', 'paguei', 'comprei', 'gasto', 'de', 'do', 'da', 'no', 'na', 'em', 'com', 'reais', 'real',
  'r$', 'recebi', 'ganhei', 'hoje', 'ontem', 'ao', 'à', 'a', 'o', 'e', 'para', 'pra', 'centavos', 'centavo',
])

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Whole-word/phrase match so short keywords (e.g. "gas") don't match inside unrelated words (e.g. "gastei"). */
function containsKeyword(normalized: string, keyword: string): boolean {
  return new RegExp(`\\b${escapeRegExp(keyword)}\\b`).test(normalized)
}

export function categorizeText(rawText: string): CategoryId | null {
  const normalized = normalize(rawText)
  for (const category of CATEGORIES) {
    for (const keyword of category.keywords) {
      if (containsKeyword(normalized, stripAccents(keyword))) return category.id
    }
  }
  return null
}

function detectType(normalized: string): 'expense' | 'income' {
  return INCOME_KEYWORDS.some((kw) => containsKeyword(normalized, kw)) ? 'income' : 'expense'
}

function detectRecurring(normalized: string): boolean {
  return RECURRING_KEYWORDS.some((kw) => containsKeyword(normalized, kw))
}

function buildDescription(rawText: string): string {
  const words = rawText
    .split(/\s+/)
    .filter((word) => {
      const clean = normalize(word).replace(/[.,]/g, '')
      if (!clean) return false
      if (FILLER_WORDS.has(clean)) return false
      if (/^\d+([.,]\d+)?$/.test(clean)) return false
      if (NUMBER_WORDS.has(clean)) return false
      return true
    })
  const description = words.join(' ').trim()
  if (!description) return 'Despesa'
  return description.charAt(0).toUpperCase() + description.slice(1)
}

/** Parses a free-form voice/text entry like "gastei 45 reais no mercado" into a structured transaction draft. */
export function parseEntry(rawText: string): ParsedEntry {
  const normalized = normalize(rawText)
  return {
    amount: extractAmount(rawText),
    categoryId: categorizeText(rawText),
    type: detectType(normalized),
    recurring: detectRecurring(normalized),
    description: buildDescription(rawText),
  }
}
