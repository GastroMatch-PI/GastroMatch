import { MapPin, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { enderecoCompleto, type PerfilPro } from '../lib/tipos'
import { Skeleton } from './Ui'

// Mesmo card no carrossel, na lista de restaurantes e na página do chef.
export default function CardRestaurante({ restaurante: r, variante = 'grade' }: { restaurante?: PerfilPro; variante?: 'grade' | 'carrossel' }) {
  if (!r) return <Skeleton className={variante === 'carrossel' ? 'h-72' : 'h-64'} />
  const local = [r.bairro, r.cidadeNome].filter(Boolean).join(' · ') || r.cidade
  return (
    <article className={`group card card-hover overflow-hidden ${variante === 'carrossel' ? 'flex h-full flex-col sm:flex-row' : ''}`}>
      <Link to={`/restaurante/${r.userId}`} aria-label={`Ver ${r.nome}`} className={`relative block shrink-0 overflow-hidden bg-peach-deep ${variante === 'carrossel' ? 'h-48 sm:h-auto sm:w-2/5' : 'h-44'}`}>
        {r.capa ? (
          <img src={r.capa} alt="" loading="lazy" width={600} height={400} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-950 via-orange-800 to-orange-500 text-white/80"><Store size={40} aria-hidden /></span>
        )}
      </Link>
      <div className="min-w-0 flex-1 space-y-2 p-5">
        <h3 className="font-display text-xl font-bold leading-tight [overflow-wrap:anywhere]">
          <Link to={`/restaurante/${r.userId}`} className="hover:text-terra">{r.nome}</Link>
        </h3>
        {local && <p className="flex items-start gap-1.5 text-xs text-ink-soft"><MapPin size={13} className="mt-0.5 shrink-0 text-terra" /> <span className="[overflow-wrap:anywhere]">{local}</span></p>}
        <p className="text-xs text-ink-faint">{enderecoCompleto(r)}</p>
        {r.bio && <p className="line-clamp-3 text-sm text-ink-soft [overflow-wrap:anywhere]">{r.bio}</p>}
      </div>
    </article>
  )
}
