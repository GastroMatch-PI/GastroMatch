import { Heart } from 'lucide-react'
import { useState } from 'react'
import Protegida from '../components/Protegida'
import RecipeCard from '../components/RecipeCard'
import { EstadoVazio, Paginacao } from '../components/Ui'
import { useSeo } from '../lib/seo'
import { useFavoritos, useRecipes } from '../lib/useRecipes'

const POR_PAGINA = 6

export default function Favoritos() {
  useSeo({ titulo: 'Meus favoritos' })
  const todas = useRecipes()
  const { favs } = useFavoritos()
  const [pagina, setPagina] = useState(1)
  const lista = todas.filter((r) => favs.includes(r.id)) // receita removida pelo chef some sem erro
  const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const atual = Math.min(pagina, total)

  return (
    <Protegida>
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold"><Heart className="fill-terra text-terra" /> Meus favoritos</h1>
          <p className="mt-1 text-sm text-ink-soft" role="status">{lista.length} {lista.length === 1 ? 'receita salva' : 'receitas salvas'}</p>
        </div>
        {lista.length === 0 ? (
          <EstadoVazio titulo="Nenhum favorito ainda" texto="Toque no coração de uma receita para guardá-la aqui." acao={{ to: '/receitas', rotulo: 'Explorar receitas' }} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{lista.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA).map((r) => <RecipeCard key={r.id} recipe={r} />)}</div>
        )}
        <Paginacao pagina={atual} total={total} onMudar={setPagina} />
      </div>
    </Protegida>
  )
}
