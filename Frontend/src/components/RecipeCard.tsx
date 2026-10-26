import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Recipe } from '../data/data'
import Photo, { Avatar } from './Photo'

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
  const [saved, setSaved] = useState(false)
  return (
    <article className="card overflow-hidden">
      <Link to={`/receita/${recipe.id}`}>
        <Photo emoji={recipe.emoji} seed={recipe.seed} className="h-44 w-full">
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium">
            ⏱ {recipe.minutes} min
          </span>
        </Photo>
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs font-semibold">
            <Avatar emoji={recipe.role === 'Chef' ? '👨‍🍳' : '🥗'} className="h-6 w-6 text-xs" />
            {recipe.author}
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] ${recipe.role === 'Chef' ? 'bg-gold-soft text-gold' : 'bg-leaf-soft text-leaf'}`}
            >
              {recipe.role}
            </span>
          </p>
          <button
            onClick={() => setSaved(!saved)}
            aria-pressed={saved}
            aria-label="Salvar receita"
            className="rounded-full border border-line px-2 py-1 text-sm hover:bg-peach"
          >
            {saved ? '🔖' : '📑'}
          </button>
        </div>
        <Link to={`/receita/${recipe.id}`} className="block font-display text-lg font-semibold leading-snug hover:text-terra">
          {recipe.title}
        </Link>
        <p className="text-xs text-ink-faint">
          {recipe.difficulty} • {recipe.servings} porções
          {match !== undefined ? ` • Match Geladeira: ${match}%` : ''}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="rounded-full bg-gold-soft px-2.5 py-1 text-xs font-medium text-gold">{recipe.nutrition}</span>
          <button
            onClick={() => onAdd(recipe.title)}
            disabled={planned}
            className="text-xs font-semibold text-terra hover:underline disabled:text-leaf disabled:no-underline"
          >
            {planned ? '✓ No Cardápio' : '⊕ Add ao Cardápio'}
          </button>
        </div>
      </div>
    </article>
  )
}
