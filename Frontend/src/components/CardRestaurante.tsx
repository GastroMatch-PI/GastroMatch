import { MapPin, Store } from 'lucide-react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { urlImagem } from '../lib/api'
import { enderecoDe, type RestauranteResumo } from '../lib/apiTipos'
import { Skeleton } from './Ui'

// A API entrega a capa da conta ligada ao perfil de restaurante.
export default function CardRestaurante({ restaurante: r, variante = 'grade', gradienteLaranja = false }: { restaurante?: RestauranteResumo; variante?: 'grade' | 'carrossel'; gradienteLaranja?: boolean }) {
  const destaque = variante === 'carrossel'
  if (!r) return <Skeleton className={destaque ? 'h-72 sm:h-80' : 'h-64'} />
  const local = [r.bairro, r.cidade].filter(Boolean).join(' · ')
  const endereco = enderecoDe(r)
  const imagem = urlImagem(r.imagem)
  const corDetalhe = 'text-[#52423b]'
  const corEndereco = 'text-[#6f5f56]'
  const titulo = (
    <h3 className="font-display text-2xl font-bold leading-tight [overflow-wrap:anywhere] sm:text-3xl">
      <Link to={`/restaurante/${r.id}`} className="hover:text-terra">{r.nome}</Link>
    </h3>
  )
  const detalhes = (
    <>
      {local && <p className={`flex items-start gap-2 text-sm ${corDetalhe}`}><MapPin size={16} className="mt-0.5 shrink-0 text-terra" /> <span className="[overflow-wrap:anywhere]">{local}</span></p>}
      {endereco && <p className={`text-sm ${corEndereco} [overflow-wrap:anywhere]`}>{endereco}</p>}
      {r.bio && <p className={`line-clamp-3 text-base [overflow-wrap:anywhere] ${corDetalhe}`}>{r.bio}</p>}
    </>
  )
  const acompanharMouse = (event: ReactPointerEvent<HTMLElement>) => {
    const movimentoReduzido = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (event.pointerType === 'touch' || movimentoReduzido) return
    const area = event.currentTarget.getBoundingClientRect()
    if (!area.width || !area.height) return

    const x = ((event.clientX - area.left) / area.width) * 2 - 1
    const y = ((event.clientY - area.top) / area.height) * 2 - 1
    event.currentTarget.style.setProperty('--restaurant-rotate-x', `${-y * 5}deg`)
    event.currentTarget.style.setProperty('--restaurant-rotate-y', `${x * 7}deg`)
  }
  const resetarInclinacao = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--restaurant-rotate-x', '0deg')
    event.currentTarget.style.setProperty('--restaurant-rotate-y', '0deg')
  }
  return (
    <article
      onPointerMove={acompanharMouse}
      onPointerLeave={resetarInclinacao}
      className={`group card restaurant-promo-card flex min-h-[24rem] flex-col overflow-hidden sm:flex-row ${gradienteLaranja ? 'restaurant-orange-gradient' : ''}`}
    >
      <div className="restaurant-promo-visual relative min-h-64 w-full shrink-0 sm:min-h-[24rem] sm:w-1/2">
        <Link to={`/restaurante/${r.id}`} aria-label={`Ver ${r.nome}`} className="restaurant-promo-image-card">
          {imagem ? (
            <img src={imagem} alt={`Fachada ou ambiente de ${r.nome}`} loading="lazy" className="restaurant-promo-image" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-950 via-orange-800 to-orange-500 text-white/80"><Store size={48} aria-hidden /></span>
          )}
          <span className="restaurant-promo-image-shade" aria-hidden="true" />
        </Link>
      </div>
      <div className="restaurant-promo-content min-w-0 w-full rounded-b-[1.75rem] bg-white p-6 text-[#241713] sm:flex sm:w-1/2 sm:flex-none sm:flex-col sm:justify-center sm:rounded-b-none sm:rounded-r-[1.75rem] sm:p-8 lg:p-9">
        <div className="restaurant-promo-title border-b border-[#ecd9cd] pb-4">{titulo}</div>
        <div className="restaurant-promo-details space-y-3 pt-4">{detalhes}</div>
      </div>
    </article>
  )
}
