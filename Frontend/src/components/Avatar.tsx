const tones = ['bg-brand-tint text-brand', 'bg-leaf-tint text-leaf', 'bg-surface text-soft']

function initials(name: string) {
  return name
    .replace(/^(Chef|Dra?\.|Restaurante|Atelier)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export default function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const tone = tones[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length]
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${tone}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  )
}
