import { Filter, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigationType, useSearchParams } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import { EstadoVazio, Paginacao, SkeletonCardReceita } from '../components/Ui'
import { ENUMS } from '../data/enums'
import { useSeo } from '../lib/seo'
import { useNotas, useRecipes } from '../lib/useRecipes'

const POR_PAGINA = 6
const ORDENS = { recentes: 'Mais recentes', nota: 'Melhor avaliadas', rapidas: 'Mais rápidas' } as const
type Ordem = keyof typeof ORDENS
const FILTROS = [
  { k: 'tipo', label: 'Refeição', mapa: ENUMS.tipo as Record<string, string> },
  { k: 'metodo', label: 'Método de preparo', mapa: ENUMS.metodo as Record<string, string> },
  { k: 'ocasiao', label: 'Ocasião', mapa: ENUMS.ocasiao as Record<string, string> },
  { k: 'perfil', label: 'Perfil alimentar', mapa: ENUMS.perfil as Record<string, string> },
  { k: 'dif', label: 'Dificuldade', mapa: { Fácil: 'Fácil', Médio: 'Médio', Difícil: 'Difícil' } as Record<string, string> },
  { k: 'tempo', label: 'Tempo de preparo', mapa: { '20': 'Até 20 min', '30': 'Até 30 min', '60': 'Até 60 min' } as Record<string, string> },
] as const

function useMobile() {
  const [m, setM] = useState(() => window.matchMedia('(max-width: 1023px)').matches)
  useEffect(() => {
    const q = window.matchMedia('(max-width: 1023px)')
    const f = () => setM(q.matches)
    q.addEventListener('change', f)
    return () => q.removeEventListener('change', f)
  }, [])
  return m
}

