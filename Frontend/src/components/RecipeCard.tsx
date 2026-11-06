import { CalendarPlus, Check, Clock, Heart, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import type { Recipe } from '../data/data'
import { useFavoritos } from '../lib/useRecipes'
import Photo from './Photo'

export default function RecipeCard({
  recipe,
  match,
  planned,
  onAdd,
}: {
  recipe: Recipe
  match?: number
  planned: boolean
  onAdd: (title: string) => void
}) {
  const { usuario } = useAuth()
  const nav = useNavigate()
  const { favs, toggle } = useFavoritos()
  const saved = favs.includes(recipe.id)

  return (
    <article className="card card-hover group flex flex-col overflow-hidden">
      <div className="relative">
        <Link to={`/receita/${recipe.id}`} aria-label={recipe.title}>
          <Photo emoji={recipe.emoji} seed={recipe.seed} className="h-48 w-full">
            {recipe.image && <img src={recipe.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          </Photo>
        </Link>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow-soft">
          <Clock size={13} /> {recipe.minutes} min
        </span>
        <button
          onClick={() => (usuario ? toggle(recipe.id) : nav('/login'))}
          aria-pressed={saved}
          aria-label={saved ? 'Remover dos favoritos' : 'Favoritar receita'}
          className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-soft transition duration-200 hover:scale-110"
        >
          <Heart size={17} className={saved ? 'fill-terra text-terra' : 'text-ink-soft'} />
        </button>
        {match !== undefined && (
          <span className="absolute bottom-3 left-3 rounded-full bg-leaf px-3 py-1 text-xs font-semibold text-white shadow-soft">
            {match}% na geladeira
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-xs font-semibold text-terra">
          {recipe.author}
        </p>
        <Link to={`/receita/${recipe.id}`} className="font-display text-lg font-semibold leading-snug transition duration-200 hover:text-terra">
          {recipe.title}
        </Link>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs text-ink-soft">
          <span className="rounded-full bg-peach px-2.5 py-1 font-medium">{recipe.difficulty}</span>
          <span className="inline-flex items-center gap-1"><Users size={13} /> {recipe.servings} porções</span>
        </div>
        <button
          onClick={() => onAdd(recipe.title)}
          disabled={planned}
          className="inline-flex cursor-pointer items-center gap-1.5 self-start text-xs font-semibold text-terra transition hover:underline disabled:cursor-default disabled:text-leaf disabled:no-underline"
        >
          {planned ? <><Check size={14} /> No cardápio</> : <><CalendarPlus size={14} /> Adicionar ao cardápio</>}
        </button>
      </div>
    </article>
  )
}
