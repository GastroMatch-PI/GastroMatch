import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Photo, { Avatar } from '../components/Photo'
import RecipeCard from '../components/RecipeCard'
import { collections, fridgeItems, recipes, trending } from '../data/data'
import { useLocalState } from '../hooks/useLocalState'

type ShopItem = { id: number; name: string; qty: string; done: boolean }

const initialShopping: ShopItem[] = [
  { id: 1, name: 'Queijo de Cabra Artesanal', qty: '150g', done: false },
  { id: 2, name: 'Tomates Sweet Grape', qty: '1 caixa', done: false },
  { id: 3, name: 'Sálvia Fresca em Maço', qty: '1 unid.', done: false },
  { id: 4, name: 'Pinoli ou Nozes Chilenas', qty: '80g', done: false },
]

const initialMenu = [
  { day: 'SEG', title: 'Massa com Alho Negro', meta: 'Jantar • 18 min' },
  { day: 'QUA', title: 'Shakshuka Rústica', meta: 'Almoço • 25 min' },
  { day: 'SEX', title: 'Risotto de Abóbora & Sálvia', meta: 'Jantar • 35 min' },
]

export default function Home() {
  const [selected, setSelected] = useState<string[]>(['Tomate', 'Queijo', 'Manjericão'])
  const [searched, setSearched] = useState(false)
  const [tab, setTab] = useState<'geladeira' | 'prato'>('geladeira')
  const [dish, setDish] = useState('')
  const [collection, setCollection] = useState('Todos')
  const [shopping, setShopping] = useLocalState<ShopItem[]>('gm-shopping', initialShopping)
  const [menu, setMenu] = useLocalState('gm-menu', initialMenu)
  const [newItem, setNewItem] = useState('')

  const toggle = (item: string) =>
    setSelected((s) => (s.includes(item) ? s.filter((i) => i !== item) : [...s, item]))

  const matches = useMemo(
    () =>
      recipes
        .map((r) => {
          const hit = r.ingredients.filter((i) => selected.includes(i)).length
          return { recipe: r, match: Math.round((hit / r.ingredients.length) * 100) }
        })
        .filter((m) => m.match > 0),
    [selected],
  )

  const list = useMemo(() => {
    const term = dish.trim().toLowerCase()
    return recipes
      .filter((r) => collection === 'Todos' || r.collections.includes(collection))
      .filter((r) => !term || r.title.toLowerCase().includes(term))
  }, [collection, dish])

  const addToMenu = (title: string) => {
    const days = ['TER', 'QUI', 'SAB', 'DOM']
    setMenu((m) => (m.some((x) => x.title === title) ? m : [...m, { day: days[m.length % 4], title, meta: 'Jantar' }]))
  }

  const pending = shopping.filter((i) => !i.done).length

  return (
    <div className="space-y-10">
      <section className="grid gap-6 rounded-3xl bg-peach p-6 md:grid-cols-2 md:p-10">
        <div className="space-y-4">
          <span className="inline-block rounded-full bg-leaf-soft px-3 py-1 text-xs font-semibold text-leaf">
            🔓 Acesso Aberto • Zero Barreiras de Login
          </span>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
            Descubra a gastronomia autêntica feita para cozinhar agora
          </h1>
          <p className="text-ink-soft">
            Uma plataforma aberta com técnicas de alta cozinha, receitas validadas por chefs e nutricionistas, sem fricção:
            guarde seus ingredientes e listas direto no seu navegador.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-ink-soft">
            <li>✔ 1.400+ Fichas Validadas</li>
            <li>🌿 Foco em Desperdício Zero</li>
            <li>💾 Armazenamento Local Seguro</li>
          </ul>
        </div>
        <Link to="/receita/risotto-cogumelos" className="group relative block overflow-hidden rounded-2xl">
          <Photo emoji="🥖" seed={0} className="h-64 w-full md:h-full">
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
              <span className="rounded bg-gold px-2 py-0.5 text-[10px] font-bold uppercase">Destaque do Sommelier</span>
              <p className="mt-1 font-display text-lg font-bold">Harmonização: Gnocchi Artesanal ao Pesto Selvagem</p>
              <p className="text-xs opacity-90">Receita pelo Chef Rogério Bittencourt • 25 min</p>
            </div>
          </Photo>
        </Link>
      </section>

      <section id="geladeira" className="card space-y-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-4 text-sm font-semibold">
            {(['geladeira', 'prato'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`border-b-2 pb-1 ${tab === t ? 'border-terra text-terra' : 'border-transparent text-ink-soft'}`}
              >
                {t === 'geladeira' ? '🧊 O que tenho na geladeira?' : '🔎 Busca por Prato ou Técnica'}
              </button>
            ))}
          </div>
          <span className="rounded-full bg-leaf-soft px-2.5 py-1 text-xs font-medium text-leaf">
            ✨ Algoritmo de Compatibilidade GastroMatch
          </span>
        </div>

        {tab === 'geladeira' ? (
          <>
            <p className="text-xs text-ink-faint">Selecione ao menos 2 itens para calibrar sugestões</p>
            <div className="flex flex-wrap gap-2">
              {fridgeItems.map((i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  aria-pressed={selected.includes(i)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    selected.includes(i) ? 'border-gold bg-gold-soft text-gold' : 'border-line bg-cream text-ink-soft hover:bg-peach'
                  }`}
                >
                  {selected.includes(i) ? '✓' : '+'} {i}
                </button>
              ))}
            </div>
            <button
              className="btn-primary w-full md:w-auto"
              disabled={selected.length < 2}
              onClick={() => setSearched(true)}
            >
              🔍 Encontrar receitas com estes ingredientes
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">{matches.length} matches</span>
            </button>
            {searched && (
              <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
                {matches
                  .sort((a, b) => b.match - a.match)
                  .map(({ recipe, match }) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      match={match}
                      planned={menu.some((m) => m.title === recipe.title)}
                      onAdd={addToMenu}
                    />
                  ))}
              </div>
            )}
          </>
        ) : (
          <input
            className="input"
            placeholder="Ex.: risoto, emulsão, fermentação natural..."
            value={dish}
            onChange={(e) => setDish(e.target.value)}
          />
        )}
      </section>

      <section id="colecoes" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-bold">Explorar Coleções</h2>
          <p className="text-xs text-ink-faint">Filtragem instantânea sem recarregar a tela</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {collections.map((c) => (
            <button
              key={c}
              onClick={() => setCollection(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                collection === c ? 'border-terra bg-terra text-white' : 'border-line bg-white text-ink-soft hover:bg-peach'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold">Receitas em Destaque</h2>
              <p className="text-xs text-ink-faint">
                Execução precisa, cálculo de macronutrientes e passo a passo testado.
              </p>
            </div>
            <span className="text-xs font-semibold text-terra">Ver todas (340) →</span>
          </div>
          {list.length === 0 ? (
            <p className="card p-6 text-sm text-ink-soft">Nenhuma receita encontrada nesta coleção.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {list.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  planned={menu.some((m) => m.title === r.title)}
                  onAdd={addToMenu}
                />
              ))}
            </div>
          )}
        </section>

        <aside id="listas" className="space-y-4">
          <div className="card space-y-4 bg-peach/60 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">📦 Minhas Listas Locais</h3>
              <span className="rounded-full bg-leaf-soft px-2 py-0.5 text-[10px] font-semibold text-leaf">Offline First</span>
            </div>
            <p className="rounded-lg bg-white p-2 text-[11px] text-ink-soft">
              ⚠ Estes dados são salvos diretamente na memória do seu navegador. Nenhum login ou cadastro obrigatório.
            </p>
            <div>
              <p className="mb-2 flex justify-between text-xs font-semibold text-terra">
                Lista de Compras <span className="text-ink-faint">{pending} itens pendentes</span>
              </p>
              <ul className="space-y-1.5">
                {shopping.map((i) => (
                  <li key={i.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs">
                    <input
                      type="checkbox"
                      checked={i.done}
                      onChange={() =>
                        setShopping((s) => s.map((x) => (x.id === i.id ? { ...x, done: !x.done } : x)))
                      }
                    />
                    <span className={`flex-1 ${i.done ? 'text-ink-faint line-through' : ''}`}>{i.name}</span>
                    <span className="text-ink-faint">{i.qty}</span>
                  </li>
                ))}
              </ul>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newItem.trim()) return
                  setShopping((s) => [...s, { id: Date.now(), name: newItem.trim(), qty: '1 unid.', done: false }])
                  setNewItem('')
                }}
              >
                <input
                  className="input !py-1.5 text-xs"
                  placeholder="+ Acrescentar item à lista"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                />
              </form>
            </div>
            <div>
              <p className="mb-2 flex justify-between text-xs font-semibold text-terra">
                📅 Cardápio da Semana <span className="text-ink-faint">{menu.length} planejados</span>
              </p>
              <ul className="space-y-1.5">
                {menu.map((m) => (
                  <li key={m.title} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-peach-deep text-[10px] font-bold text-terra">
                      {m.day}
                    </span>
                    <span className="flex-1 text-xs">
                      <b className="block">{m.title}</b>
                      <span className="text-ink-faint">{m.meta}</span>
                    </span>
                    <button
                      aria-label={`Remover ${m.title}`}
                      className="text-ink-faint hover:text-alert"
                      onClick={() => setMenu((x) => x.filter((y) => y.title !== m.title))}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="card bg-peach p-4 text-xs text-ink-soft">
            <p className="mb-1 font-semibold text-terra">📍 Dica do Sommelier GastroMatch</p>
            Pratos com emulsões ácidas e tomates confitados harmonizam perfeitamente com vinhos brancos minerais ou tintos
            leves como Pinot Noir servido a 14°C.
          </div>
        </aside>
      </div>

      <section id="comunidade" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-3xl font-bold">Chefs & Restaurantes em Alta</h2>
            <p className="text-xs text-ink-faint">Criadores profissionais com validação técnica em tempo real na plataforma.</p>
          </div>
          <Link to="/profissionais" className="btn-ghost text-xs">
            🗺 Ver no Mapa Gastronômico
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((t) => (
            <div key={t.name} className="card flex items-center gap-3 p-3">
              <Avatar emoji={t.emoji} className="h-10 w-10" />
              <div className="min-w-0 text-xs">
                <p className="truncate text-sm font-semibold">{t.name} <span className="text-gold">✪</span></p>
                <p className="truncate text-ink-faint">{t.sub}</p>
                <p className="text-terra">{t.stat}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
