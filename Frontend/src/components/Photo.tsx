import { UserRound } from 'lucide-react'
// Placeholder visual das receitas/perfis: gradiente quente + emoji de comida (conteúdo, não ícone de interface).
const palettes = [
  'from-amber-100 via-orange-200 to-orange-400',
  'from-rose-100 via-rose-200 to-red-400',
  'from-lime-100 via-emerald-200 to-emerald-500',
  'from-yellow-50 via-amber-200 to-amber-500',
  'from-stone-100 via-stone-300 to-stone-500',
]

export default function Photo({
  emoji,
  seed = 0,
  className = '',
  children,
}: {
  emoji: string
  seed?: number
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${palettes[seed % palettes.length]} ${className}`}
    >
      <span className="text-6xl drop-shadow-md" aria-hidden>
        {emoji}
      </span>
      {children}
    </div>
  )
}

export function Avatar({ className = 'h-8 w-8' }: { emoji?: string; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-peach-deep ${className}`}>
      <UserRound className="h-1/2 w-1/2 text-terra" aria-hidden />
    </span>
  )
}
