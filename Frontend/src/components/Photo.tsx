// Placeholder visual para as fotos do design: gradiente quente + emoji.
const palettes = [
  'from-amber-200 to-orange-400',
  'from-rose-200 to-red-400',
  'from-lime-200 to-emerald-500',
  'from-yellow-100 to-amber-500',
  'from-stone-200 to-stone-500',
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
      <span className="text-6xl drop-shadow" aria-hidden>
        {emoji}
      </span>
      {children}
    </div>
  )
}

export function Avatar({ emoji, className = 'h-8 w-8' }: { emoji: string; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-peach-deep ${className}`}>
      <span aria-hidden>{emoji}</span>
    </span>
  )
}
