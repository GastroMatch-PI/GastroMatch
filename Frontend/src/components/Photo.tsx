import { UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { urlImagem } from '../lib/api'
// Placeholder visual das receitas/perfis: gradiente quente + emoji de comida (conteúdo, não ícone de interface).
const palettes = [
  'from-orange-950 via-orange-800 to-orange-500',
  'from-stone-900 via-red-900 to-orange-600',
  'from-stone-900 via-amber-900 to-amber-500',
  'from-neutral-900 via-orange-900 to-orange-400',
  'from-stone-950 via-stone-700 to-orange-500',
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

/** Foto de perfil redonda; sem foto (ou se o link falhar), mostra o ícone de pessoa. */
export function Avatar({ className = 'h-8 w-8', foto, alt = '' }: { emoji?: string; className?: string; foto?: string | null; alt?: string }) {
  const src = urlImagem(foto)
  const [falhou, setFalhou] = useState(false)
  useEffect(() => setFalhou(false), [src])
  if (src && !falhou) {
    return <img src={src} alt={alt} loading="lazy" onError={() => setFalhou(true)} className={`shrink-0 rounded-full object-cover ${className}`} />
  }
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-peach-deep ${className}`}>
      <UserRound className="h-1/2 w-1/2 text-terra" aria-hidden />
    </span>
  )
}
