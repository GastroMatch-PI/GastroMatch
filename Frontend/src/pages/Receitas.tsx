import { ChevronDown, Filter, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import { EstadoVazio, Paginacao, SkeletonCardReceita } from '../components/Ui'
import { ENUMS } from '../data/enums'
import type { Recipe } from '../data/data'
import { useSeo } from '../lib/seo'
import {
  adaptarResumo,
  buscarFiltrosDisponiveis,
  extrairPagina,
  listarReceitas,
  type FiltrosDisponiveisDto,
  type FiltrosReceita,
  type ReceitaResumoDto,
} from '../api/receitas'

const POR_PAGINA = 12

type GrupoFiltro = {
  chave: keyof Pick<
    FiltrosReceita,
    'tipo' | 'metodo' | 'ocasiao' | 'perfil' | 'dificuldade' | 'tempoMax'
  >
  titulo: string
  opcoes: [string, string][]
}

function rotulo(valor: string, mapa: Record<string, string>) {
  return mapa[valor] ?? valor.replaceAll('_', ' ').toLowerCase()
}

function criarOpcoesDeTempo(filtros: FiltrosDisponiveisDto | null): [string, string][] {
  if (filtros?.tempoMaximo == null) return []

  const max = filtros.tempoMaximo
  const min = filtros.tempoMinimo ?? 0
  const limites = [...new Set([15, 30, 45, 60, 90, max])]
    .filter((limite) => limite >= min && limite <= max)
    .sort((a, b) => a - b)

  return limites.map((limite) => [String(limite), `Até ${limite} min`])
}

export default function Receitas() {
  useSeo({
    titulo: 'Receitas',
    descricao: 'Encontre receitas e filtre por refeição, preparo, ocasião, perfil, dificuldade e tempo.',
  })

  const [params, setParams] = useSearchParams()
  const [receitas, setReceitas] = useState<Recipe[]>([])
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [erroFiltros, setErroFiltros] = useState('')
  const [filtrosDisponiveis, setFiltrosDisponiveis] =
    useState<FiltrosDisponiveisDto | null>(null)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const topo = useRef<HTMLDivElement>(null)

  const q = params.get('q') ?? ''
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)

  const filtros: FiltrosReceita = {
    texto: q.trim() || undefined,
    tipo: params.get('tipo') || undefined,
    metodo: params.get('metodo') || undefined,
    ocasiao: params.get('ocasiao') || undefined,
    perfil: params.get('perfil') || undefined,
    dificuldade: params.get('dificuldade') || undefined,
    tempoMax: params.has('tempoMax')
      ? Number(params.get('tempoMax'))
      : undefined,
  }

  const chave = JSON.stringify({ ...filtros, pagina })

  useEffect(() => {
    let ativo = true

    buscarFiltrosDisponiveis()
      .then((dados) => {
        if (ativo && dados) setFiltrosDisponiveis(dados)
      })
      .catch((e: unknown) => {
        if (ativo) {
          setErroFiltros(
            e instanceof Error
              ? e.message
              : 'Não foi possível carregar as opções dos filtros.',
          )
        }
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')

    const timer = window.setTimeout(() => {
      listarReceitas({
        ...filtros,
        pagina: pagina - 1,
        tamanho: POR_PAGINA,
      })
        .then((bruto) => {
          if (!ativo) return
          const resultado = extrairPagina<ReceitaResumoDto>(bruto)
          setReceitas(resultado.itens.map(adaptarResumo))
          setTotalPaginas(Math.max(1, resultado.totalPaginas))
        })
        .catch((e: unknown) => {
          if (ativo) {
            setErro(e instanceof Error ? e.message : 'Não foi possível carregar as receitas.')
          }
        })
        .finally(() => {
          if (ativo) setCarregando(false)
        })
    }, 300)

    return () => {
      ativo = false
      window.clearTimeout(timer)
    }
    // A chave representa todos os filtros e a página atual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  const tempoOpcoes = criarOpcoesDeTempo(filtrosDisponiveis)

const grupos: GrupoFiltro[] = [
  {
    chave: 'tipo',
    titulo: 'Refeição',
    opcoes: (
      filtrosDisponiveis?.tipos?.length
        ? filtrosDisponiveis.tipos
        : Object.keys(ENUMS.tipo)
    ).map((v) => [v, rotulo(v, ENUMS.tipo as Record<string, string>)]),
  },
  {
    chave: 'metodo',
    titulo: 'Método de preparo',
    opcoes: (
      filtrosDisponiveis?.metodos?.length
        ? filtrosDisponiveis.metodos
        : Object.keys(ENUMS.metodo)
    ).map((v) => [v, rotulo(v, ENUMS.metodo as Record<string, string>)]),
  },
  {
    chave: 'ocasiao',
    titulo: 'Ocasião',
    opcoes: (
      filtrosDisponiveis?.ocasioes?.length
        ? filtrosDisponiveis.ocasioes
        : Object.keys(ENUMS.ocasiao)
    ).map((v) => [v, rotulo(v, ENUMS.ocasiao as Record<string, string>)]),
  },
  {
    chave: 'perfil',
    titulo: 'Perfil alimentar',
    opcoes: (
      filtrosDisponiveis?.perfis?.length
        ? filtrosDisponiveis.perfis
        : Object.keys(ENUMS.perfil)
    ).map((v) => [v, rotulo(v, ENUMS.perfil as Record<string, string>)]),
  },
  {
    chave: 'dificuldade',
    titulo: 'Dificuldade',
    opcoes: (
      filtrosDisponiveis?.dificuldades?.length
        ? filtrosDisponiveis.dificuldades
        : Object.keys(ENUMS.dificuldade)
    ).map((v) => [v, rotulo(v, ENUMS.dificuldade as Record<string, string>)]),
  },
  {
    chave: 'tempoMax',
    titulo: 'Tempo de preparo',
    opcoes: tempoOpcoes.length
      ? tempoOpcoes
      : [
          ['20', 'Até 20 min'],
          ['30', 'Até 30 min'],
          ['60', 'Até 60 min'],
        ],
  },
]

  const ativos = grupos.filter((grupo) => params.has(grupo.chave))

  const setFiltro = (chave: string, valor: string) => {
    const novos = new URLSearchParams(params)
    if (valor) novos.set(chave, valor)
    else novos.delete(chave)

    novos.delete('pagina')
    setParams(novos)
  }

  const limpar = () => setParams(new URLSearchParams())
  const paginaAtual = Math.min(pagina, totalPaginas)

  return (
    <div className="space-y-8" ref={topo}>
      <header className="space-y-3">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">
          Receitas
        </h1>
        <p className="text-sm text-ink-soft" role="status" aria-live="polite">
          {q ? `Resultados para “${q}” · ` : ''}
          Página {paginaAtual} de {totalPaginas}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input !w-auto min-w-0 flex-1 !rounded-full sm:max-w-sm"
          placeholder="Buscar por nome, ingrediente ou chef"
          aria-label="Buscar receitas"
          value={q}
          onChange={(e) => setFiltro('q', e.target.value)}
        />

        <button
          className="btn-ghost lg:hidden"
          aria-expanded={filtrosAbertos}
          aria-controls="filtros"
          onClick={() => setFiltrosAbertos((aberto) => !aberto)}
        >
          <Filter size={15} />
          Filtros{ativos.length ? ` (${ativos.length})` : ''}
        </button>
      </div>

      {ativos.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Filtros ativos">
          {ativos.map((grupo) => {
            const valor = params.get(grupo.chave) ?? ''
            const nome = grupo.opcoes.find(([codigo]) => codigo === valor)?.[1] ?? valor

            return (
              <li key={grupo.chave}>
                <button
                  className="chip border-terra/50 bg-peach text-terra"
                  onClick={() => setFiltro(grupo.chave, '')}
                  aria-label={`Remover filtro ${grupo.titulo}`}
                >
                  {nome}
                  <X size={12} />
                </button>
              </li>
            )
          })}
          <li>
            <button
              className="text-xs font-semibold text-terra underline"
              onClick={limpar}
            >
              Limpar tudo
            </button>
          </li>
        </ul>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside
          id="filtros"
          aria-label="Filtros de receitas"
          className={`${filtrosAbertos ? 'block' : 'hidden'} card h-fit space-y-3 p-5 lg:block`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Filtrar receitas</h2>
            <button
              className="text-xs font-semibold text-terra underline"
              onClick={limpar}
            >
              Limpar
            </button>
          </div>

          {erroFiltros && (
            <p role="alert" className="text-xs text-alert">
              {erroFiltros}
            </p>
          )}

          {!filtrosDisponiveis && !erroFiltros && (
            <p className="text-xs text-ink-soft">Carregando opções...</p>
          )}

          {grupos.map((grupo) => (
            <details
              key={grupo.chave}
              className="border-t border-line py-3"
              open={params.has(grupo.chave)}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                <span>{grupo.titulo}</span>
                <ChevronDown size={16} className="shrink-0" />
              </summary>

              <div className="mt-3 space-y-2">
                {grupo.opcoes.length === 0 ? (
                  <p className="text-xs text-ink-soft">
                    Nenhuma opção disponível nas receitas cadastradas.
                  </p>
                ) : (
                  grupo.opcoes.map(([valor, nome]) => (
                    <label
                      key={valor}
                      className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft"
                    >
                      <input
                        type="radio"
                        name={grupo.chave}
                        checked={params.get(grupo.chave) === valor}
                        onChange={() => setFiltro(grupo.chave, valor)}
                      />
                      {nome}
                    </label>
                  ))
                )}

                {params.has(grupo.chave) && (
                  <button
                    className="pt-1 text-xs font-semibold text-terra underline"
                    onClick={() => setFiltro(grupo.chave, '')}
                  >
                    Remover seleção
                  </button>
                )}
              </div>
            </details>
          ))}
        </aside>

        <main className="space-y-8">
          {erro && (
            <p role="alert" className="card p-6 text-sm text-alert">
              {erro}
            </p>
          )}

          {carregando ? (
            <div
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
              aria-busy="true"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCardReceita key={i} />
              ))}
            </div>
          ) : receitas.length === 0 && !erro ? (
            <EstadoVazio
              titulo="Nenhuma receita encontrada"
              texto="Tente remover alguns filtros ou buscar por outro termo."
              acao={{ onClick: limpar, rotulo: 'Limpar filtros' }}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {receitas.map((receita) => (
                <RecipeCard key={receita.id} recipe={receita} />
              ))}
            </div>
          )}

          <Paginacao
            pagina={paginaAtual}
            total={totalPaginas}
            onMudar={(novaPagina) => {
              const novos = new URLSearchParams(params)
              if (novaPagina === 1) novos.delete('pagina')
              else novos.set('pagina', String(novaPagina))
              setParams(novos)
              topo.current?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        </main>
      </div>
    </div>
  )
}