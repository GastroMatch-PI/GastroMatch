import { ArrowRight, ChevronDown, Refrigerator, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import { Reveal, SplitWords } from '../components/Motion'
import RecipeCard from '../components/RecipeCard'
import Carrossel from '../components/Carrossel'
import CardRestaurante from '../components/CardRestaurante'
import { EstadoVazio } from '../components/Ui'
import { adaptarRestaurante, listarRestaurantes } from '../api/restaurantes'
import {
  buscarFiltrosDisponiveis,
  type FiltrosDisponiveisDto,
  type FiltrosReceita,
} from '../api/receitas'
import type { PerfilPro } from '../lib/tipos'
import { ENUMS } from '../data/enums'
import { useSeo } from '../lib/seo'
import { useReceitasApi } from '../api/useReceitas'

type ChaveFiltro = 'tipo' | 'metodo' | 'ocasiao' | 'perfil' | 'dificuldade' | 'tempoMax'

type GrupoFiltro = {
  chave: ChaveFiltro
  titulo: string
  opcoes: [string, string][]
}

function rotulo(valor: string, mapa: Record<string, string>) {
  return mapa[valor] ?? valor.replaceAll('_', ' ').toLowerCase()
}

function opcoesDoBanco(
  valores: string[] | undefined,
  mapa: Record<string, string>,
): [string, string][] {
  const disponiveis = valores?.length ? valores : Object.keys(mapa)

  return disponiveis.map((valor): [string, string] => [
    valor,
    rotulo(valor, mapa),
  ])
}

function opcoesDeTempo(
  filtros: FiltrosDisponiveisDto | null,
): [string, string][] {
  if (filtros?.tempoMaximo == null) {
    return [
      ['20', 'Até 20 min'],
      ['30', 'Até 30 min'],
      ['60', 'Até 60 min'],
    ]
  }

  const maximo = filtros.tempoMaximo
  const minimo = filtros.tempoMinimo ?? 0
  const limites = [...new Set([15, 30, 45, 60, 90, maximo])]
    .filter((limite) => limite >= minimo && limite <= maximo)
    .sort((a, b) => a - b)

  return limites.map((limite): [string, string] => [
    String(limite),
    `Até ${limite} min`,
  ])
}

export default function Home() {
  useSeo({ titulo: 'GastroMatch' })

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25])
  const [params] = useSearchParams()

  const [tab, setTab] = useState<'geladeira' | 'prato'>(
    params.get('q') ? 'prato' : 'geladeira',
  )
  const [dish, setDish] = useState(params.get('q') ?? '')
  const [filtrosSelecionados, setFiltrosSelecionados] =
    useState<Record<string, string>>({})
  const [filtrosDisponiveis, setFiltrosDisponiveis] =
    useState<FiltrosDisponiveisDto | null>(null)
  const [erroFiltros, setErroFiltros] = useState('')
  const [restaurantes, setRestaurantes] = useState<PerfilPro[]>([])

  useEffect(() => {
    let ativo = true

    buscarFiltrosDisponiveis()
      .then((dados) => {
        if (ativo && dados) setFiltrosDisponiveis(dados)
      })
      .catch((erro: unknown) => {
        if (!ativo) return
        setErroFiltros(
          erro instanceof Error
            ? erro.message
            : 'Não foi possível carregar as opções dos filtros.',
        )
      })

    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    let ativo = true

    listarRestaurantes({ pagina: 0, tamanho: 8 })
      .then((pagina) => {
        if (ativo) setRestaurantes(pagina.itens.map(adaptarRestaurante))
      })
      .catch(() => {
        if (ativo) setRestaurantes([])
      })

    return () => {
      ativo = false
    }
  }, [])

  const filtrosReceita: FiltrosReceita = {
    texto: dish.trim() || undefined,
    tempoMax: filtrosSelecionados.tempoMax
      ? Number(filtrosSelecionados.tempoMax)
      : undefined,
    dificuldade: filtrosSelecionados.dificuldade || undefined,
    tipo: filtrosSelecionados.tipo || undefined,
    metodo: filtrosSelecionados.metodo || undefined,
    ocasiao: filtrosSelecionados.ocasiao || undefined,
    perfil: filtrosSelecionados.perfil || undefined,
  }

  const { receitas, carregando, erro, temMais, carregarMais } =
    useReceitasApi(filtrosReceita)

  const grupos: GrupoFiltro[] = [
    {
      chave: 'tipo',
      titulo: 'Refeição',
      opcoes: opcoesDoBanco(
        filtrosDisponiveis?.tipos,
        ENUMS.tipo as Record<string, string>,
      ),
    },
    {
      chave: 'metodo',
      titulo: 'Método de preparo',
      opcoes: opcoesDoBanco(
        filtrosDisponiveis?.metodos,
        ENUMS.metodo as Record<string, string>,
      ),
    },
    {
      chave: 'ocasiao',
      titulo: 'Ocasião',
      opcoes: opcoesDoBanco(
        filtrosDisponiveis?.ocasioes,
        ENUMS.ocasiao as Record<string, string>,
      ),
    },
    {
      chave: 'perfil',
      titulo: 'Perfil alimentar',
      opcoes: opcoesDoBanco(
        filtrosDisponiveis?.perfis,
        ENUMS.perfil as Record<string, string>,
      ),
    },
    {
      chave: 'dificuldade',
      titulo: 'Dificuldade',
      opcoes: opcoesDoBanco(
        filtrosDisponiveis?.dificuldades,
        ENUMS.dificuldade as Record<string, string>,
      ),
    },
    {
      chave: 'tempoMax',
      titulo: 'Tempo de preparo',
      opcoes: opcoesDeTempo(filtrosDisponiveis),
    },
  ]

  const selecionarFiltro = (chave: ChaveFiltro, valor: string) => {
    setFiltrosSelecionados((atuais) => {
      const novos = { ...atuais }

      if (valor) novos[chave] = valor
      else delete novos[chave]

      return novos
    })
  }

  const limparFiltros = () => setFiltrosSelecionados({})

  return (
    <div className="space-y-16">
      <section
        ref={heroRef}
        className="grain relative -mx-4 -mt-6 overflow-hidden bg-cream sm:mx-0 sm:mt-0 sm:rounded-[2.25rem]"
      >
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
            <span className="text-terra">
              <SplitWords text="você já tem" delay={0.8} />
            </span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 1.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-wrap items-end justify-between gap-6"
          >
            <p className="max-w-md text-base text-ink-soft">
              Receitas de chefs, nutricionistas e restaurantes. Escolha o que
              tem na geladeira e veja o que dá para fazer agora.
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

      <Reveal>
        <section
          id="geladeira"
          className="card scroll-mt-24 space-y-5 p-5 md:p-8"
        >
          <div
            role="tablist"
            className="inline-flex rounded-full border border-line bg-cream p-1 text-sm font-semibold"
          >
            {(['geladeira', 'prato'] as const).map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={tab === item}
                onClick={() => setTab(item)}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 transition duration-200 ${
                  tab === item
                    ? 'bg-terra text-on-accent shadow-soft'
                    : 'text-ink-soft hover:text-terra'
                }`}
              >
                {item === 'geladeira' ? (
                  <>
                    <Refrigerator size={16} /> O que tenho em casa
                  </>
                ) : (
                  <>
                    <Search size={16} /> Buscar receitas
                  </>
                )}
              </button>
            ))}
          </div>

          {tab === 'geladeira' ? (
            <p className="rounded-2xl bg-peach p-4 text-sm text-ink-soft">
              A busca pela geladeira será ligada à API na próxima etapa, usando
              os ingredientes reais do catálogo.
            </p>
          ) : (
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                className="input !rounded-full !py-3 !pl-11"
                placeholder="Nome, ingrediente, chef ou tipo..."
                aria-label="Buscar receitas"
                value={dish}
                onChange={(e) => setDish(e.target.value)}
              />
            </div>
          )}
        </section>
      </Reveal>

      <section id="receitas" className="space-y-8">
        <div>
          <h2 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">
            Receitas
          </h2>
          <p className="mt-3 text-sm text-ink-soft" aria-live="polite">
            {receitas.length}{' '}
            {receitas.length === 1 ? 'receita' : 'receitas'}{' '}
            {temMais ? 'carregadas' : 'para cozinhar agora'}
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside
            aria-label="Filtros de receitas"
            className="card h-fit space-y-2 p-5"
          >
            <div className="flex items-center justify-between gap-3 pb-2">
              <h3 className="text-lg font-bold">Filtrar receitas</h3>
              <button
                type="button"
                onClick={limparFiltros}
                className="text-xs font-semibold text-terra underline"
              >
                Limpar
              </button>
            </div>

            {erroFiltros && (
              <p role="alert" className="pb-2 text-xs text-alert">
                Não foi possível carregar as opções do banco. Exibindo opções
                disponíveis no sistema.
              </p>
            )}

            {grupos.map((grupo) => (
              <details
                key={grupo.chave}
                className="border-t border-line py-3"
                open={Boolean(filtrosSelecionados[grupo.chave])}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                  <span>{grupo.titulo}</span>
                  <ChevronDown size={16} className="shrink-0" />
                </summary>

                <div className="mt-3 space-y-2">
                  {grupo.opcoes.map(([valor, nome]) => (
                    <label
                      key={valor}
                      className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft"
                    >
                      <input
                        type="radio"
                        name={`filtro-${grupo.chave}`}
                        checked={filtrosSelecionados[grupo.chave] === valor}
                        onChange={() => selecionarFiltro(grupo.chave, valor)}
                      />
                      <span>{nome}</span>
                    </label>
                  ))}

                  {filtrosSelecionados[grupo.chave] && (
                    <button
                      type="button"
                      onClick={() => selecionarFiltro(grupo.chave, '')}
                      className="pt-1 text-xs font-semibold text-terra underline"
                    >
                      Remover seleção
                    </button>
                  )}
                </div>
              </details>
            ))}
          </aside>

          <div className="min-w-0 space-y-6">
            {erro && (
              <p role="alert" className="card p-6 text-sm text-alert">
                {erro}
              </p>
            )}

            {carregando ? (
              <p className="card p-10 text-center text-sm text-ink-soft">
                Carregando receitas...
              </p>
            ) : receitas.length === 0 && !erro ? (
              <p className="card p-10 text-center text-sm text-ink-soft">
                Nenhuma receita encontrada com esses filtros.
              </p>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {receitas.map((receita, indice) => (
                    <Reveal
                      key={receita.id}
                      delay={(indice % 3) * 0.08}
                      className={
                        indice === 0 && receitas.length > 2
                          ? 'sm:col-span-2'
                          : ''
                      }
                    >
                      <RecipeCard
                        recipe={receita}
                        featured={indice === 0 && receitas.length > 2}
                      />
                    </Reveal>
                  ))}
                </div>

                {temMais && (
                  <div className="flex justify-center">
                    <button
                      className="btn-ghost"
                      onClick={carregarMais}
                    >
                      Carregar mais
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section
        id="restaurantes"
        className="space-y-5"
        aria-labelledby="rest-t"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2
            id="rest-t"
            className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-6xl"
          >
            Restaurantes
          </h2>
          <Link to="/restaurantes" className="btn-ghost">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        {restaurantes.length === 0 ? (
          <EstadoVazio
            titulo="Ainda não há restaurantes cadastrados"
            texto="Cadastre o seu e ele aparece aqui."
            acao={{ to: '/onboarding', rotulo: 'Cadastrar restaurante' }}
          />
        ) : (
          <Carrossel
            rotulo="Restaurantes cadastrados"
            itens={restaurantes.map((restaurante) => (
              <CardRestaurante
                key={restaurante.userId}
                restaurante={restaurante}
                variante="carrossel"
              />
            ))}
          />
        )}
      </section>

      <Reveal>
        <section
          id="comunidade"
          className="grain relative overflow-hidden rounded-[2.25rem] bg-terra p-8 sm:p-14"
        >
          <h2 className="max-w-3xl font-display text-[clamp(2.25rem,7vw,5.5rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-on-accent">
            Quem cozinha por trás da receita
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-sm text-sm font-semibold text-on-accent/80">
              Conheça chefs, nutricionistas e restaurantes cadastrados, ou crie
              o seu perfil.
            </p>
            <Link
              to="/profissionais"
              className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
            >
              Ver diretório <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  )
}