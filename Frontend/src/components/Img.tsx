type Props = {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export default function Img({ src, alt, className = '', priority = false }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      className={`bg-surface object-cover ${className}`}
    />
  )
}
