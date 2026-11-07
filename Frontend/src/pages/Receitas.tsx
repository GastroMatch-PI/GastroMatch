import { Filter, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import { EstadoVazio, Paginacao, SkeletonCardReceita } from '../components/Ui'
import { ENUMS } from '../data/enums'
import type { Recipe } from '../data/data'
import { useSeo } from '../lib/seo'
import {
  adaptarResumo,
  extrairPagina,
  listarReceitas,
  type FiltrosReceita,
  type ReceitaResumoDto,
} from '../api/receitas'

const POR_PAGINA = 12

const FILTROS: { k: string; label: string; mapa: Record<string, string> }[] = [
  { k: 'tipo', label: 'Refeição', mapa: ENUMS.tipo as Record<string, string> },
  { k: 'metodo', label: 'Método de preparo', mapa: ENUMS.metodo as Record<string, string> },
  { k: 'ocasiao', label: 'Ocasião', mapa: ENUMS.ocasiao as Record<string, string> },
  { k: 'perfil', label: 'Perfil alimentar', mapa: ENUMS.perfil as Record<string, string> },
  { k: 'dificuldade', label: 'Dificuldade', mapa: ENUMS.dificuldade as Record<string, string> },
  { k: 'tempoMax', label: 'Tempo de preparo', mapa: { '20': 'Até 20 min', '30': 'Até 30 min', '60': 'Até 60 min' } },
]

export default function Receitas() {
  useSeo({ titulo: 'Receitas', descricao: 'Todas as receitas, com filtros por refeição, método, ocasião, perfil, dificuldade e tempo.' })
  const [params, setParams] = useSearchParams()
  const [receitas, setReceitas] = useState<Recipe[]>([])
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const topo = useRef<HTMLDivElement>(null)

  const q = params.get('q') ?? ''
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)
  const tempo = params.get('tempoMax')

  const filtros: FiltrosReceita = {
    texto: q.trim() || undefined,
    tipo: params.get('tipo') || undefined,
    metodo: params.get('metodo') || undefined,
    ocasiao: params.get('ocasiao') || undefined,
    perfil: params.get('perfil') || undefined,
    dificuldade: params.get('dificuldade') || undefined,
    tempoMax: tempo ? Number(tempo) : undefined,
  }
  const chave = JSON.stringify({ ...filtros, pagina })

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')
    const t = setTimeout(() => {
      listarReceitas({ ...filtros, pagina: pagina - 1, tamanho: POR_PAGINA })
        .then((bruto) => {
          if (!ativo) return
          const p = extrairPagina<ReceitaResumoDto>(bruto)
          setReceitas(p.itens.map(adaptarResumo))
          setTotalPaginas(Math.max(1, p.totalPaginas))
        })
        .catch((e) => {
          if (ativo) setErro((e as Error).message)
        })
        .finally(() => {
          if (ativo) setCarregando(false)
        })
    }, 300)
    return () => {
      ativo = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  const atual = Math.min(pagina, totalPaginas)
  const ativos = FILTROS.filter((f) => params.get(f.k))

  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    if (k !== 'pagina') p.delete('pagina') // mudar filtro ou busca volta para a página 1
    setParams(p)
  }
  const limpar = () => setParams(new URLSearchParams())

  return (
    <div className="space-y-8" ref={topo}>
      <header className="space-y-3">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">Receitas</h1>
        <p className="text-sm text-ink-soft" role="status" aria-live="polite">
          {q ? `Resultados para “${q}” · ` : ''}Página {atual} de {totalPaginas}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input !w-auto min-w-0 flex-1 !rounded-full sm:max-w-sm"
          placeholder="Buscar por nome, ingrediente ou chef"
          aria-label="Buscar receitas"
          value={q}
          onChange={(e) => set('q', e.target.value)}
        />
        <button
          className="btn-ghost lg:hidden"
          aria-expanded={filtrosAbertos}
          aria-controls="filtros"
          onClick={() => setFiltrosAbertos((v) => !v)}
        >
          <Filter size={15} /> Filtros{ativos.length ? ` (${ativos.length})` : ''}
        </button>
      </div>

      {ativos.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
          {ativos.map((f) => (
            <li key={f.k}>
              <button className="chip border-terra/50 bg-peach text-terra" onClick={() => set(f.k, '')} aria-label={`Remover filtro ${f.label}`}>
                {f.mapa[params.get(f.k)!] ?? params.get(f.k)} <X size={12} />
              </button>
            </li>
          ))}
          <li><button className="text-xs font-semibold text-terra underline" onClick={limpar}>Limpar tudo</button></li>
        </ul>
      )}

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside id="filtros" aria-label="Filtros de receitas" className={`${filtrosAbertos ? 'block' : 'hidden'} card space-y-4 self-start p-5 lg:block`}>
          <h2 className="text-lg font-bold">Filtros</h2>
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
        </aside>

        <div className="space-y-8">
          {erro && <p role="alert" className="card p-6 text-sm text-alert">{erro}</p>}

          {carregando ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCardReceita key={i} />)}
            </div>
          ) : receitas.length === 0 && !erro ? (
            <EstadoVazio titulo="Nenhuma receita encontrada" texto="Tente remover alguns filtros ou buscar por outro termo." acao={{ onClick: limpar, rotulo: 'Limpar filtros' }} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {receitas.map((r) => <RecipeCard key={r.id} recipe={r} />)}
            </div>
          )}

          <Paginacao
            pagina={atual}
            total={totalPaginas}
            onMudar={(p) => {
              set('pagina', p === 1 ? '' : String(p))
              topo.current?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        </div>
      </div>
    </div>
  )
}