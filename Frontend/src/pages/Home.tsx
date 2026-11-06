import { ArrowRight, Plus, Refrigerator, Search, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { Reveal, SplitWords } from '../components/Motion'
import RecipeCard from '../components/RecipeCard'
import { collections, fridgeItems } from '../data/data'
import Carrossel from '../components/Carrossel'
import CardRestaurante from '../components/CardRestaurante'
import { EstadoVazio } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'
import { useRecipes } from '../lib/useRecipes'


export default function Home() {
  useSeo({ titulo: 'GastroMatch' })
  const { perfis } = useAuth()
  const restaurantes = perfis.filter((p) => p.papel === 'RESTAURANTE' && p.status === 'APROVADO')
  const recipes = useRecipes()
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25])
  const [params] = useSearchParams()
  const [maxMin, setMaxMin] = useState(0)
  const [dif, setDif] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [searched, setSearched] = useState(false)
  const [tab, setTab] = useState<'geladeira' | 'prato'>(params.get('q') ? 'prato' : 'geladeira')
  const [dish, setDish] = useState(params.get('q') ?? '')
  const [collection, setCollection] = useState('Todos')

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


  return (
    <div className="space-y-16">
      <section ref={heroRef} className="grain relative -mx-4 -mt-6 overflow-hidden bg-cream sm:mx-0 sm:mt-0 sm:rounded-[2.25rem]">
        <motion.img
          src="/img/hero.jpg"
          alt=""
          style={{ y: imgY, scale: imgScale }}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/55 to-cream/20" />
        <div className="glow absolute -left-32 top-10 h-[34rem] w-[34rem]" aria-hidden />
        <div className="relative flex min-h-[34rem] flex-col justify-end gap-8 px-6 pb-12 pt-32 sm:min-h-[40rem] sm:px-12 sm:pb-16">
          <h1 className="max-w-4xl font-display text-[clamp(2.75rem,9vw,7rem)] font-extrabold uppercase leading-[0.92] tracking-tight">
            <SplitWords text="Cozinhe o que" delay={0.5} />
            <br />
            <span className="text-terra"><SplitWords text="você já tem" delay={0.8} /></span>
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-end justify-between gap-6"
          >
            <p className="max-w-md text-base text-ink-soft">
              Receitas de chefs, nutricionistas e restaurantes. Escolha o que tem na geladeira e veja o que dá para fazer agora.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#geladeira" className="btn-primary !px-7 !py-3.5">
                <Refrigerator size={18} /> Usar minha geladeira
              </a>
              <Link to="/receitas" className="btn-ghost !px-7 !py-3.5">
                Ver todas as receitas <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Reveal><section id="geladeira" className="card scroll-mt-24 space-y-5 p-5 md:p-8">
        <div role="tablist" className="inline-flex rounded-full border border-line bg-cream p-1 text-sm font-semibold">
          {(['geladeira', 'prato'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 transition duration-200 ${tab === t ? 'bg-terra text-on-accent shadow-soft' : 'text-ink-soft hover:text-terra'}`}
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
                  className={`chip ${selected.includes(i) ? 'border-terra bg-terra text-on-accent' : 'border-line bg-surface text-ink-soft hover:bg-peach'}`}
                >
                  {selected.includes(i) ? <X size={13} /> : <Plus size={13} />} {i}
                </button>
              ))}
            </div>
            <button className="btn-primary" disabled={selected.length < 2} onClick={() => setSearched(true)}>
              <Sparkles size={16} /> Encontrar receitas
              <span className="rounded-full bg-surface/25 px-2 py-0.5 text-xs">{matches.length}</span>
            </button>
            {searched && (
              matches.length ? (
                <div className="grid gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map(({ recipe, match }) => (
                    <RecipeCard key={recipe.id} recipe={recipe} match={match} />
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
      </section></Reveal>

      <section id="receitas" className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">Receitas</h2>
            <p className="mt-3 text-sm text-ink-soft">{list.length} {list.length === 1 ? 'receita' : 'receitas'} para cozinhar agora</p>
          </div>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar por categoria">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {collections.map((c) => (
              <button
                key={c}
                onClick={() => setCollection(c)}
                aria-pressed={collection === c}
                className={`chip !px-5 !py-2.5 text-sm ${collection === c ? 'border-terra bg-terra text-on-accent' : 'border-line bg-surface text-ink-soft hover:border-terra/50 hover:text-terra'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <p className="card p-10 text-center text-sm text-ink-soft">Nenhuma receita encontrada com esses filtros.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((r, i) => (
              <Reveal key={r.id} delay={(i % 3) * 0.08} className={i === 0 && list.length > 2 ? 'sm:col-span-2' : ''}>
                <RecipeCard recipe={r} featured={i === 0 && list.length > 2} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section id="restaurantes" className="space-y-5" aria-labelledby="rest-t">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="rest-t" className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-6xl">Restaurantes</h2>
          <Link to="/restaurantes" className="btn-ghost">Ver todos <ArrowRight size={16} /></Link>
        </div>
        {restaurantes.length === 0 ? (
          <EstadoVazio titulo="Ainda não há restaurantes cadastrados" texto="Cadastre o seu e ele aparece aqui." acao={{ to: '/onboarding', rotulo: 'Cadastrar restaurante' }} />
        ) : (
          <Carrossel rotulo="Restaurantes cadastrados" itens={restaurantes.map((r) => <CardRestaurante key={r.userId} restaurante={r} variante="carrossel" />)} />
        )}
      </section>

      <Reveal>
        <section id="comunidade" className="grain relative overflow-hidden rounded-[2.25rem] bg-terra p-8 sm:p-14">
          <h2 className="max-w-3xl font-display text-[clamp(2.25rem,7vw,5.5rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-on-accent">
            Quem cozinha por trás da receita
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-sm text-sm font-semibold text-on-accent/80">Conheça chefs, nutricionistas e restaurantes cadastrados, ou crie o seu perfil.</p>
            <Link to="/profissionais" className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
              Ver diretório <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  )
}
