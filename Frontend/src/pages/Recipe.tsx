import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Lightbulb,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShoppingBasket,
  ThumbsUp,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import Img from '../components/Img'
import NotFound from '../components/NotFound'
import Stars from '../components/Stars'
import { photoUrl, recipes } from '../data/data'
import type { Recipe as RecipeData } from '../data/data'
import { comments as commentsStore } from '../lib/comments'
import { clock, formatQty } from '../lib/format'
import { addToShopping, checklists, clearChecked, saved, toggleChecked, toggleSaved } from '../lib/lists'
import { useStore } from '../lib/store'

// Valores diários de referência usados na tabela nutricional (dieta de 2.000 kcal).
const daily = { carbs: 300, protein: 75, fat: 55, fiber: 25, sodium: 2000 }

function StepTimer({ label, seconds, dark = false }: { label: string; seconds: number; dark?: boolean }) {
  const [left, setLeft] = useState(seconds)
  const [running, setRunning] = useState(false)
  const ticking = running && left > 0

  useEffect(() => {
    if (!ticking) return
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => clearInterval(id)
  }, [ticking])

  const finished = left === 0

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
        dark ? 'border-white/20' : 'border-line'
      }`}
    >
      <span className={dark ? 'text-white/70' : 'text-soft'}>{label}</span>
      <span className="font-medium tabular-nums">{finished ? 'Pronto' : clock(left)}</span>
      {finished ? (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setLeft(seconds)
            setRunning(false)
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
        </button>
      ) : (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setRunning(!running)}>
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {running ? 'Pausar' : left === seconds ? 'Iniciar' : 'Continuar'}
        </button>
      )}
    </div>
  )
}

function RecipeView({ recipe }: { recipe: RecipeData }) {
  const [servings, setServings] = useState(recipe.servings)
  const [done, setDone] = useState<number[]>([])
  const [photo, setPhoto] = useState(0)
  const [following, setFollowing] = useState(false)
  const [guided, setGuided] = useState<number | null>(null)
  const [listed, setListed] = useState(false)
  const [text, setText] = useState('')
  const [rating, setRating] = useState(0)

  const [savedIds] = useStore(saved)
  const [checkLists] = useStore(checklists)
  const [allComments, setAllComments] = useStore(commentsStore)

  const checked = checkLists[recipe.id] ?? []
  const factor = servings / recipe.servings
  const isSaved = savedIds.includes(recipe.id)
  const comments = allComments.filter((c) => c.recipeId === recipe.id)
  const last = recipe.steps.length - 1
  const guidedActive = guided !== null
  const n = recipe.nutrition

  // Participação de cada macronutriente nas calorias (4 kcal/g de carboidrato e proteína, 9 kcal/g de gordura).
  const macros = [
    { label: 'Carboidratos', kcal: n.carbs * 4, fill: 'fill-brand', dot: 'bg-brand' },
    { label: 'Proteínas', kcal: n.protein * 4, fill: 'fill-leaf', dot: 'bg-leaf' },
    { label: 'Gorduras', kcal: n.fat * 9, fill: 'fill-gold', dot: 'bg-gold' },
  ]
  const macroTotal = macros.reduce((sum, m) => sum + m.kcal, 0)
  let offset = 0
  const bars = macros.map((m) => {
    const share = (m.kcal / macroTotal) * 100
    const bar = { ...m, share, x: offset }
    offset += share
    return bar
  })

  const toggleIn = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  // Modo cozinhar: teclado para navegar, tela sempre acesa e sem rolagem ao fundo.
  useEffect(() => {
    if (!guidedActive) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGuided(null)
      if (e.key === 'ArrowRight') setGuided((g) => (g === null ? g : Math.min(g + 1, last)))
      if (e.key === 'ArrowLeft') setGuided((g) => (g === null ? g : Math.max(g - 1, 0)))
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'

    let lock: WakeLockSentinel | undefined
    navigator.wakeLock
      ?.request('screen')
      .then((l) => {
        lock = l
      })
      .catch(() => {})

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      lock?.release().catch(() => {})
    }
  }, [guidedActive, last])

  const addIngredients = () => {
    addToShopping(
      recipe.ingredients
        .filter((i) => i.qty !== undefined)
        .map((i) => ({ name: i.name, qty: formatQty(i, factor) })),
    )
    setListed(true)
  }

  const publish = (e: FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setAllComments((prev) => [
      {
        id: Date.now(),
        recipeId: recipe.id,
        name: 'Você',
        where: 'Neste navegador',
        when: 'agora',
        text: body,
        rating: rating || 5,
        useful: 0,
      },
      ...prev,
    ])
    setText('')
    setRating(0)
  }

  const like = (id: number) =>
    setAllComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, liked: !c.liked, useful: c.useful + (c.liked ? -1 : 1) } : c)),
    )

  const rows = [
    ['Carboidratos', n.carbs, 'g', daily.carbs],
    ['Proteínas', n.protein, 'g', daily.protein],
    ['Gorduras totais', n.fat, 'g', daily.fat],
    ['Fibras', n.fiber, 'g', daily.fiber],
    ['Sódio', n.sodium, 'mg', daily.sodium],
  ] as const

  return (
    <div className="py-8 sm:py-10">
      <nav aria-label="Você está em" className="text-[13px] text-faint">
        <Link to="/" className="hover:text-ink">
          Receitas
        </Link>
        <span className="mx-2">/</span>
        <span>{recipe.collections[0]}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <Img
            src={photoUrl(recipe.photos[photo], 1200)}
            alt={recipe.title}
            priority
            className="aspect-[4/3] w-full rounded-2xl"
          />
          {recipe.photos.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {recipe.photos.map((id, i) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPhoto(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-current={photo === i}
                  className={`overflow-hidden rounded-lg border-2 transition-colors ${
                    photo === i ? 'border-brand' : 'border-transparent hover:border-line'
                  }`}
                >
                  <Img src={photoUrl(id, 300)} alt="" className="aspect-[4/3] w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl leading-tight sm:text-4xl">{recipe.title}</h1>

          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-soft">
            <Stars value={recipe.rating} />
            <span className="font-medium text-ink">{recipe.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span>
            <span>{recipe.reviews} avaliações</span>
            <span>·</span>
            <span>{recipe.saves} salvamentos</span>
          </p>

          <div className="mt-6 flex items-center gap-3 border-y border-line py-4">
            <Avatar name={recipe.author.name} size={44} />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{recipe.author.name}</p>
              <p className="text-[13px] text-faint">{recipe.author.role}</p>
            </div>
            <button type="button" onClick={() => setFollowing(!following)} className="btn btn-outline btn-sm">
              {following ? 'Seguindo' : 'Seguir'}
            </button>
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-[13px] text-faint">Tempo</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-medium">
                <Clock className="h-4 w-4 text-faint" />
                {recipe.minutes} min
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-faint">Rendimento</dt>
              <dd className="mt-0.5 font-medium">{recipe.servings} porções</dd>
            </div>
            <div>
              <dt className="text-[13px] text-faint">Dificuldade</dt>
              <dd className="mt-0.5 font-medium">{recipe.difficulty}</dd>
            </div>
          </dl>

          <div className="mt-8 space-y-3">
            <button type="button" className="btn btn-primary w-full py-3" onClick={() => setGuided(0)}>
              Iniciar modo cozinhar <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" className="btn btn-outline w-full" onClick={() => toggleSaved(recipe.id)}>
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-brand text-brand' : ''}`} />
              {isSaved ? 'Receita salva' : 'Salvar receita'}
            </button>
            <p className="text-[13px] text-faint">
              Mostra um passo por vez, com cronômetro, e mantém a tela acesa enquanto você cozinha.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-16">
        <aside className="space-y-6">
          <section id="ingredientes" className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl">Ingredientes</h2>
              <div className="flex items-center gap-1 text-sm">
                <button
                  type="button"
                  aria-label="Menos porções"
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-line hover:bg-surface"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-20 text-center tabular-nums">
                  {servings} {servings === 1 ? 'porção' : 'porções'}
                </span>
                <button
                  type="button"
                  aria-label="Mais porções"
                  onClick={() => setServings(Math.min(20, servings + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-line hover:bg-surface"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <ul className="mt-4 divide-y divide-line">
              {recipe.ingredients.map((ing) => (
                <li key={ing.name}>
                  <label className="flex cursor-pointer items-start gap-3 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={checked.includes(ing.name)}
                      onChange={() => toggleChecked(recipe.id, ing.name)}
                      className="mt-0.5 h-4 w-4 accent-brand"
                    />
                    <span className={`flex-1 ${checked.includes(ing.name) ? 'text-faint line-through' : ''}`}>
                      {ing.name}
                      {ing.note && <span className="text-faint">, {ing.note}</span>}
                    </span>
                    <span className="shrink-0 font-medium">{formatQty(ing, factor)}</span>
                  </label>
                </li>
              ))}
            </ul>

            {checked.length > 0 && (
              <button
                type="button"
                onClick={() => clearChecked(recipe.id)}
                className="mt-3 text-[13px] text-brand hover:underline"
              >
                Limpar marcações
              </button>
            )}

            <button type="button" onClick={addIngredients} className="btn btn-outline mt-5 w-full">
              {listed ? <Check className="h-4 w-4 text-leaf" /> : <ShoppingBasket className="h-4 w-4" />}
              {listed ? 'Adicionado à lista de compras' : 'Adicionar à lista de compras'}
            </button>
          </section>

          <section className="card p-6">
            <h2 className="text-xl">Tabela nutricional</h2>
            <p className="text-[13px] text-faint">Por porção. Valores diários com base em uma dieta de 2.000 kcal.</p>
            <p className="mt-4 flex items-baseline justify-between border-b border-line pb-3">
              <span className="text-sm text-soft">Valor energético</span>
              <span>
                <span className="text-2xl font-semibold">{n.kcal}</span> <span className="text-sm text-soft">kcal</span>
              </span>
            </p>

            <div className="border-b border-line py-4">
              <p className="text-[13px] text-faint">Origem das calorias</p>
              <svg
                viewBox="0 0 100 4"
                preserveAspectRatio="none"
                className="mt-2 h-2 w-full overflow-hidden rounded-full"
                role="img"
                aria-label={bars.map((b) => `${b.label} ${Math.round(b.share)}%`).join(', ')}
              >
                {bars.map((b) => (
                  <rect key={b.label} x={b.x} width={b.share} height="4" className={b.fill} />
                ))}
              </svg>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-soft">
                {bars.map((b) => (
                  <li key={b.label} className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${b.dot}`} />
                    {b.label} {Math.round(b.share)}%
                  </li>
                ))}
              </ul>
            </div>

            <dl className="divide-y divide-line text-sm">
              {rows.map(([label, value, unit, ref]) => (
                <div key={label} className="flex items-center justify-between py-2.5">
                  <dt className="text-soft">{label}</dt>
                  <dd>
                    <span className="font-medium">
                      {value.toLocaleString('pt-BR')} {unit}
                    </span>
                    <span className="ml-3 inline-block w-10 text-right text-[13px] text-faint">
                      {Math.round((value / ref) * 100)}%
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>

        <div className="min-w-0 space-y-14">
          <section id="preparo" aria-label="Modo de preparo">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl">Modo de preparo</h2>
              <span className="text-sm text-faint">
                {done.length} de {recipe.steps.length} passos
              </span>
            </div>

            <ol className="mt-6 space-y-8">
              {recipe.steps.map((step, i) => (
                <li key={step.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-4">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium ${
                      done.includes(i) ? 'border-brand bg-brand text-white' : 'border-line text-soft'
                    }`}
                  >
                    {done.includes(i) ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className={`text-lg ${done.includes(i) ? 'text-faint line-through' : ''}`}>{step.title}</h3>
                      <label className="flex shrink-0 cursor-pointer items-center gap-2 pt-1 text-[13px] text-faint">
                        <input
                          type="checkbox"
                          checked={done.includes(i)}
                          onChange={() => setDone(toggleIn(done, i))}
                          className="h-4 w-4 accent-brand"
                        />
                        Feito
                      </label>
                    </div>
                    <p className="mt-2 text-soft">{step.text}</p>
                    {step.timer && (
                      <div className="mt-3">
                        <StepTimer label={step.timer.label} seconds={step.timer.seconds} />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-label="Dicas do chef">
            <h2 className="text-2xl">Dicas de {recipe.author.role === 'Chef' ? 'chef' : 'nutricionista'}</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {recipe.tips.map((tip) => (
                <div
                  key={tip.title}
                  className={`rounded-lg border-l-2 bg-surface p-4 ${tip.kind === 'erro' ? 'border-alert' : 'border-gold'}`}
                >
                  <p
                    className={`flex items-center gap-2 text-sm font-medium ${
                      tip.kind === 'erro' ? 'text-alert' : 'text-ink'
                    }`}
                  >
                    {tip.kind === 'erro' ? (
                      <TriangleAlert className="h-4 w-4" />
                    ) : (
                      <Lightbulb className="h-4 w-4 text-gold" />
                    )}
                    {tip.title}
                  </p>
                  <p className="mt-1.5 text-sm text-soft">{tip.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="avaliacoes" aria-label="Avaliações">
            <h2 className="text-2xl">Avaliações da comunidade</h2>
            <p className="mt-1 text-soft">Conte como ficou e se você mudou alguma coisa.</p>

            <form onSubmit={publish} className="mt-6 flex gap-3">
              <Avatar name="Você" size={40} />
              <div className="flex-1 space-y-3">
                <textarea
                  className="field h-24 resize-y"
                  placeholder="Você fez essa receita? Escreva aqui como ficou."
                  aria-label="Sua avaliação"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-soft">
                    Sua nota
                    <span className="inline-flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          aria-label={`${v} ${v === 1 ? 'estrela' : 'estrelas'}`}
                          aria-pressed={rating === v}
                          onClick={() => setRating(v)}
                          className={v <= rating ? 'text-gold' : 'text-line hover:text-gold/60'}
                        >
                          <StarIcon />
                        </button>
                      ))}
                    </span>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim()}>
                    Publicar avaliação
                  </button>
                </div>
              </div>
            </form>

            <ul className="mt-8 divide-y divide-line">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3 py-5">
                  <Avatar name={c.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-4">
                      <p className="text-sm font-medium">
                        {c.name} <span className="font-normal text-faint">· {c.where} · {c.when}</span>
                      </p>
                      <Stars value={c.rating} size={13} />
                    </div>
                    <p className="mt-1.5 text-sm text-soft">{c.text}</p>
                    <button
                      type="button"
                      onClick={() => like(c.id)}
                      aria-pressed={!!c.liked}
                      className={`mt-2 inline-flex items-center gap-1.5 text-[13px] ${
                        c.liked ? 'text-brand' : 'text-faint hover:text-ink'
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" /> Útil ({c.useful})
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {comments.length === 0 && <p className="mt-8 text-sm text-faint">Ainda não há avaliações. Seja a primeira pessoa a comentar.</p>}
          </section>
        </div>
      </div>

      {guided !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink text-white" role="dialog" aria-modal="true" aria-label="Modo cozinhar">
          <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm text-white/70 sm:px-8">
            <span className="truncate">
              {recipe.title} · passo {guided + 1} de {recipe.steps.length}
            </span>
            <button
              type="button"
              onClick={() => setGuided(null)}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10"
            >
              <X className="h-4 w-4" /> Sair
            </button>
          </div>
          <div className="h-1 bg-white/10">
            <div
              className="h-1 bg-brand transition-all"
              style={{ width: `${((guided + 1) / recipe.steps.length) * 100}%` }}
            />
          </div>

          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 overflow-y-auto px-5 py-8 sm:px-8">
            <h2 className="text-3xl font-semibold leading-tight text-white sm:text-5xl">{recipe.steps[guided].title}</h2>
            <p className="text-lg leading-relaxed text-white/80 sm:text-2xl">{recipe.steps[guided].text}</p>
            {recipe.steps[guided].timer && (
              <div>
                <StepTimer
                  key={guided}
                  dark
                  label={recipe.steps[guided].timer.label}
                  seconds={recipe.steps[guided].timer.seconds}
                />
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 px-5 py-5 sm:px-8">
            <button
              type="button"
              className="btn border-white/20 bg-transparent text-white hover:bg-white/10"
              disabled={guided === 0}
              onClick={() => setGuided(guided - 1)}
            >
              <ArrowLeft className="h-4 w-4" /> Anterior
            </button>
            {guided < last ? (
              <button type="button" className="btn btn-primary" onClick={() => setGuided(guided + 1)}>
                Próximo <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => setGuided(null)}>
                Concluir <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
    </svg>
  )
}

export default function Recipe() {
  const { id } = useParams()
  const recipe = recipes.find((r) => r.id === id)
  if (!recipe) {
    return <NotFound title="Receita não encontrada" text="O link pode estar errado ou a receita foi removida." />
  }
  return <RecipeView key={recipe.id} recipe={recipe} />
}
