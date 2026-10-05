export interface Level {
  name: string
  size: number
  directions: [number, number][]
  words: string[]
}

export interface Placement {
  word: string
  cells: [number, number][]
}

export interface Puzzle {
  grid: string[][]
  placements: Placement[]
}

const RIGHT: [number, number] = [0, 1]
const DOWN: [number, number] = [1, 0]
const DIAG_DOWN: [number, number] = [1, 1]
const DIAG_UP: [number, number] = [-1, 1]
const LEFT: [number, number] = [0, -1]
const UP: [number, number] = [-1, 0]
const DIAG_DOWN_BACK: [number, number] = [1, -1]
const DIAG_UP_BACK: [number, number] = [-1, -1]

/** Four screens, from easy (small grid, only → and ↓) to hard (big grid, all 8 directions). */
export const LEVELS: Level[] = [
  {
    name: 'Fácil',
    size: 6,
    directions: [RIGHT, DOWN],
    words: ['GATO', 'CASA', 'SOL', 'MAR', 'BOLA'],
  },
  {
    name: 'Médio',
    size: 8,
    directions: [RIGHT, DOWN, DIAG_DOWN],
    words: ['ESCOLA', 'JANELA', 'BANANA', 'LIVRO', 'PRAIA', 'FLOR'],
  },
  {
    name: 'Difícil',
    size: 10,
    directions: [RIGHT, DOWN, DIAG_DOWN, DIAG_UP, LEFT, UP],
    words: ['GIRASSOL', 'CHOCOLATE', 'MONTANHA', 'CACHORRO', 'ESTRELA', 'ABACAXI', 'NUVEM'],
  },
  {
    name: 'Muito difícil',
    size: 12,
    directions: [RIGHT, DOWN, DIAG_DOWN, DIAG_UP, LEFT, UP, DIAG_DOWN_BACK, DIAG_UP_BACK],
    words: ['COMPUTADOR', 'BIBLIOTECA', 'FELICIDADE', 'DINOSSAURO', 'PRIMAVERA', 'ELEFANTE', 'AVENTURA', 'TARTARUGA'],
  },
]

// Weighted toward common Portuguese letters so the filler blends in with the hidden words.
const FILLER = 'AAAAEEEEIIOOOUUSSRRNNDDMMTTCCLLPPVGBFHQJXZ'

function randomInt(max: number): number {
  return Math.floor(Math.random() * max)
}

function tryBuild(level: Level): Puzzle | null {
  const { size, directions } = level
  const grid: string[][] = Array.from({ length: size }, () => Array<string>(size).fill(''))
  const placements: Placement[] = []

  // Longest words first: they're the hardest to fit.
  const words = [...level.words].sort((a, b) => b.length - a.length)
  for (const word of words) {
    let placed = false
    for (let attempt = 0; attempt < 200 && !placed; attempt++) {
      const [dr, dc] = directions[randomInt(directions.length)]
      const row = randomInt(size)
      const col = randomInt(size)
      const endRow = row + dr * (word.length - 1)
      const endCol = col + dc * (word.length - 1)
      if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue

      const cells: [number, number][] = []
      let fits = true
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i
        const c = col + dc * i
        if (grid[r][c] && grid[r][c] !== word[i]) {
          fits = false
          break
        }
        cells.push([r, c])
      }
      if (!fits) continue

      cells.forEach(([r, c], i) => (grid[r][c] = word[i]))
      placements.push({ word, cells })
      placed = true
    }
    if (!placed) return null
  }

  for (const row of grid) {
    for (let c = 0; c < size; c++) {
      if (!row[c]) row[c] = FILLER[randomInt(FILLER.length)]
    }
  }
  return { grid, placements }
}

export function buildPuzzle(level: Level): Puzzle {
  for (;;) {
    const puzzle = tryBuild(level)
    if (puzzle) return puzzle
  }
}

/** Cells on the straight line (row, column or diagonal) from `start` to `end`, or null if not aligned. */
export function lineBetween(start: [number, number], end: [number, number]): [number, number][] | null {
  const dr = end[0] - start[0]
  const dc = end[1] - start[1]
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null
  const steps = Math.max(Math.abs(dr), Math.abs(dc))
  const sr = Math.sign(dr)
  const sc = Math.sign(dc)
  return Array.from({ length: steps + 1 }, (_, i) => [start[0] + sr * i, start[1] + sc * i] as [number, number])
}
