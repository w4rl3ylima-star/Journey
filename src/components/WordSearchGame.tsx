import { useMemo, useRef, useState } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { LEVELS, buildPuzzle, lineBetween } from '../lib/wordSearch'

interface WordSearchGameProps {
  onClose: () => void
}

type Cell = [number, number]

const LEVEL_KEY = 'journey.wordsearch.level'
// Game palette: white background, black letters, blue for the current selection,
// light green / purple alternating for found words.
const SELECT_COLOR = '#93c5fd'
const FOUND_COLORS = ['#86efac', '#d8b4fe']

function loadLevel(): number {
  try {
    const saved = Number(localStorage.getItem(LEVEL_KEY))
    return saved >= 0 && saved < LEVELS.length ? saved : 0
  } catch {
    return 0
  }
}

function saveLevel(level: number) {
  try {
    localStorage.setItem(LEVEL_KEY, String(level))
  } catch {
    // Storage unavailable (private mode) — progress just won't persist.
  }
}

const key = ([r, c]: Cell) => `${r},${c}`

export function WordSearchGame({ onClose }: WordSearchGameProps) {
  const { t } = useSettings()
  const [levelIndex, setLevelIndex] = useState(loadLevel)
  const level = LEVELS[levelIndex]
  const [puzzle, setPuzzle] = useState(() => buildPuzzle(level))
  // word -> color index, in the order they were found
  const [found, setFound] = useState<Record<string, number>>({})
  const [start, setStart] = useState<Cell | null>(null)
  const [end, setEnd] = useState<Cell | null>(null)
  const [tapAnchor, setTapAnchor] = useState<Cell | null>(null)
  const dragging = useRef(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const selection = useMemo(() => {
    if (!start) return []
    return lineBetween(start, end ?? start) ?? [start]
  }, [start, end])
  const selectedKeys = useMemo(() => new Set(selection.map(key)), [selection])

  const foundColorByCell = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of puzzle.placements) {
      const idx = found[p.word]
      if (idx === undefined) continue
      for (const cell of p.cells) map.set(key(cell), FOUND_COLORS[idx % FOUND_COLORS.length])
    }
    return map
  }, [puzzle, found])

  const foundCount = Object.keys(found).length
  const levelDone = foundCount === puzzle.placements.length
  const isLastLevel = levelIndex === LEVELS.length - 1

  const goToLevel = (index: number) => {
    setLevelIndex(index)
    saveLevel(index)
    setPuzzle(buildPuzzle(LEVELS[index]))
    setFound({})
    setStart(null)
    setEnd(null)
    setTapAnchor(null)
  }

  const cellFromPointer = (e: React.PointerEvent): Cell | null => {
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return null
    const size = level.size
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * size)
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * size)
    if (row < 0 || row >= size || col < 0 || col >= size) return null
    return [row, col]
  }

  const checkSelection = (cells: Cell[]) => {
    const letters = cells.map(([r, c]) => puzzle.grid[r][c]).join('')
    const reversed = [...letters].reverse().join('')
    const match = puzzle.placements.find(
      (p) => found[p.word] === undefined && (p.word === letters || p.word === reversed),
    )
    if (match) setFound((prev) => ({ ...prev, [match.word]: Object.keys(prev).length }))
  }

  const handleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (levelDone) return
    const cell = cellFromPointer(e)
    if (!cell) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    // Tap-tap mode: a previous single tap anchors the start of the word.
    setStart(tapAnchor ?? cell)
    setEnd(cell)
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const cell = cellFromPointer(e)
    if (cell) setEnd(cell)
  }

  const handleUp = () => {
    if (!dragging.current || !start) return
    dragging.current = false
    const finish = end ?? start
    const sameCell = start[0] === finish[0] && start[1] === finish[1]

    if (sameCell && !tapAnchor) {
      // First tap: keep the letter selected and wait for the last letter.
      setTapAnchor(start)
      return
    }

    const line = lineBetween(start, finish)
    if (line && !sameCell) checkSelection(line)
    setTapAnchor(null)
    setStart(null)
    setEnd(null)
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="no-scrollbar flex max-h-[96dvh] w-full max-w-[480px] flex-col overflow-y-auto rounded-t-3xl bg-white pb-[calc(env(safe-area-inset-bottom)+16px)] text-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <h2 className="text-lg font-bold">🔤 {t('wordsearch.title', 'Caça-Palavras')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('wordsearch.close', 'Fechar')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-black/60 hover:bg-black/5"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 px-5 pt-4">
          {LEVELS.map((l, i) => (
            <button
              key={l.name}
              type="button"
              onClick={() => goToLevel(i)}
              className="flex-1 rounded-xl border-2 py-1.5 text-xs font-bold transition-colors"
              style={{
                borderColor: '#a855f7',
                background: i === levelIndex ? '#a855f7' : '#ffffff',
                color: i === levelIndex ? '#ffffff' : '#000000',
              }}
            >
              {i + 1}. {t(`wordsearch.level.${i}`, l.name)}
            </button>
          ))}
        </div>

        <p className="px-5 pt-3 text-sm">
          {t('wordsearch.progress', '{found} de {total} palavras', {
            found: String(foundCount),
            total: String(puzzle.placements.length),
          })}
        </p>

        <div className="px-5 pt-3">
          <div
            ref={gridRef}
            className="grid touch-none select-none overflow-hidden rounded-2xl border-2"
            style={{ gridTemplateColumns: `repeat(${level.size}, 1fr)`, borderColor: '#3b82f6' }}
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleUp}
          >
            {puzzle.grid.map((row, r) =>
              row.map((letter, c) => {
                const k = key([r, c])
                const background = selectedKeys.has(k) ? SELECT_COLOR : (foundColorByCell.get(k) ?? '#ffffff')
                return (
                  <div
                    key={k}
                    className="flex aspect-square items-center justify-center font-bold text-black transition-colors"
                    style={{ background, fontSize: `min(${level.size > 8 ? 4.5 : 6}vw, ${level.size > 8 ? 20 : 26}px)` }}
                  >
                    {letter}
                  </div>
                )
              }),
            )}
          </div>
        </div>

        <ul className="flex flex-wrap gap-2 px-5 pt-4">
          {puzzle.placements.map(({ word }) => {
            const idx = found[word]
            const isFound = idx !== undefined
            return (
              <li
                key={word}
                className="rounded-full border-2 px-3 py-1 text-sm font-semibold"
                style={{
                  borderColor: isFound ? FOUND_COLORS[idx % FOUND_COLORS.length] : '#3b82f6',
                  background: isFound ? FOUND_COLORS[idx % FOUND_COLORS.length] : '#ffffff',
                  textDecoration: isFound ? 'line-through' : 'none',
                }}
              >
                {word}
              </li>
            )
          })}
        </ul>

        <p className="px-5 pt-3 text-xs text-black/60">
          {t(
            'wordsearch.hint',
            'Arraste o dedo sobre as letras — ou toque na primeira e depois na última letra da palavra.',
          )}
        </p>

        {levelDone && (
          <div className="mx-5 mt-4 rounded-2xl p-4 text-center" style={{ background: '#dcfce7' }}>
            <p className="text-lg font-black">
              {isLastLevel
                ? t('wordsearch.allDone', '🏆 Parabéns! Você completou todas as telas!')
                : t('wordsearch.levelDone', '🎉 Tela completa!')}
            </p>
            <button
              type="button"
              onClick={() => goToLevel(isLastLevel ? 0 : levelIndex + 1)}
              className="mt-3 rounded-2xl px-6 py-2.5 font-bold text-white"
              style={{ background: '#3b82f6' }}
            >
              {isLastLevel
                ? t('wordsearch.restart', 'Jogar desde o início')
                : t('wordsearch.next', 'Próxima tela')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
