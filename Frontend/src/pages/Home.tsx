import { ArrowRight, Plus, Refrigerator, Search, Sparkles, X } from 'lucide-react'
import { motion, useScroll, useTransform } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CardRestaurante from '../components/CardRestaurante'
import Carrossel from '../components/Carrossel'
import { Reveal, SplitWords } from '../components/Motion'
import RecipeCard from '../components/RecipeCard'
import { Carregando, ErroApi, EstadoVazio } from '../components/Ui'
import { ENUMS } from '../data/enums'
import { qs } from '../lib/api'
import type { Ingrediente, Pagina, ReceitaResumo, RestauranteResumo } from '../lib/apiTipos'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'

export default function Home() {
  useSeo({ titulo: 'GastroMatch' })
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25])

  const [tipo, setTipo] = useState('')
  const [busca, setBusca] = useState('')
  const [selecionados, setSelecionados] = useState<number[]>([])
  const [procurou, setProcurou] = useState(false)

  const ingredientes = useApi<Ingrediente[]>('/ingredientes')
  const destaques = useApi<Pagina<ReceitaResumo>>(`/receitas${qs({ tipo, tamanho: 7 })}`)
  const restaurantes = useApi<Pagina<RestauranteResumo>>('/restaurantes?tamanho=10')
  // A API só devolve receitas feitas inteiramente com os ingredientes escolhidos.
  const daGeladeira = useApi<Pagina<ReceitaResumo>>(procurou && selecionados.length >= 2 ? `/receitas${qs({ ingredientes: selecionados, tamanho: 12 })}` : null)

  const catalogo = ingredientes.dados ?? []
  const nomes = useMemo(() => new Map(catalogo.map((i) => [i.id, i.nome])), [catalogo])
  const sugestoes = useMemo(
    () => catalogo.filter((i) => !selecionados.includes(i.id) && i.nome.toLowerCase().includes(busca.trim().toLowerCase())).slice(0, 14),
    [catalogo, selecionados, busca],
  )
  const toggle = (id: number) => { setProcurou(false); setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])) }

  return (
    <div className="space-y-16">
      <section ref={heroRef} className="grain relative -mx-4 -mt-6 overflow-hidden bg-cream sm:mx-0 sm:mt-0 sm:rounded-[2.25rem]">
        <motion.img src="/img/hero.jpg" alt="" style={{ y: imgY, scale: imgScale }} className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/55 to-cream/20" />
        <div className="glow absolute -left-32 top-10 h-[34rem] w-[34rem]" aria-hidden />
        <div className="relative flex min-h-[34rem] flex-col justify-end gap-8 px-6 pb-12 pt-32 sm:min-h-[40rem] sm:px-12 sm:pb-16">
          <h1 className="max-w-4xl font-display text-[clamp(2.75rem,9vw,7rem)] font-extrabold uppercase leading-[0.92] tracking-tight">
            <SplitWords text="Cozinhe o que" delay={0.5} />
            <br />
            <span className="text-terra"><SplitWords text="você já tem" delay={0.8} /></span>
          </h1>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 1.3, ease: [0.16, 1, 0.3, 1] }} className="flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-md text-base text-ink-soft">Receitas de chefs, nutricionistas e restaurantes. Escolha o que tem na geladeira e veja o que dá para fazer agora.</p>
            <div className="flex flex-wrap gap-3">
              <a href="#geladeira" className="btn-primary !px-7 !py-3.5"><Refrigerator size={18} /> Usar minha geladeira</a>
              <Link to="/receitas" className="btn-ghost !px-7 !py-3.5">Ver todas as receitas <ArrowRight size={16} /></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Reveal>
        <section id="geladeira" className="card scroll-mt-24 space-y-5 p-5 md:p-8" aria-labelledby="gel-t">
          <h2 id="gel-t" className="flex items-center gap-2 text-2xl font-bold"><Refrigerator size={22} className="text-terra" /> O que tenho em casa</h2>
          <p className="text-sm text-ink-soft">Escolha ao menos 2 ingredientes. Só aparecem receitas feitas inteiramente com o que você escolheu.</p>

          {selecionados.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Ingredientes escolhidos">
              {selecionados.map((id) => (
                <li key={id}><button className="chip border-terra bg-terra text-on-accent" onClick={() => toggle(id)} aria-label={`Remover ${nomes.get(id)}`}><X size={13} /> {nomes.get(id)}</button></li>
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
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input className="input !rounded-full !pl-10" placeholder="Buscar ingrediente" aria-label="Buscar ingrediente" value={busca} onChange={(e) => setBusca(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                {sugestoes.map((i) => <button key={i.id} onClick={() => toggle(i.id)} className="chip border-line bg-surface text-ink-soft hover:bg-peach"><Plus size={13} /> {i.nome}</button>)}
                {sugestoes.length === 0 && <p className="text-xs text-ink-faint">Nenhum ingrediente encontrado.</p>}
              </div>
            </>
          )}

          <button className="btn-primary" disabled={selecionados.length < 2} onClick={() => setProcurou(true)}><Sparkles size={16} /> Encontrar receitas</button>

          {procurou && (
            daGeladeira.erro ? <ErroApi erro={daGeladeira.erro} onTentar={daGeladeira.recarregar} />
            : !daGeladeira.dados ? <Carregando lento={daGeladeira.lento} texto="Procurando receitas" />
            : daGeladeira.dados.conteudo.length === 0 ? <p className="rounded-2xl bg-peach p-4 text-sm text-ink-soft">Nenhuma receita usa só esses ingredientes. Tente acrescentar mais.</p>
            : <div className="grid gap-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">{daGeladeira.dados.conteudo.map((r) => <RecipeCard key={r.id} receita={r} />)}</div>
          )}
        </section>
      </Reveal>

      <section id="receitas" className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">Receitas</h2>
          <Link to="/receitas" className="btn-ghost">Ver todas <ArrowRight size={16} /></Link>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar por refeição">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {[['', 'Todas'], ...Object.entries(ENUMS.tipo)].map(([k, v]) => (
              <button key={k} onClick={() => setTipo(k)} aria-pressed={tipo === k} className={`chip !px-5 !py-2.5 text-sm ${tipo === k ? 'border-terra bg-terra text-on-accent' : 'border-line bg-surface text-ink-soft hover:border-terra/50 hover:text-terra'}`}>{v}</button>
            ))}
          </div>
        </div>
        {destaques.erro ? <ErroApi erro={destaques.erro} onTentar={destaques.recarregar} />
          : !destaques.dados ? <Carregando lento={destaques.lento} texto="Carregando receitas" />
          : destaques.dados.conteudo.length === 0 ? <EstadoVazio titulo="Nenhuma receita nesta categoria" acao={{ to: '/receitas', rotulo: 'Ver todas as receitas' }} />
          : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {destaques.dados.conteudo.map((r, i) => (
                <Reveal key={r.id} delay={(i % 3) * 0.08} className={i === 0 && destaques.dados!.conteudo.length > 2 ? 'sm:col-span-2' : ''}>
                  <RecipeCard receita={r} featured={i === 0 && destaques.dados!.conteudo.length > 2} />
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
        {restaurantes.erro ? <ErroApi erro={restaurantes.erro} onTentar={restaurantes.recarregar} />
          : !restaurantes.dados ? <Carregando lento={restaurantes.lento} texto="Carregando restaurantes" />
          : restaurantes.dados.conteudo.length === 0 ? <EstadoVazio titulo="Ainda não há restaurantes cadastrados" texto="Cadastre o seu e ele aparece aqui." acao={{ to: '/onboarding', rotulo: 'Cadastrar restaurante' }} />
          : <Carrossel rotulo="Restaurantes cadastrados" itens={restaurantes.dados.conteudo.map((r) => <CardRestaurante key={r.id} restaurante={r} variante="carrossel" />)} />}
      </section>

      <Reveal>
        <section id="comunidade" className="grain relative overflow-hidden rounded-[2.25rem] bg-terra p-8 sm:p-14">
          <h2 className="max-w-3xl font-display text-[clamp(2.25rem,7vw,5.5rem)] font-extrabold uppercase leading-[0.95] tracking-tight text-on-accent">Quem cozinha por trás da receita</h2>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-sm text-sm font-semibold text-on-accent/80">Conheça chefs, nutricionistas e restaurantes cadastrados, ou crie o seu perfil.</p>
            <Link to="/profissionais" className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">Ver diretório <ArrowRight size={16} /></Link>
          </div>
        </section>
      </Reveal>
    </div>
  )
}
