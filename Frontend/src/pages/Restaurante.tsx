import { BadgeCheck, MapPin, Store } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Carregando, ErroApi } from '../components/Ui'
import { enderecoDe, type RestauranteDetalhe } from '../lib/apiTipos'
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
      <div className="card overflow-hidden">
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-orange-950 via-orange-800 to-orange-500 sm:h-56"><Store className="text-white/70" size={56} aria-hidden /></div>
        <div className="space-y-3 p-6">
          <h1 className="text-3xl font-extrabold">{r.nome}</h1>
          <p className="flex items-start gap-2 text-sm text-ink-soft"><MapPin size={16} className="mt-0.5 shrink-0 text-terra" /> {enderecoDe(r) || 'Endereço não informado'}</p>
          {r.bio && <p className="max-w-2xl text-sm text-ink-soft">{r.bio}</p>}
        </div>
      </div>

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
