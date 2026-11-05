import { Link } from 'react-router-dom'
import Protegida from '../components/Protegida'
import { useFavoritos, useRecipes } from '../lib/useRecipes'

export default function Favoritos() {
  const todas = useRecipes()
  const { favs, toggle } = useFavoritos()
  const lista = todas.filter((r) => favs.includes(r.id))
  return (
    <Protegida>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Minhas receitas favoritas</h1>
        {lista.length === 0 && (
          <p className="text-sm text-ink-soft">
            Nenhum favorito ainda. <Link to="/" className="text-terra">Explorar receitas</Link>
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((r) => (
            <article key={r.id} className="card space-y-2 p-4">
              {r.image && <img src={r.image} alt="" className="h-36 w-full rounded-xl object-cover" />}
              <Link to={`/receita/${r.id}`} className="block font-display text-lg font-bold hover:text-terra">{r.title}</Link>
              <p className="text-xs text-ink-soft">⏱ {r.minutes} min · {r.servings} porções</p>
              <button className="btn-ghost w-full" onClick={() => toggle(r.id)}>♥ Remover</button>
            </article>
          ))}
        </div>
      </div>
    </Protegida>
  )
}
