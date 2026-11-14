import { Filter, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType, useSearchParams } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import { Carregando, ErroApi, EstadoVazio, Paginacao } from '../components/Ui'
import { ENUMS } from '../data/enums'
import { qs } from '../lib/api'
import type { Pagina, ReceitaResumo } from '../lib/apiTipos'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'

const TAMANHO = 12
const FILTROS = [
  { k: 'tipo', label: 'Refeição', mapa: ENUMS.tipo as Record<string, string> },
  { k: 'metodo', label: 'Método de preparo', mapa: ENUMS.metodo as Record<string, string> },
  { k: 'ocasiao', label: 'Ocasião', mapa: ENUMS.ocasiao as Record<string, string> },
  { k: 'perfil', label: 'Perfil alimentar', mapa: ENUMS.perfil as Record<string, string> },
  { k: 'dificuldade', label: 'Dificuldade', mapa: ENUMS.dificuldade as Record<string, string> },
  { k: 'tempoMax', label: 'Tempo de preparo', mapa: { '20': 'Até 20 min', '30': 'Até 30 min', '60': 'Até 60 min' } as Record<string, string> },
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
  const [params, setParams] = useSearchParams()
  const loc = useLocation()
  const navType = useNavigationType()
  const mobile = useMobile()
  const [gaveta, setGaveta] = useState(false)
  const painel = useRef<HTMLElement>(null)
  const abrir = useRef<HTMLButtonElement>(null)

  const q = params.get('q') ?? ''
  const [busca, setBusca] = useState(q)
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)

  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v); else p.delete(k)
    if (k !== 'pagina') p.delete('pagina') // mudar filtro volta à página 1
    setParams(p)
  }
  // texto com debounce: só consulta a API depois de parar de digitar
  useEffect(() => { setBusca(q) }, [q])
  useEffect(() => { if (busca === q) return; const t = setTimeout(() => set('q', busca.trim()), 400); return () => clearTimeout(t) }, [busca]) // eslint-disable-line react-hooks/exhaustive-deps

  const caminho = `/receitas${qs({
    texto: q || undefined, tipo: params.get('tipo'), metodo: params.get('metodo'), ocasiao: params.get('ocasiao'), perfil: params.get('perfil'),
    dificuldade: params.get('dificuldade'), tempoMax: params.get('tempoMax'), pagina: pagina - 1, tamanho: TAMANHO,
  })}`
  const { dados, carregando, erro, lento, recarregar } = useApi<Pagina<ReceitaResumo>>(caminho)

  const chaveScroll = `scroll:${loc.pathname}${loc.search}`
  const salvarScroll = () => { try { sessionStorage.setItem(chaveScroll, String(window.scrollY)) } catch { /* sem storage */ } }
  useLayoutEffect(() => {
    if (navType !== 'POP' || !dados) return
    const y = Number(sessionStorage.getItem(chaveScroll))
    if (!y) return
    const t = setTimeout(() => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }), 120)
    return () => clearTimeout(t)
  }, [chaveScroll, navType, !!dados]) // eslint-disable-line react-hooks/exhaustive-deps

  const limpar = () => setParams(new URLSearchParams())
  const ativos = FILTROS.filter((f) => params.get(f.k))
  const total = dados?.totalElementos ?? 0

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
      <button className="btn-primary w-full lg:hidden" onClick={() => setGaveta(false)}>Ver {total} {total === 1 ? 'resultado' : 'resultados'}</button>
    </>
  )

  return (
    <div className="space-y-8" onClickCapture={salvarScroll}>
      <header className="space-y-3">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">Receitas</h1>
        <p className="text-sm text-ink-soft" role="status" aria-live="polite">{dados ? `${total} ${total === 1 ? 'resultado' : 'resultados'}${q ? ` para “${q}”` : ''}` : ' '}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input className="input !w-auto min-w-0 flex-1 !rounded-full sm:max-w-sm" placeholder="Buscar por nome ou descrição" aria-label="Buscar receitas" value={busca} onChange={(e) => setBusca(e.target.value)} />
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
          {erro ? (
            <ErroApi erro={erro} onTentar={recarregar} />
          ) : !dados ? (
            <Carregando lento={lento} texto="Carregando receitas" />
          ) : dados.conteudo.length === 0 ? (
            <EstadoVazio titulo="Nenhuma receita encontrada" texto="Tente remover alguns filtros ou buscar por outro termo." acao={{ onClick: limpar, rotulo: 'Limpar filtros' }} />
          ) : (
            <div className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 transition-opacity ${carregando ? 'opacity-60' : ''}`} aria-busy={carregando}>{dados.conteudo.map((r) => <RecipeCard key={r.id} receita={r} />)}</div>
          )}
          <Paginacao pagina={pagina} total={dados?.totalPaginas ?? 1} onMudar={(p) => { set('pagina', p === 1 ? '' : String(p)); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
        </div>
      </div>
    </div>
  )
}
