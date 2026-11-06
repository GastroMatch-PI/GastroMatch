import { ArrowRight, CalendarDays, Clock, Plus, Refrigerator, Search, ShoppingBasket, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Photo from '../components/Photo'
import RecipeCard from '../components/RecipeCard'
import { collections, fridgeItems } from '../data/data'
import { useLocalState } from '../hooks/useLocalState'
import { useRecipes } from '../lib/useRecipes'

type ShopItem = { id: number; name: string; qty: string; done: boolean }
type MenuItem = { day: string; title: string; meta: string }

export default function Home() {
  const recipes = useRecipes()
  const [params] = useSearchParams()
  const [maxMin, setMaxMin] = useState(0)
  const [dif, setDif] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [searched, setSearched] = useState(false)
  const [tab, setTab] = useState<'geladeira' | 'prato'>(params.get('q') ? 'prato' : 'geladeira')
  const [dish, setDish] = useState(params.get('q') ?? '')
  const [collection, setCollection] = useState('Todos')
  const [shopping, setShopping] = useLocalState<ShopItem[]>('gm-shopping', [])
  const [menu, setMenu] = useLocalState<MenuItem[]>('gm-menu', [])
  const [newItem, setNewItem] = useState('')

  const toggle = (item: string) => setSelected((s) => (s.includes(item) ? s.filter((i) => i !== item) : [...s, item]))

  const matches = useMemo(
    () =>
      recipes
        .map((r) => {
          const hit = r.ingredients.filter((i) => selected.includes(i)).length
          return { recipe: r, match: Math.round((hit / r.ingredients.length) * 100) }
        })
        .filter((m) => m.match > 0)
        .sort((a, b) => b.match - a.match),
    [selected, recipes],
  )

  const list = useMemo(() => {
    const term = dish.trim().toLowerCase()
    return recipes
      .filter((r) => collection === 'Todos' || r.collections.includes(collection))
      .filter((r) => !term || [r.title, r.author, ...r.ingredients, ...r.collections].some((t) => t.toLowerCase().includes(term)))
      .filter((r) => !maxMin || r.minutes <= maxMin)
      .filter((r) => !dif || r.difficulty === dif)
  }, [collection, dish, recipes, maxMin, dif])

  const addToMenu = (title: string) => {
    const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']
    setMenu((m) => (m.some((x) => x.title === title) ? m : [...m, { day: days[m.length % 7], title, meta: 'Planejado' }]))
  }

  const pending = shopping.filter((i) => !i.done).length
  const destaque = recipes.find((r) => r.id === 'risotto-cogumelos') ?? recipes[0]

  return (
    <div className="space-y-14">
      <section className="rise relative grid items-center gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-peach via-peach to-peach-deep p-6 md:grid-cols-[1.1fr_1fr] md:p-12">
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
            Cozinhe o que você <span className="text-terra">já tem</span> em casa
          </h1>
          <p className="max-w-md text-base text-ink-soft">
            Receitas de chefs, nutricionistas e restaurantes. Escolha os ingredientes da geladeira e veja o que dá para fazer agora.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#geladeira" className="btn-primary !px-6 !py-3">
              <Refrigerator size={18} /> Usar minha geladeira
            </a>
            <Link to="/profissionais" className="btn-ghost !px-6 !py-3">
              Ver profissionais <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        {destaque && (
          <Link to={`/receita/${destaque.id}`} className="group relative block overflow-hidden rounded-3xl shadow-lift">
            <Photo emoji={destaque.emoji} seed={destaque.seed} className="h-72 w-full transition duration-700 group-hover:scale-105 md:h-96">
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 text-white">
                <p className="font-display text-xl font-semibold leading-snug">{destaque.title}</p>
                <p className="mt-1 flex items-center gap-2 text-xs opacity-90">
                  {destaque.author} <span aria-hidden>•</span> <Clock size={12} /> {destaque.minutes} min
                </p>
              </div>
            </Photo>
          </Link>
        )}
      </section>

      <section id="geladeira" className="card scroll-mt-24 space-y-5 p-5 md:p-8">
        <div role="tablist" className="inline-flex rounded-full border border-line bg-cream p-1 text-sm font-semibold">
          {(['geladeira', 'prato'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 transition duration-200 ${tab === t ? 'bg-terra text-white shadow-soft' : 'text-ink-soft hover:text-terra'}`}
            >
              {t === 'geladeira' ? <><Refrigerator size={16} /> O que tenho em casa</> : <><Search size={16} /> Buscar receitas</>}
            </button>
          ))}
        </div>

        {tab === 'geladeira' ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">Selecione ao menos 2 ingredientes.</p>
            <div className="flex flex-wrap gap-2">
              {fridgeItems.map((i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  aria-pressed={selected.includes(i)}
                  className={`chip ${selected.includes(i) ? 'border-terra bg-terra text-white' : 'border-line bg-white text-ink-soft hover:bg-peach'}`}
                >
                  {selected.includes(i) ? <X size={13} /> : <Plus size={13} />} {i}
                </button>
              ))}
            </div>
            <button className="btn-primary" disabled={selected.length < 2} onClick={() => setSearched(true)}>
              <Sparkles size={16} /> Encontrar receitas
              <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">{matches.length}</span>
            </button>
            {searched && (
              matches.length ? (
                <div className="grid gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map(({ recipe, match }) => (
                    <RecipeCard key={recipe.id} recipe={recipe} match={match} planned={menu.some((m) => m.title === recipe.title)} onAdd={addToMenu} />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-peach p-4 text-sm text-ink-soft">Nenhuma receita usa esses ingredientes.</p>
              )
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input className="input !rounded-full !py-3 !pl-11" placeholder="Nome, ingrediente, chef ou tipo..." aria-label="Buscar receitas" value={dish} onChange={(e) => setDish(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="input !w-auto !rounded-full" aria-label="Tempo máximo" value={maxMin} onChange={(e) => setMaxMin(Number(e.target.value))}>
                <option value={0}>Qualquer tempo</option>
                <option value={20}>Até 20 min</option>
                <option value={30}>Até 30 min</option>
                <option value={60}>Até 60 min</option>
              </select>
              <select className="input !w-auto !rounded-full" aria-label="Dificuldade" value={dif} onChange={(e) => setDif(e.target.value)}>
                <option value="">Qualquer dificuldade</option>
                <option>Fácil</option>
                <option>Médio</option>
                <option>Difícil</option>
              </select>
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6" id="receitas">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl font-bold">Receitas</h2>
            <span className="text-sm text-ink-faint">{list.length} {list.length === 1 ? 'receita' : 'receitas'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <button
                key={c}
                onClick={() => setCollection(c)}
                aria-pressed={collection === c}
                className={`chip ${collection === c ? 'border-terra bg-terra text-white' : 'border-line bg-white text-ink-soft hover:bg-peach'}`}
              >
                {c}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="card p-8 text-center text-sm text-ink-soft">Nenhuma receita encontrada com esses filtros.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {list.map((r) => (
                <RecipeCard key={r.id} recipe={r} planned={menu.some((m) => m.title === r.title)} onAdd={addToMenu} />
              ))}
            </div>
          )}
        </section>

        <aside id="listas" className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-4 p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><ShoppingBasket size={18} className="text-terra" /> Lista de compras</h3>
            <p className="text-xs text-ink-faint">{pending} pendentes • salva só neste navegador</p>
            {shopping.length === 0 && <p className="rounded-xl bg-cream p-3 text-xs text-ink-soft">Vazia. Adicione itens ou envie os ingredientes de uma receita.</p>}
            <ul className="space-y-1.5">
              {shopping.map((i) => (
                <li key={i.id} className="flex items-center gap-2.5 rounded-xl bg-cream px-3 py-2 text-sm">
                  <input type="checkbox" aria-label={i.name} checked={i.done} onChange={() => setShopping((s) => s.map((x) => (x.id === i.id ? { ...x, done: !x.done } : x)))} />
                  <span className={`flex-1 ${i.done ? 'text-ink-faint line-through' : ''}`}>{i.name}</span>
                  <span className="text-xs text-ink-faint">{i.qty}</span>
                  <button aria-label={`Remover ${i.name}`} className="cursor-pointer text-ink-faint hover:text-alert" onClick={() => setShopping((s) => s.filter((x) => x.id !== i.id))}><X size={14} /></button>
                </li>
              ))}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!newItem.trim()) return
                setShopping((s) => [...s, { id: Date.now(), name: newItem.trim(), qty: '1 un.', done: false }])
                setNewItem('')
              }}
            >
              <input className="input" placeholder="Adicionar item" aria-label="Adicionar item" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
            </form>
          </div>

          <div className="card space-y-4 p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><CalendarDays size={18} className="text-terra" /> Cardápio da semana</h3>
            {menu.length === 0 && <p className="rounded-xl bg-cream p-3 text-xs text-ink-soft">Nada planejado. Use “Adicionar ao cardápio” nas receitas.</p>}
            <ul className="space-y-2">
              {menu.map((m) => (
                <li key={m.title} className="flex items-center gap-3 rounded-xl bg-cream px-3 py-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-peach-deep text-[10px] font-bold text-terra">{m.day}</span>
                  <span className="flex-1 text-sm font-medium leading-tight">{m.title}</span>
                  <button aria-label={`Remover ${m.title}`} className="cursor-pointer text-ink-faint hover:text-alert" onClick={() => setMenu((x) => x.filter((y) => y.title !== m.title))}>
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <section id="comunidade" className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-terra p-8 text-white md:p-10">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">Chefs, nutricionistas e restaurantes</h2>
          <p className="mt-1 text-sm text-white/80">Conheça os perfis cadastrados ou crie o seu.</p>
        </div>
        <Link to="/profissionais" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-terra transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
          Ver diretório <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  )
}
