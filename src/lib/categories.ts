export type CategoryId =
  | 'moradia'
  | 'contas'
  | 'alimentacao'
  | 'transporte'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'compras'
  | 'assinaturas'
  | 'outros'

export interface CategoryMeta {
  id: CategoryId
  label: string
  /** Short form for tight spaces like chart column tags. */
  short: string
  emoji: string
  /** Fixed categorical hue, light/dark — assigned by identity, not by rank, so it never repaints. */
  colorLight: string
  colorDark: string
  /** Essential categories are protected from cut suggestions; discretionary ones are targeted first. */
  essential: boolean
  /** Keywords used to auto-detect the category from free text (voice or typed). */
  keywords: string[]
}

// Neutral (non-categorical) swatch for the two lowest-signal categories — they share the
// muted chart-chrome gray instead of a vivid hue, per the validated palette's 8-slot cap.
const NEUTRAL_LIGHT = '#898781'
const NEUTRAL_DARK = '#898781'

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'alimentacao',
    label: 'Alimentação',
    short: 'Alimen.',
    emoji: '🍽️',
    colorLight: '#2a78d6',
    colorDark: '#3987e5',
    essential: true,
    keywords: [
      'mercado', 'supermercado', 'feira', 'restaurante', 'ifood', 'lanche', 'padaria',
      'almoco', 'almoço', 'jantar', 'cafe', 'café', 'comida', 'pizza', 'lanchonete',
    ],
  },
  {
    id: 'transporte',
    label: 'Transporte',
    short: 'Transporte',
    emoji: '🚗',
    colorLight: '#eb6834',
    colorDark: '#d95926',
    essential: true,
    keywords: ['uber', '99', 'gasolina', 'combustivel', 'combustível', 'onibus', 'ônibus', 'metro', 'metrô', 'estacionamento', 'pedagio', 'pedágio', 'oficina'],
  },
  {
    id: 'moradia',
    label: 'Moradia',
    short: 'Moradia',
    emoji: '🏠',
    colorLight: '#1baf7a',
    colorDark: '#199e70',
    essential: true,
    keywords: ['aluguel', 'condominio', 'condomínio', 'iptu', 'financiamento da casa', 'reforma'],
  },
  {
    id: 'contas',
    label: 'Contas e Serviços',
    short: 'Contas',
    emoji: '🧾',
    colorLight: '#eda100',
    colorDark: '#c98500',
    essential: true,
    keywords: ['luz', 'energia', 'agua', 'água', 'gas', 'gás', 'internet', 'telefone', 'celular conta', 'boleto'],
  },
  {
    id: 'lazer',
    label: 'Lazer',
    short: 'Lazer',
    emoji: '🎉',
    colorLight: '#e87ba4',
    colorDark: '#d55181',
    essential: false,
    keywords: ['cinema', 'bar', 'balada', 'viagem', 'show', 'passeio', 'festa', 'jogo', 'streaming assistir'],
  },
  {
    id: 'compras',
    label: 'Compras',
    short: 'Compras',
    emoji: '🛍️',
    colorLight: '#008300',
    colorDark: '#008300',
    essential: false,
    keywords: ['roupa', 'sapato', 'loja', 'shopping', 'eletronico', 'eletrônico', 'presente', 'acessorio', 'acessório'],
  },
  {
    id: 'assinaturas',
    label: 'Assinaturas',
    short: 'Assinat.',
    emoji: '📱',
    colorLight: '#4a3aa7',
    colorDark: '#9085e9',
    essential: false,
    keywords: ['netflix', 'spotify', 'assinatura', 'academia', 'amazon prime', 'disney', 'youtube premium', 'icloud'],
  },
  {
    id: 'saude',
    label: 'Saúde',
    short: 'Saúde',
    emoji: '💊',
    colorLight: '#e34948',
    colorDark: '#e66767',
    essential: true,
    keywords: ['farmacia', 'farmácia', 'remedio', 'remédio', 'medico', 'médico', 'consulta', 'plano de saude', 'plano de saúde', 'dentista', 'exame'],
  },
  {
    id: 'educacao',
    label: 'Educação',
    short: 'Educação',
    emoji: '📚',
    colorLight: NEUTRAL_LIGHT,
    colorDark: NEUTRAL_DARK,
    essential: true,
    keywords: ['curso', 'faculdade', 'mensalidade', 'livro', 'escola', 'material escolar'],
  },
  {
    id: 'outros',
    label: 'Outros',
    short: 'Outros',
    emoji: '✨',
    colorLight: NEUTRAL_LIGHT,
    colorDark: NEUTRAL_DARK,
    essential: false,
    keywords: [],
  },
]

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryMeta>

export function getCategory(id: CategoryId): CategoryMeta {
  return CATEGORY_MAP[id]
}
