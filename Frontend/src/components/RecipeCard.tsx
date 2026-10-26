import { Bookmark, Check, Clock, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { photoUrl } from '../data/data'
import type { Recipe } from '../data/data'
import { addToMenu, menu, saved, toggleSaved } from '../lib/lists'
import { useStore } from '../lib/store'
import Img from './Img'

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [savedIds] = useStore(saved)
  const [planned] = useStore(menu)
  const isSaved = savedIds.includes(recipe.id)
  const inMenu = planned.some((meal) => meal.recipeId === recipe.id)
  const href = `/receita/${recipe.id}`

  return (
    <article className="group flex flex-col">
      <Link to={href} className="block overflow-hidden rounded-xl">
        <Img
          src={photoUrl(recipe.photos[0], 720)}
          alt={recipe.title}
          className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-faint">
            {recipe.author.name} · {recipe.author.role}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base leading-snug">
            <Link to={href} className="hover:text-brand">
              {recipe.title}
            </Link>
          </h3>
        </div>
        <button
          type="button"
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Remover das receitas salvas' : 'Salvar receita'}
          onClick={() => toggleSaved(recipe.id)}
          className="mt-0.5 shrink-0 rounded-md p-1.5 text-faint transition-colors hover:bg-surface hover:text-ink"
        >
          <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-brand text-brand' : ''}`} />
        </button>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[13px] text-soft">
        <Clock className="h-3.5 w-3.5" />
        {recipe.minutes} min · {recipe.difficulty} · {recipe.nutrition.kcal} kcal
      </p>

      <button
        type="button"
        onClick={() => addToMenu(recipe.id)}
        disabled={inMenu}
        className="mt-3 inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-brand hover:underline disabled:text-faint disabled:no-underline"
      >
        {inMenu ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        {inMenu ? 'No cardápio da semana' : 'Adicionar ao cardápio'}
      </button>
    </article>
  )
}
