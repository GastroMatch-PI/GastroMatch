import { BadgeCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import CardRestaurante from '../components/CardRestaurante'
import { Carregando, ErroApi } from '../components/Ui'
import type { RestauranteDetalhe } from '../lib/apiTipos'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'

export default function Restaurante() {
  const { id = '' } = useParams()
  const { dados: r, erro, lento, recarregar } = useApi<RestauranteDetalhe>(/^\d+$/.test(id) ? `/restaurantes/${id}` : null)
  useSeo({ titulo: r?.nome ?? 'Restaurante', descricao: r?.bio ?? undefined })

  if (!/^\d+$/.test(id)) return <ErroApi erro={{ message: 'Restaurante inválido.', status: 404 }} />
  if (erro) return <ErroApi erro={erro} onTentar={recarregar} />
  if (!r) return <Carregando lento={lento} texto="Carregando restaurante" />

  return (
    <div className="space-y-8">
      <CardRestaurante restaurante={r} variante="carrossel" />

      <section className="space-y-3" aria-labelledby="chefs-t">
        <h2 id="chefs-t" className="text-2xl font-bold">Chefs</h2>
        {r.chefs.length === 0 ? <p className="text-sm text-ink-soft">Nenhum chef vinculado.</p> : (
          <ul className="flex flex-wrap gap-3">
            {r.chefs.map((c) => <li key={c.id}><Link to={`/chef/${c.id}`} className="btn-ghost"><BadgeCheck size={15} className="text-terra" /> {c.username}</Link></li>)}
          </ul>
        )}
      </section>
    </div>
  )
}