export default function Receitas() {
  useSeo({ titulo: 'Receitas', descricao: 'Todas as receitas, com filtros por refeição, método, ocasião, perfil, dificuldade e tempo.' })
  const recipes = useRecipes()
  const notaDe = useNotas()
  const [params, setParams] = useSearchParams()
  const loc = useLocation()
  const navType = useNavigationType()
  const mobile = useMobile()
  const [gaveta, setGaveta] = useState(false)
  const [carregando, setCarregando] = useState(navType !== 'POP')
  const painel = useRef<HTMLElement>(null)
  const abrir = useRef<HTMLButtonElement>(null)

  const q = params.get('q') ?? ''
  const ordem = (params.get('ordem') as Ordem) in ORDENS ? (params.get('ordem') as Ordem) : 'recentes'
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)

  useEffect(() => { if (carregando) { const t = setTimeout(() => setCarregando(false), 350); return () => clearTimeout(t) } }, [carregando])

  // guarda o scroll ao sair por um link e restaura ao voltar (botão voltar do navegador)
  const chaveScroll = `scroll:${loc.pathname}${loc.search}`
  const salvarScroll = () => { try { sessionStorage.setItem(chaveScroll, String(window.scrollY)) } catch { /* sem storage */ } }
  useLayoutEffect(() => {
    if (navType !== 'POP') return
    const y = Number(sessionStorage.getItem(chaveScroll))
    if (!y) return
    const t = setTimeout(() => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }), 120)
    return () => clearTimeout(t)
  }, [chaveScroll, navType])

  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v); else p.delete(k)
    if (k !== 'pagina') p.delete('pagina') // mudar filtro ou ordem volta à página 1
    setParams(p)
  }
  const limpar = () => setParams(new URLSearchParams())

  const lista = useMemo(() => {
    const termo = q.trim().toLowerCase()
    const out = recipes
      .filter((r) => !termo || [r.title, r.author, ...r.ingredients, ...r.collections].some((t) => t.toLowerCase().includes(termo)))
      .filter((r) => !params.get('tipo') || r.tipo === params.get('tipo'))
      .filter((r) => !params.get('metodo') || r.metodo === params.get('metodo'))
      .filter((r) => !params.get('ocasiao') || r.ocasiao === params.get('ocasiao'))
      .filter((r) => !params.get('perfil') || r.perfil === params.get('perfil'))
      .filter((r) => !params.get('dif') || r.difficulty === params.get('dif'))
      .filter((r) => !params.get('tempo') || r.minutes <= Number(params.get('tempo')))
    return out.sort((a, b) =>
      ordem === 'nota' ? notaDe(b.id).media - notaDe(a.id).media || (b.createdAt ?? 0) - (a.createdAt ?? 0)
      : ordem === 'rapidas' ? a.minutes - b.minutes
      : (b.createdAt ?? 0) - (a.createdAt ?? 0),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, params, q, ordem])

  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const atual = Math.min(pagina, totalPaginas)
  const pagItens = lista.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA)
  const ativos = FILTROS.filter((f) => params.get(f.k))

  // gaveta: foco preso e ESC (somente no celular)
  useEffect(() => {
    if (!gaveta || !mobile) return
    document.body.style.overflow = 'hidden'
    painel.current?.querySelector<HTMLElement>('select, button')?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGaveta(false)
      if (e.key === 'Tab') {
        const els = painel.current?.querySelectorAll<HTMLElement>('button, select, input')
        if (!els?.length) return
        const first = els[0], last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', key)
    const btn = abrir.current
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', key); btn?.focus() }
  }, [gaveta, mobile])

  const painelFiltros = (
    <>
      <div className="flex items-center justify-between lg:hidden">
        <h2 className="text-lg font-bold">Filtros</h2>
        <button aria-label="Fechar filtros" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line" onClick={() => setGaveta(false)}><X size={18} /></button>
      </div>
      <h2 className="hidden text-lg font-bold lg:block">Filtros</h2>
      {FILTROS.map((f) => (
        <label key={f.k} className="block text-xs font-semibold text-ink-soft">
          {f.label}
          <select className="input mt-1" value={params.get(f.k) ?? ''} onChange={(e) => set(f.k, e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(f.mapa).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      ))}
      <button className="btn-ghost w-full" onClick={limpar}>Limpar filtros</button>
      <button className="btn-primary w-full lg:hidden" onClick={() => setGaveta(false)}>Ver {lista.length} {lista.length === 1 ? 'resultado' : 'resultados'}</button>
    </>
  )

  return (
    <div className="space-y-8" onClickCapture={salvarScroll}>
      <header className="space-y-3">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">Receitas</h1>
        <p className="text-sm text-ink-soft" role="status" aria-live="polite">{lista.length} {lista.length === 1 ? 'resultado' : 'resultados'}{q ? ` para “${q}”` : ''} · ordenação: {ORDENS[ordem]}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input className="input !w-auto min-w-0 flex-1 !rounded-full sm:max-w-sm" placeholder="Buscar por nome, ingrediente ou chef" aria-label="Buscar receitas" value={q} onChange={(e) => set('q', e.target.value)} />
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          Ordenar
          <select className="input !w-auto !rounded-full" value={ordem} onChange={(e) => set('ordem', e.target.value === 'recentes' ? '' : e.target.value)}>
            {Object.entries(ORDENS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <button ref={abrir} className="btn-ghost lg:hidden" aria-expanded={gaveta} aria-controls="filtros" onClick={() => setGaveta(true)}>
          <Filter size={15} /> Filtros{ativos.length ? ` (${ativos.length})` : ''}
        </button>
      </div>

      {ativos.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
          {ativos.map((f) => (
            <li key={f.k}>
              <button className="chip border-terra/50 bg-peach text-terra" onClick={() => set(f.k, '')} aria-label={`Remover filtro ${f.label}: ${f.mapa[params.get(f.k)!]}`}>
                {f.mapa[params.get(f.k)!]} <X size={12} />
              </button>
            </li>
          ))}
          <li><button className="text-xs font-semibold text-terra underline" onClick={limpar}>Limpar tudo</button></li>
        </ul>
      )}

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {mobile && gaveta && <div className="fixed inset-0 z-40 bg-black/70" onClick={() => setGaveta(false)} aria-hidden />}
        <aside
          id="filtros"
          ref={painel}
          aria-label="Filtros de receitas"
          role={mobile ? 'dialog' : undefined}
          aria-modal={mobile && gaveta ? true : undefined}
          inert={mobile && !gaveta}
          className={`space-y-4 ${mobile ? `fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm overflow-y-auto border-r border-line bg-surface p-5 transition-transform duration-500 ${gaveta ? 'translate-x-0' : '-translate-x-full'}` : 'card self-start p-5'}`}
        >
          {painelFiltros}
        </aside>

        <div className="space-y-8">
          {carregando ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">{Array.from({ length: 6 }).map((_, i) => <SkeletonCardReceita key={i} />)}</div>
          ) : lista.length === 0 ? (
            <EstadoVazio titulo="Nenhuma receita encontrada" texto="Tente remover alguns filtros ou buscar por outro termo." acao={{ onClick: limpar, rotulo: 'Limpar filtros' }} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{pagItens.map((r) => <RecipeCard key={r.id} recipe={r} />)}</div>
          )}
          <Paginacao pagina={atual} total={totalPaginas} onMudar={(p) => { set('pagina', p === 1 ? '' : String(p)); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
        </div>
      </div>
    </div>
  )
}
