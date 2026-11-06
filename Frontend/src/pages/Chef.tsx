import { BadgeCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CardRestaurante from '../components/CardRestaurante'
import { Avatar } from '../components/Photo'
import RecipeCard from '../components/RecipeCard'
import { EstadoVazio, Paginacao } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import { useSeo } from '../lib/seo'
import { useRecipes } from '../lib/useRecipes'

const POR_PAGINA = 6

export default function Chef() {
  const { id = '' } = useParams()
  const { perfis } = useAuth()
  const recipes = useRecipes()
  const [pagina, setPagina] = useState(1)
  const c = perfis.find((p) => p.papel === 'CHEF' && p.userId === id && p.status === 'APROVADO')
  useSeo({ titulo: c ? `Chef ${c.nome}` : 'Chef não encontrado', descricao: c?.bio })

  if (!c) return <EstadoVazio titulo="Chef não encontrado" texto="O link pode estar errado ou o perfil não existe." acao={{ to: '/profissionais', rotulo: 'Ver profissionais' }} />

  const rest = perfis.find((p) => p.papel === 'RESTAURANTE' && p.status === 'APROVADO' && p.userId === c.restauranteDoChef)
  const receitas = recipes.filter((r) => r.owner === c.userId)
  const total = Math.max(1, Math.ceil(receitas.length / POR_PAGINA))
  const atual = Math.min(pagina, total)

  // só dados públicos: nunca e-mail, senha ou id interno de conta
  return (
    <div className="space-y-8">
      <header className="card flex flex-wrap items-center gap-5 p-6">
        <Avatar className="h-20 w-20" />
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="flex flex-wrap items-center gap-2 text-3xl font-extrabold">Chef {c.nome} <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2.5 py-1 text-xs font-semibold text-leaf"><BadgeCheck size={13} /> Verificado</span></h1>
          {c.especializacao && <p className="text-sm font-semibold text-terra">{ENUMS.especializacao[c.especializacao as keyof typeof ENUMS.especializacao]}</p>}
          {c.bio && <p className="max-w-2xl text-sm text-ink-soft">{c.bio}</p>}
        </div>
      </header>

      {rest && (
        <section className="space-y-3" aria-labelledby="atua-t">
          <h2 id="atua-t" className="text-xl font-bold">Onde atua</h2>
          <div className="max-w-md"><CardRestaurante restaurante={rest} /></div>
        </section>
      )}

      <section className="space-y-4" aria-labelledby="rec-t">
        <h2 id="rec-t" className="text-2xl font-bold">Receitas</h2>
        {receitas.length === 0 ? (
          <EstadoVazio titulo="Ainda sem receitas" texto="Este chef ainda não publicou receitas." acao={{ to: '/receitas', rotulo: 'Explorar receitas' }} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{receitas.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA).map((r) => <RecipeCard key={r.id} recipe={r} />)}</div>
        )}
        <Paginacao pagina={atual} total={total} onMudar={setPagina} />
        <p className="text-xs text-ink-faint">Compartilhe esta página: <Link className="underline" to={`/chef/${c.userId}`}>{location.origin}/chef/{c.userId}</Link></p>
      </section>
    </div>
  )
}
