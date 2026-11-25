import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Refrigerator,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CardRestaurante from '../components/CardRestaurante'
import Carrossel from '../components/Carrossel'
import { Reveal } from '../components/Motion'
import RecipeCard from '../components/RecipeCard'
import { Carregando, ErroApi, EstadoVazio } from '../components/Ui'
import { ENUMS } from '../data/enums'
import { qs } from '../lib/api'
import type {
  Ingrediente,
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

  const [tipo, setTipo] = useState('')
  const [busca, setBusca] = useState('')
  const [selecionados, setSelecionados] = useState<number[]>([])
  const [procurou, setProcurou] = useState(false)
  const [imagemAtual, setImagemAtual] = useState(0)

  const ingredientes = useApi<Ingrediente[]>('/ingredientes')
  const destaques = useApi<Pagina<ReceitaResumo>>(
    `/receitas${qs({ tipo, tamanho: 7 })}`,
  )
  const restaurantes = useApi<Pagina<RestauranteResumo>>(
    '/restaurantes?tamanho=10',
  )

  const daGeladeira = useApi<Pagina<ReceitaResumo>>(
    procurou && selecionados.length >= 2
      ? `/receitas${qs({ ingredientes: selecionados, tamanho: 12 })}`
      : null,
  )

  const catalogo = ingredientes.dados ?? []

  const nomes = useMemo(
    () => new Map(catalogo.map((ingrediente) => [ingrediente.id, ingrediente.nome])),
    [catalogo],
  )

  const sugestoes = useMemo(
    () =>
      catalogo
        .filter(
          (ingrediente) =>
            !selecionados.includes(ingrediente.id) &&
            ingrediente.nome.toLowerCase().includes(busca.trim().toLowerCase()),
        )
        .slice(0, 14),
    [catalogo, selecionados, busca],
  )

  const alternarIngrediente = (id: number) => {
    setProcurou(false)
    setSelecionados((atuais) =>
      atuais.includes(id)
        ? atuais.filter((ingredienteId) => ingredienteId !== id)
        : [...atuais, id],
    )
  }

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
            {/* <p className="max-w-md text-base text-ink-soft">
              Receitas de chefs, nutricionistas e restaurantes. Escolha o que tem
              na geladeira e veja o que dá para fazer agora.
            </p> */}

            <div className="flex flex-wrap gap-3">
              <a href="#geladeira" className="btn-primary !px-7 !py-3.5">
                <Refrigerator size={18} />
                Usar minha geladeira
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

      <Reveal>
        <section
          id="geladeira"
          className="card scroll-mt-24 space-y-5 p-5 md:p-8"
          aria-labelledby="gel-t"
        >
          <h2
            id="gel-t"
            className="flex items-center gap-2 text-2xl font-bold"
          >
            <Refrigerator size={22} className="text-terra" />
            O que tenho em casa
          </h2>

          <p className="text-sm text-ink-soft">
            Escolha ao menos 2 ingredientes. Só aparecem receitas feitas
            inteiramente com o que você escolheu.
          </p>

          {selecionados.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Ingredientes escolhidos">
              {selecionados.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    className="chip border-terra bg-terra text-on-accent"
                    onClick={() => alternarIngrediente(id)}
                    aria-label={`Remover ${nomes.get(id) ?? 'ingrediente'}`}
                  >
                    <X size={13} />
                    {nomes.get(id)}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {ingredientes.erro ? (
            <ErroApi erro={ingredientes.erro} onTentar={ingredientes.recarregar} />
          ) : ingredientes.carregando ? (
            <Carregando lento={ingredientes.lento} texto="Carregando ingredientes" />
          ) : (
            <>
              <div className="relative max-w-sm">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  className="input !rounded-full !pl-10"
                  placeholder="Buscar ingrediente"
                  aria-label="Buscar ingrediente"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {sugestoes.map((ingrediente) => (
                  <button
                    key={ingrediente.id}
                    type="button"
                    onClick={() => alternarIngrediente(ingrediente.id)}
                    className="chip border-line bg-surface text-ink-soft hover:bg-peach"
                  >
                    <Plus size={13} />
                    {ingrediente.nome}
                  </button>
                ))}

                {sugestoes.length === 0 && (
                  <p className="text-xs text-ink-faint">
                    Nenhum ingrediente encontrado.
                  </p>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            className="btn-primary"
            disabled={selecionados.length < 2}
            onClick={() => setProcurou(true)}
          >
            <Sparkles size={16} />
            Encontrar receitas
          </button>

          {procurou && (
            daGeladeira.erro ? (
              <ErroApi erro={daGeladeira.erro} onTentar={daGeladeira.recarregar} />
            ) : !daGeladeira.dados ? (
              <Carregando lento={daGeladeira.lento} texto="Procurando receitas" />
            ) : daGeladeira.dados.conteudo.length === 0 ? (
              <p className="rounded-2xl bg-peach p-4 text-sm text-ink-soft">
                Nenhuma receita usa só esses ingredientes. Tente acrescentar mais.
              </p>
            ) : (
              <div className="grid gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
                {daGeladeira.dados.conteudo.map((receita) => (
                  <RecipeCard key={receita.id} receita={receita} />
                ))}
              </div>
            )
          )}
        </section>
      </Reveal>

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

        <div
          className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
          role="group"
          aria-label="Filtrar por refeição"
        >
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {[['', 'Todas'], ...Object.entries(ENUMS.tipo)].map(([chave, nome]) => (
              <button
                key={chave}
                type="button"
                onClick={() => setTipo(chave)}
                aria-pressed={tipo === chave}
                className={`chip !px-5 !py-2.5 text-sm ${
                  tipo === chave
                    ? 'border-terra bg-terra text-on-accent'
                    : 'border-line bg-surface text-ink-soft hover:border-terra/50 hover:text-terra'
                }`}
              >
                {nome}
              </button>
            ))}
          </div>
        </div>

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
              const destaque =
                indice === 0 && destaques.dados!.conteudo.length > 2

              return (
                <Reveal
                  key={receita.id}
                  delay={(indice % 3) * 0.08}
                  className={destaque ? 'sm:col-span-2' : ''}
                >
                  <RecipeCard receita={receita} featured={destaque} />
                </Reveal>
              )
            })}
          </div>
        )}
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
