import { Star } from 'lucide-react'

export default function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-gold"
      role="img"
      aria-label={`Nota ${value.toLocaleString('pt-BR')} de 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} width={size} height={size} className={n <= Math.round(value) ? 'fill-current' : 'text-line'} />
      ))}
    </span>
  )
}
