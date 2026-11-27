import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CardRestaurante from '../components/CardRestaurante'
import Carrossel from '../components/Carrossel'
import { Reveal } from '../components/Motion'
import RecipeCard from '../components/RecipeCard'
import { Carregando, ErroApi, EstadoVazio } from '../components/Ui'
import { ENUMS } from '../data/enums'
import { qs } from '../lib/api'
import type {
  Pagina,
  ReceitaResumo,
  RestauranteResumo,
} from '../lib/apiTipos'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'

const imagensHero = [
  {
    categoria: 'Churrasco',
    src: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1800&q=85',
    alt: 'Carnes e acompanhamentos preparados na churrasqueira',
  },
  {
    categoria: 'Frutos do mar',
    src: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=1800&q=85',
    alt: 'Prato de frutos do mar',
  },
  {
    categoria: 'Culinária mexicana',
    src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1800&q=85',
    alt: 'Comida mexicana servida com ingredientes variados',
  },
  {
    categoria: 'Doces e confeitaria',
    src: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1800&q=85',
    alt: 'Bolo decorado de confeitaria',
  },
  {
    categoria: 'Massas',
    src: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1800&q=85',
    alt: 'Prato de massa preparado com molho e ervas',
  },
  {
    categoria: 'Culinária vegetariana',
    src: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1800&q=85',
    alt: 'Salada colorida com vegetais frescos',
  },
]

