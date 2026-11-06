import { ArrowUpRight, Clock, Heart, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import type { Recipe } from '../data/data'
import { useFavoritos } from '../lib/useRecipes'
import Photo from './Photo'

export default function RecipeCard({
  recipe,
  match,
  featured = false,
}: {
  recipe: Recipe
  match?: number
  featured?: boolean
}) {
  const { usuario } = useAuth()
  const nav = useNavigate()
  const { favs, toggle } = useFavoritos()
  const saved = favs.includes(recipe.id)

  return (
    <article
      className={`group relative isolate overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-soft transition duration-500 hover:-translate-y-1.5 hover:border-terra/50 hover:shadow-lift ${featured ? 'aspect-[4/5] sm:aspect-auto sm:h-full sm:min-h-[28rem]' : 'aspect-[4/5]'}`}
    >
      <div className="absolute inset-0 -z-10">
      <Photo emoji={recipe.emoji} seed={recipe.seed} className="h-full w-full">
        {recipe.image && (
          <img
            src={recipe.image}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
          />
        )}
      </Photo>
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-transparent" aria-hidden />

      <Link to={`/receita/${recipe.id}`} aria-label={recipe.title} className="absolute inset-0 z-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
          <Clock size={13} /> {recipe.minutes} min
        </span>
        <button
          onClick={() => (usuario ? toggle(recipe.id) : nav('/login'))}
          aria-pressed={saved}
          aria-label={saved ? 'Remover dos favoritos' : 'Favoritar receita'}
          className="pointer-events-auto relative z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition duration-300 hover:scale-110 hover:bg-black/75"
        >
          <Heart size={18} className={saved ? 'fill-terra text-terra' : ''} />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-3 p-5 sm:p-6">
        {match !== undefined && (
          <span className="inline-block rounded-full bg-leaf px-3 py-1 text-xs font-bold text-on-accent">{match}% na geladeira</span>
        )}
        <p className="text-xs font-bold uppercase tracking-wide text-terra">{recipe.author}</p>
        <h3 className={`font-display font-bold leading-[1.1] text-white ${featured ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>{recipe.title}</h3>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/85">
            <span className="rounded-full border border-white/25 px-2.5 py-1">{recipe.difficulty}</span>
            <span className="inline-flex items-center gap-1"><Users size={13} /> {recipe.servings} porções</span>
          </div>
          <span className="flex h-10 w-10 shrink-0 translate-y-2 items-center justify-center rounded-full bg-terra text-on-accent opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100" aria-hidden>
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </article>
  )
}
