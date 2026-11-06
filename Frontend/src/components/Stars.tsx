import { Star } from 'lucide-react'

export default function Stars({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} strokeWidth={2} className={n <= value ? 'fill-gold text-gold' : 'text-line'} />
      ))}
    </span>
  )
}
