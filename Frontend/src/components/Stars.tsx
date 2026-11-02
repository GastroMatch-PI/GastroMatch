export default function Stars({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`text-gold ${className}`} role="img" aria-label={`${value} de 5`}>
      {'★'.repeat(value)}
      <span className="text-line">{'★'.repeat(5 - value)}</span>
    </span>
  )
}