export default function Home() {
  useSeo({ titulo: 'GastroMatch' })

  const [filtros, setFiltros] = useState({ tipo: '', metodo: '', ocasiao: '', perfil: '', dificuldade: '', tempoMax: '' })
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 1023px)').matches)
  const [imagemAtual, setImagemAtual] = useState(0)

  const destaques = useApi<Pagina<ReceitaResumo>>('/receitas' + qs({ ...filtros, tamanho: 7 }))
  const restaurantes = useApi<Pagina<RestauranteResumo>>(
    '/restaurantes?tamanho=10',
  )

  const atualizarFiltro = (campo: keyof typeof filtros, valor: string) =>
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }))
  const limparFiltros = () =>
    setFiltros({ tipo: '', metodo: '', ocasiao: '', perfil: '', dificuldade: '', tempoMax: '' })
  const filtrosAtivos = Object.values(filtros).filter(Boolean).length

  const irParaImagem = (direcao: number) => {
    setImagemAtual(
      (atual) => (atual + direcao + imagensHero.length) % imagensHero.length,
    )
  }

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setImagemAtual((atual) => (atual + 1) % imagensHero.length)
    }, 2000)

    return () => window.clearInterval(intervalo)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)')
    const atualizar = () => {
      setMobile(media.matches)
      if (!media.matches) setFiltrosAbertos(false)
    }
    media.addEventListener('change', atualizar)
    return () => media.removeEventListener('change', atualizar)
  }, [])

  useEffect(() => {
    if (!mobile || !filtrosAbertos) return
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflowAnterior }
  }, [mobile, filtrosAbertos])

  const painelFiltros = (
    <>
      <div className="flex items-center justify-between lg:hidden">
        <h2 className="text-lg font-bold">Filtros</h2>
        <button type="button" aria-label="Fechar filtros" className="flex h-10 w-10 items-center justify-center rounded-full border border-line" onClick={() => setFiltrosAbertos(false)}><X size={18} /></button>
      </div>
      <h2 className="hidden text-lg font-bold lg:block">Filtros</h2>
      {[
        { campo: 'tipo', rotulo: 'Refeição', opcoes: ENUMS.tipo },
        { campo: 'metodo', rotulo: 'Método de preparo', opcoes: ENUMS.metodo },
        { campo: 'ocasiao', rotulo: 'Ocasião', opcoes: ENUMS.ocasiao },
        { campo: 'perfil', rotulo: 'Perfil alimentar', opcoes: ENUMS.perfil },
        { campo: 'dificuldade', rotulo: 'Dificuldade', opcoes: ENUMS.dificuldade },
        { campo: 'tempoMax', rotulo: 'Tempo de preparo', opcoes: { '20': 'Até 20 min', '30': 'Até 30 min', '60': 'Até 60 min' } },
      ].map((f) => (
        <label key={f.campo} className="block text-xs font-semibold text-ink-soft">
          {f.rotulo}
          <select className="input mt-1" value={filtros[f.campo as keyof typeof filtros]} onChange={(e) => atualizarFiltro(f.campo as keyof typeof filtros, e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(f.opcoes).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
        </label>
      ))}
      <button type="button" className="btn-ghost w-full" onClick={limparFiltros}>Limpar filtros</button>
      <button type="button" className="btn-primary w-full lg:hidden" onClick={() => setFiltrosAbertos(false)}>Ver {destaques.dados?.totalElementos ?? 0} resultados</button>
    </>
  )

  return (
    <div className="space-y-16">
      <section className="grain relative -mx-4 -mt-6 overflow-hidden bg-cream sm:mx-0 sm:mt-0 sm:rounded-[2.25rem]">
        <motion.img
          key={imagensHero[imagemAtual].src}
          src={imagensHero[imagemAtual].src}
          alt={imagensHero[imagemAtual].alt}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1.1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div
          className="absolute inset-0 bg-gradient-to-t from-cream via-cream/55 to-cream/20"
          aria-hidden="true"
        />

        <div
          className="glow absolute -left-32 top-10 h-[34rem] w-[34rem]"
          aria-hidden="true"
        />

        <div className="absolute right-5 top-5 z-10 flex items-center gap-2 sm:right-8 sm:top-8">
          <span className="rounded-full bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
            {imagensHero[imagemAtual].categoria}
          </span>

          <button
            type="button"
            onClick={() => irParaImagem(-1)}
            aria-label="Imagem anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft transition hover:bg-white"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => irParaImagem(1)}
            aria-label="Próxima imagem"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft transition hover:bg-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="relative flex min-h-[34rem] flex-col justify-end gap-8 px-6 pb-12 pt-32 sm:min-h-[40rem] sm:px-12 sm:pb-16">
          {/* <h1 className="max-w-4xl font-display text-[clamp(2.75rem,9vw,7rem)] font-extrabold uppercase leading-[0.92] tracking-tight">
            <SplitWords text="Cozinhe o que" delay={0.5} />
            <br />
            <span className="text-terra">
              <SplitWords text="você já tem" delay={0.8} />
            </span>
          </h1> */}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-wrap items-end justify-between gap-6"
          >
            <div className="flex flex-wrap gap-3">
              <a href="#receitas" className="btn-primary !px-7 !py-3.5">
                Explorar receitas
              </a>

              <Link to="/receitas" className="btn-ghost !px-7 !py-3.5">
                Ver todas as receitas
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          <div
            className="absolute bottom-5 left-6 z-10 flex gap-1.5 sm:bottom-6 sm:left-12"
            aria-label="Selecionar imagem do banner"
          >
            {imagensHero.map((imagem, indice) => (
              <button
                key={imagem.categoria}
                type="button"
                onClick={() => setImagemAtual(indice)}
                aria-label={`Mostrar imagem: ${imagem.categoria}`}
                aria-current={imagemAtual === indice ? 'true' : undefined}
                className={`h-2 rounded-full transition-all ${
                  imagemAtual === indice
                    ? 'w-7 bg-terra'
                    : 'w-2 bg-ink/35 hover:bg-ink/60'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="receitas" className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">
            Receitas
          </h2>
          <Link to="/receitas" className="btn-ghost">
            Ver todas
            <ArrowRight size={16} />
          </Link>
        </div>

        <button
          type="button"
          className="btn-ghost lg:hidden"
          aria-expanded={filtrosAbertos}
          aria-controls="filtros-home"
          onClick={() => setFiltrosAbertos(true)}
        >
          <Filter size={15} /> Filtros{filtrosAtivos ? ` (${filtrosAtivos})` : ''}
        </button>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {mobile && filtrosAbertos && (
            <button
              type="button"
              aria-label="Fechar filtros"
              className="fixed inset-0 z-40 bg-black/70"
              onClick={() => setFiltrosAbertos(false)}
            />
          )}
          <aside
            id="filtros-home"
            aria-label="Filtros de receitas"
            role={mobile ? 'dialog' : undefined}
            aria-modal={mobile && filtrosAbertos ? true : undefined}
            inert={mobile && !filtrosAbertos}
            className={`space-y-4 ${
              mobile
                ? `fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm overflow-y-auto border-r border-line bg-surface p-5 transition-transform duration-500 ${filtrosAbertos ? 'translate-x-0' : '-translate-x-full'}`
                : 'card self-start p-5'
            }`}
          >
            {painelFiltros}
          </aside>
          <div className="min-w-0 space-y-8">

        {destaques.erro ? (
          <ErroApi erro={destaques.erro} onTentar={destaques.recarregar} />
        ) : !destaques.dados ? (
          <Carregando lento={destaques.lento} texto="Carregando receitas" />
        ) : destaques.dados.conteudo.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma receita nesta categoria"
            acao={{ to: '/receitas', rotulo: 'Ver todas as receitas' }}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.dados.conteudo.map((receita, indice) => {
              const destaque = indice === 0 && destaques.dados!.conteudo.length > 2
              return (
                <Reveal key={receita.id} delay={(indice % 3) * 0.08} className={destaque ? 'sm:col-span-2' : ''}>
                  <RecipeCard receita={receita} featured={destaque} />
                </Reveal>
              )
            })}
          </div>
        )}
          </div>
        </div>
      </section>

      <section id="restaurantes" className="space-y-5" aria-labelledby="rest-t">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2
            id="rest-t"
            className="font-display text-4xl font-extrabold uppercase leading-none tracking-tight sm:text-6xl"
          >
            Restaurantes
          </h2>
          <Link to="/restaurantes" className="btn-ghost">
            Ver todos
            <ArrowRight size={16} />
          </Link>
        </div>

        {restaurantes.erro ? (
          <ErroApi erro={restaurantes.erro} onTentar={restaurantes.recarregar} />
        ) : !restaurantes.dados ? (
          <Carregando lento={restaurantes.lento} texto="Carregando restaurantes" />
        ) : restaurantes.dados.conteudo.length === 0 ? (
          <EstadoVazio
            titulo="Ainda não há restaurantes cadastrados"
            texto="Cadastre o seu e ele aparece aqui."
            acao={{ to: '/onboarding', rotulo: 'Cadastrar restaurante' }}
          />
        ) : (
          <Carrossel
            rotulo="Restaurantes cadastrados"
            itens={restaurantes.dados.conteudo.map((restaurante) => (
              <CardRestaurante
                key={restaurante.id}
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
    className="relative isolate overflow-hidden rounded-[2.25rem] bg-terra p-8 sm:p-14"
  >
    <img
src={`${import.meta.env.BASE_URL}images/gastromatch-comunidade.jpg`}  alt=""
  aria-hidden="true"
  className="absolute inset-0 z-0 h-full w-full object-cover object-center"
/>
    <div
      className="absolute inset-0 z-10 bg-black/40"
      aria-hidden="true"
    />

    <h2 className="relative z-20 max-w-3xl font-display text-[clamp(2.25rem,7vw,5.5rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-white">
      Quem cozinha por trás da receita
    </h2>

    <div className="relative z-20 mt-8 flex flex-wrap items-center justify-between gap-4">
      <p className="max-w-sm text-sm font-semibold text-white">
        Conheça chefs, nutricionistas e restaurantes cadastrados, ou crie o seu
        perfil.
      </p>

      <Link
        to="/profissionais"
        className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
      >
        Ver diretório
        <ArrowRight size={16} />
      </Link>
    </div>
  </section>
</Reveal>
    </div>
  )
}
