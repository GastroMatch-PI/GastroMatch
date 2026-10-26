import { ArrowRight, Check, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Img from '../components/Img'
import RecipeCard from '../components/RecipeCard'
import { collections, featured, fridgeItems, photoUrl, recipes, trending } from '../data/data'
import { menu, removeFromMenu, saved, shopping, toggleSaved } from '../lib/lists'
import { useStore } from '../lib/store'

export default function Home() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const term = query.trim().toLowerCase()

  const [selected, setSelected] = useState<string[]>([])
  const [collection, setCollection] = useState('Todos')
  const [draft, setDraft] = useState('')

  const [items, setItems] = useStore(shopping)
  const [planned] = useStore(menu)
  const [savedIds] = useStore(saved)

  const matches = useMemo(
    () =>
      recipes
        .map((recipe) => ({ recipe, used: recipe.pantry.filter((p) => selected.includes(p)).length }))
        .filter((m) => m.used > 0)
        .sort((a, b) => b.used / b.recipe.pantry.length - a.used / a.recipe.pantry.length),
    [selected],
  )

  const list = useMemo(
    () =>
      recipes
        .filter((r) => collection === 'Todos' || r.collections.includes(collection))
        .filter(
          (r) =>
            !term ||
            [r.title, r.author.name, ...r.ingredients.map((i) => i.name)].join(' ').toLowerCase().includes(term),
        ),
    [collection, term],
  )

  const toggleIngredient = (name: string) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))

  const toggleItem = (id: number) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
  const removeItem = (id: number) => setItems((prev) => prev.filter((item) => item.id !== id))
  const addItem = (e: FormEvent) => {
    e.preventDefault()
    const name = draft.trim()
    if (!name) return
    setItems((prev) => [...prev, { id: Date.now(), name, qty: '', done: false }])
    setDraft('')
  }

  const pending = items.filter((item) => !item.done).length
  const savedRecipes = recipes.filter((r) => savedIds.includes(r.id))

  return (
    <div>
      <section className="grid grid-cols-1 items-center gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-20">
        <div>
          <h1 className="max-w-xl text-4xl leading-[1.12] sm:text-5xl">Cozinhe bem com o que você tem em casa</h1>
          <p className="mt-5 max-w-lg text-base text-soft">
            Receitas de chefs e nutricionistas, com passo a passo, tabela nutricional e lista de compras. Marque os
            ingredientes da geladeira e veja o que dá para fazer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/#receitas" className="btn btn-primary">
              Ver receitas
            </Link>
            <Link to="/#geladeira" className="btn btn-outline">
              Usar ingredientes da geladeira
            </Link>
          </div>
        </div>

        <Link to={`/receita/${featured.id}`} className="group block">
          <Img
            src={photoUrl(featured.photos[0], 1200)}
            alt={featured.title}
            priority
            className="aspect-[5/4] w-full rounded-2xl"
          />
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-faint">Receita da semana</p>
              <p className="mt-1 text-lg font-semibold leading-snug">{featured.title}</p>
              <p className="text-sm text-soft">
                {featured.author.name} · {featured.minutes} min
              </p>
            </div>
            <ArrowRight className="mb-1 h-5 w-5 shrink-0 text-faint transition-transform group-hover:translate-x-1 group-hover:text-brand" />
          </div>
        </Link>
      </section>

      <section id="geladeira" className="card p-6 sm:p-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl">O que você tem em casa?</h2>
          <p className="mt-1 text-soft">Marque os ingredientes e veja quais receitas aproveitam o que já está na geladeira.</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {fridgeItems.map((name) => {
            const on = selected.includes(name)
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => toggleIngredient(name)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  on
                    ? 'border-brand bg-brand-tint text-brand'
                    : 'border-line text-soft hover:border-ink/30 hover:text-ink'
                }`}
              >
                {on && <Check className="h-3.5 w-3.5" />}
                {name}
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          {selected.length < 2 ? (
            <p className="text-sm text-faint">Marque pelo menos 2 ingredientes para ver sugestões.</p>
          ) : matches.length === 0 ? (
            <p className="text-sm text-faint">Ainda não temos receitas com esses ingredientes.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map(({ recipe, used }) => (
                <li key={recipe.id}>
                  <Link
                    to={`/receita/${recipe.id}`}
                    className="flex items-center gap-3 rounded-lg border border-line p-2.5 transition-colors hover:bg-surface"
                  >
                    <Img src={photoUrl(recipe.photos[0], 160)} alt="" className="h-14 w-14 shrink-0 rounded-md" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{recipe.title}</span>
                      <span className="block text-[13px] text-leaf">
                        Usa {used} de {recipe.pantry.length} ingredientes
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="receitas" className="mt-16 sm:mt-24">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl">{term ? `Resultados para “${query.trim()}”` : 'Receitas'}</h2>
            <p className="mt-1 text-soft">Tempo de preparo e calorias por porção em cada prato.</p>
          </div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {collections.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCollection(name)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  collection === name
                    ? 'border-ink bg-ink text-white'
                    : 'border-line text-soft hover:border-ink/30 hover:text-ink'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {term && (
          <button
            type="button"
            onClick={() => setParams({})}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
          >
            <X className="h-4 w-4" /> Limpar busca
          </button>
        )}

        {list.length === 0 ? (
          <p className="mt-10 text-soft">Nenhuma receita encontrada.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>

      <section id="listas" className="mt-16 sm:mt-24">
        <h2 className="text-2xl sm:text-3xl">Minhas listas</h2>
        <p className="mt-1 text-soft">Ficam salvas neste navegador, sem precisar de cadastro.</p>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card flex flex-col p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg">Lista de compras</h3>
              <span className="text-[13px] text-faint">{pending} pendentes</span>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id)}
                    aria-label={`Marcar ${item.name}`}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className={`flex-1 text-sm ${item.done ? 'text-faint line-through' : ''}`}>{item.name}</span>
                  {item.qty && <span className="text-[13px] text-faint">{item.qty}</span>}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remover ${item.name}`}
                    className="text-faint hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            {items.length === 0 && <p className="mt-4 text-sm text-faint">Sua lista está vazia.</p>}
            <form onSubmit={addItem} className="mt-auto flex gap-2 pt-5">
              <input
                className="field"
                placeholder="Adicionar item"
                aria-label="Adicionar item à lista"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="submit" className="btn btn-outline px-3" aria-label="Adicionar">
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="card p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg">Cardápio da semana</h3>
              <span className="text-[13px] text-faint">{planned.length} planejadas</span>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {planned.map((meal) => {
                const recipe = recipes.find((r) => r.id === meal.recipeId)
                if (!recipe) return null
                return (
                  <li key={meal.recipeId} className="flex items-center gap-3 py-2.5">
                    <span className="w-10 shrink-0 text-[13px] font-medium text-brand">{meal.day}</span>
                    <Link to={`/receita/${recipe.id}`} className="min-w-0 flex-1 text-sm hover:text-brand">
                      <span className="block truncate">{recipe.title}</span>
                      <span className="text-[13px] text-faint">{recipe.minutes} min</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromMenu(recipe.id)}
                      aria-label={`Remover ${recipe.title}`}
                      className="text-faint hover:text-ink"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
            {planned.length === 0 && (
              <p className="mt-4 text-sm text-faint">Use “Adicionar ao cardápio” em uma receita para planejar a semana.</p>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg">Receitas salvas</h3>
              <span className="text-[13px] text-faint">{savedRecipes.length}</span>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {savedRecipes.map((recipe) => (
                <li key={recipe.id} className="flex items-center gap-3 py-2.5">
                  <Img src={photoUrl(recipe.photos[0], 120)} alt="" className="h-10 w-10 shrink-0 rounded-md" />
                  <Link to={`/receita/${recipe.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-brand">
                    {recipe.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleSaved(recipe.id)}
                    aria-label={`Remover ${recipe.title} das salvas`}
                    className="text-faint hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            {savedRecipes.length === 0 && (
              <p className="mt-4 text-sm text-faint">Toque no marcador de uma receita para guardá-la aqui.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-16 sm:mt-24">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl">Chefs e restaurantes em destaque</h2>
          <Link to="/profissionais" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((t) => (
            <li key={t.name}>
              <Link
                to="/profissionais"
                className="card flex h-full items-center gap-3 p-4 transition-colors hover:bg-surface"
              >
                <Avatar name={t.name} size={44} />
                <span className="min-w-0 text-sm">
                  <span className="block truncate font-medium">{t.name}</span>
                  <span className="block truncate text-[13px] text-faint">{t.sub}</span>
                  <span className="block text-[13px] text-brand">{t.stat}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
