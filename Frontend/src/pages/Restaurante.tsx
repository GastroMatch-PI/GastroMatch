import { BadgeCheck, MapPin, Store } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import { EstadoVazio } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'
import { enderecoCompleto } from '../lib/tipos'
import { useRecipes } from '../lib/useRecipes'

export default function Restaurante() {
  const { id = '' } = useParams()
  const { perfis } = useAuth()
  const recipes = useRecipes()
  // restaurante pendente de verificação é tratado como inexistente
  const r = perfis.find((p) => p.papel === 'RESTAURANTE' && p.userId === id && p.status === 'APROVADO')
  useSeo({ titulo: r?.nome ?? 'Restaurante não encontrado', descricao: r?.bio })

  if (!r) return <EstadoVazio titulo="Restaurante não encontrado" texto="O link pode estar errado ou o restaurante ainda não foi aprovado." acao={{ to: '/restaurantes', rotulo: 'Ver restaurantes' }} />

  const chefIds = r.chefIds ?? []
  const chefs = perfis.filter((p) => p.papel === 'CHEF' && (chefIds.includes(p.userId) || p.restauranteDoChef === r.userId))
  const donos = new Set(chefs.map((c) => c.userId))
  const receitas = recipes.filter((x) => x.owner && donos.has(x.owner))

  return (
    <div className="space-y-8">
      <div className="card overflow-hidden">
        <div className="relative h-56 bg-gradient-to-br from-orange-950 via-orange-800 to-orange-500 sm:h-72">
          {r.capa ? <img src={r.capa} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <Store className="absolute inset-0 m-auto text-white/70" size={56} aria-hidden />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
        <div className="space-y-3 p-6">
          <h1 className="text-3xl font-extrabold">{r.nome}</h1>
          <p className="flex items-start gap-2 text-sm text-ink-soft"><MapPin size={16} className="mt-0.5 shrink-0 text-terra" /> {enderecoCompleto(r) || 'Endereço não informado'}</p>
          {r.bio && <p className="max-w-2xl text-sm text-ink-soft">{r.bio}</p>}
          {r.whatsapp && <a className="btn-ghost" target="_blank" rel="noopener noreferrer" href={`https://wa.me/55${r.whatsapp}`}>WhatsApp</a>}
        </div>
      </div>

      <section className="space-y-3" aria-labelledby="chefs-t">
        <h2 id="chefs-t" className="text-2xl font-bold">Chefs</h2>
        {chefs.length === 0 ? <p className="text-sm text-ink-soft">Nenhum chef vinculado.</p> : (
          <ul className="flex flex-wrap gap-3">
            {chefs.map((c) => (
              <li key={c.userId}><Link to={`/chef/${c.userId}`} className="btn-ghost"><BadgeCheck size={15} className="text-terra" /> {c.nome}</Link></li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="rec-t">
        <h2 id="rec-t" className="text-2xl font-bold">Receitas dos chefs</h2>
        {receitas.length === 0 ? <EstadoVazio titulo="Ainda sem receitas" texto="Os chefs deste restaurante não publicaram receitas." /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{receitas.map((x) => <RecipeCard key={x.id} recipe={x} />)}</div>
        )}
      </section>
    </div>
  )
}
