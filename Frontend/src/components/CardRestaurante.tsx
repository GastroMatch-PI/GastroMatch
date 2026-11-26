import { MapPin, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { enderecoDe, type RestauranteResumo } from '../lib/apiTipos'
import { Skeleton } from './Ui'

// Mesmo card no carrossel e na lista de restaurantes. A API não tem imagem de capa de restaurante.
export default function CardRestaurante({ restaurante: r, variante = 'grade' }: { restaurante?: RestauranteResumo; variante?: 'grade' | 'carrossel' }) {
  const destaque = variante === 'carrossel'
  if (!r) return <Skeleton className={destaque ? 'h-72 sm:h-80' : 'h-64'} />
  const local = [r.bairro, r.cidade].filter(Boolean).join(' · ')
  return (
    <article className={`group card ${destaque ? 'restaurant-promo-card flex min-h-[24rem] flex-col sm:min-h-[18rem] sm:flex-row' : 'card-hover overflow-hidden'}`}>
      <Link to={`/restaurante/${r.id}`} aria-label={`Ver ${r.nome}`} className={`relative block shrink-0 ${destaque ? 'restaurant-promo-visual flex min-h-48 w-full items-center justify-center rounded-t-[1.75rem] bg-gradient-to-br from-orange-950 via-orange-800 to-orange-500 text-white/80 sm:min-h-[18rem] sm:w-[40%] sm:rounded-l-[1.75rem] sm:rounded-tr-none' : 'h-36 overflow-hidden'}`}>
        {destaque ? (
          <Store className="restaurant-promo-icon" size={64} strokeWidth={1.8} aria-hidden />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-950 via-orange-800 to-orange-500 text-white/80"><Store size={40} aria-hidden /></span>
        )}
      </Link>
      <div className={`min-w-0 flex-1 ${destaque ? 'restaurant-promo-content space-y-3 p-6 sm:p-8 lg:p-9' : 'space-y-2 p-5'}`}>
        <h3 className={`font-display font-bold leading-tight [overflow-wrap:anywhere] ${destaque ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
          <Link to={`/restaurante/${r.id}`} className="hover:text-terra">{r.nome}</Link>
        </h3>
        {local && <p className={`flex items-start gap-2 text-ink-soft ${destaque ? 'text-sm' : 'text-xs'}`}><MapPin size={destaque ? 16 : 13} className="mt-0.5 shrink-0 text-terra" /> <span className="[overflow-wrap:anywhere]">{local}</span></p>}
        <p className={`${destaque ? 'text-sm' : 'text-xs'} text-ink-faint [overflow-wrap:anywhere]`}>{enderecoDe(r)}</p>
        {r.bio && <p className={`[overflow-wrap:anywhere] text-ink-soft ${destaque ? 'line-clamp-3 text-base' : 'line-clamp-3 text-sm'}`}>{r.bio}</p>}
      </div>
    </article>
  )
}
