export type View = 'dashboard' | 'transactions' | 'goals'

interface BottomNavProps {
  active: View
  onNavigate: (view: View) => void
  onAdd: () => void
}

const ITEMS: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Início', icon: '📊' },
  { id: 'transactions', label: 'Extrato', icon: '🧾' },
]

const ITEMS_RIGHT: { id: View; label: string; icon: string }[] = [
  { id: 'goals', label: 'Metas', icon: '🎯' },
]

export function BottomNav({ active, onNavigate, onAdd }: BottomNavProps) {
  return (
    <nav
      className="sticky bottom-0 z-20 flex items-center justify-around border-t border-black/10 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10 dark:bg-[#141413]/90"
      aria-label="Navegação principal"
    >
      {ITEMS.map((item) => (
        <NavButton key={item.id} item={item} active={active === item.id} onClick={() => onNavigate(item.id)} />
      ))}

      <button
        type="button"
        onClick={onAdd}
        aria-label="Adicionar lançamento"
        className="relative -top-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-2xl text-white shadow-lg shadow-teal-500/30 active:scale-95 transition-transform"
      >
        +
      </button>

      {ITEMS_RIGHT.map((item) => (
        <NavButton key={item.id} item={item} active={active === item.id} onClick={() => onNavigate(item.id)} />
      ))}
    </nav>
  )
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: { id: View; label: string; icon: string }
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
        active ? 'text-teal-600 dark:text-teal-400' : 'text-neutral-400 dark:text-neutral-500'
      }`}
    >
      <span className="text-lg leading-none">{item.icon}</span>
      {item.label}
    </button>
  )
}
