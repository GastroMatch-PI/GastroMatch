import { AlertTriangle, ChevronDown, Lightbulb, Play, Printer, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/http'
import { buscarPapeisDoUsuario } from '../api/perfis'
import { buscarReceita, criarDicaEtapa, type DicaReceita, type ReceitaDetalhe } from '../api/receitadetalhe'
import { Aviso } from '../components/Campo'
import { useToast } from '../components/Feedback'
import Photo, { Avatar } from '../components/Photo'
import PlayerYT, { ytId } from '../components/PlayerYT'
import { EstadoVazio, Skeleton } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import { fmtNum } from '../lib/format'
import { useSeo } from '../lib/seo'

// confirmar: true se a nutrição devolvida é o total das N porções (a tela divide para mostrar por porção)
const NUTRICAO_E_TOTAL = true

const DIFICULDADE: Record<string, string> = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' }

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const unidade = (u: string) => ENUMS.unidade[u as keyof typeof ENUMS.unidade] ?? u.toLowerCase()
const rot = (m: Record<string, string>, k?: string) => (k ? m[k] : undefined)
const toggleArr = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

function StepTimer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((l) => (l <= 1 ? 0 : l - 1)), 1000)
    return () => clearInterval(id)
  }, [running])
  const done = left === 0
  return (
    <button
      className="btn-ghost !px-3 !py-1.5 text-xs"
      onClick={() => { if (done) setLeft(seconds); setRunning(!running || done) }}
    >
      {done ? 'Reiniciar timer' : running ? `Pausar ${clock(left)}` : `Iniciar timer ${clock(left)}`}
    </button>
  )
}

function BlocoDica({ d }: { d: DicaReceita }) {
  const [aberto, setAberto] = useState(false)
  const erro = d.tipo === 'ERRO_COMUM'
  const longo = d.texto.length > 160
  const Icon = erro ? AlertTriangle : Lightbulb
  return (
    <div className={`rounded-2xl border p-3 text-xs ${erro ? 'border-alert/40 bg-alert-soft' : 'border-gold/40 bg-gold-soft'}`}>
      <p className={`flex items-center gap-2 font-bold ${erro ? 'text-alert' : 'text-gold'}`}>
        <Icon size={15} /> {erro ? 'Erro comum' : 'Dica'}: <span className="text-ink">{d.titulo}</span>
      </p>
      <p className={`mt-1 text-ink-soft ${longo && !aberto ? 'line-clamp-2' : ''}`}>{d.texto}</p>
      {longo && <button className="mt-1 font-semibold text-terra" onClick={() => setAberto(!aberto)}>{aberto ? 'ver menos' : 'ver mais'}</button>}
      {d.autor && <p className="mt-1 text-[11px] text-ink-faint">Chef {d.autor}</p>}
    </div>
  )
}

function EsqueletoReceita() {
  return (
    <div className="space-y-6" aria-busy="true" role="status" aria-label="Carregando receita">
      <Skeleton className="h-4 w-48" />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-72" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

// A key força o estado da página a reiniciar quando o id da rota muda.
export default function Recipe() {
  const { id = '' } = useParams()
  return <PaginaReceita key={id} id={id} />
}

function PaginaReceita({ id }: { id: string }) {
  const toast = useToast()
  const { accessToken } = useAuth()

  const [receita, setReceita] = useState<ReceitaDetalhe | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [recarregando, setRecarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [naoEncontrada, setNaoEncontrada] = useState(false)
  const [recarga, setRecarga] = useState(0)
  const [porcoes, setPorcoes] = useState<number | null>(null) // null = porções padrão da receita
  const [isChef, setIsChef] = useState(false)

  const [checked, setChecked] = useState<number[]>([])
  const [doneSteps, setDoneSteps] = useState<number[]>([])
  const [guided, setGuided] = useState<number | null>(null)
  const [seek, setSeek] = useState<{ t: number; n: number } | undefined>()
  const [tempo, setTempo] = useState(0)
  const [comNutri, setComNutri] = useState(true)
  const [novaDica, setNovaDica] = useState<Record<number, { tipo: DicaReceita['tipo']; titulo: string; texto: string }>>({})
  const [enviandoDica, setEnviandoDica] = useState<number | null>(null)

  // Busca a receita; ao mudar as porções, espera 300 ms e pede de novo (o backend recalcula tudo).
  useEffect(() => {
    if (!/^\d+$/.test(id)) {
      setCarregando(false)
      setNaoEncontrada(true)
      return
    }
    let ativo = true
    setErro('')
    if (porcoes !== null) setRecarregando(true)
    const t = setTimeout(() => {
      buscarReceita(id, porcoes ?? undefined)
        .then((r) => {
          if (!ativo) return
          setReceita(r)
          setNaoEncontrada(false)
        })
        .catch((e) => {
          if (!ativo) return
          if (e instanceof ApiError && e.status === 404) setNaoEncontrada(true)
          else setErro((e as Error).message || 'Não foi possível carregar a receita.')
        })
        .finally(() => {
          if (!ativo) return
          setCarregando(false)
          setRecarregando(false)
        })
    }, porcoes === null ? 0 : 300)
    return () => {
      ativo = false
      clearTimeout(t)
    }
  }, [id, porcoes, recarga])

  // Só chefs veem o formulário de dica.
  useEffect(() => {
    if (!accessToken) {
      setIsChef(false)
      return
    }
    let ativo = true
    buscarPapeisDoUsuario(accessToken)
      .then((p) => { if (ativo) setIsChef(p.includes('CHEF')) })
      .catch(() => { if (ativo) setIsChef(false) })
    return () => { ativo = false }
  }, [accessToken])

  const steps = receita?.etapas ?? []
  const ingredientes = receita?.ingredientes ?? []
  const vid = ytId(receita?.videoUrl)
  const servings = porcoes ?? receita?.nPorcoes ?? 1

  // Nutrição vem do backend; só dividimos para exibir "por porção".
  const nutri = receita?.nutricao
    ? (() => {
        const d = NUTRICAO_E_TOTAL ? Math.max(1, receita.nPorcoes) : 1
        const n = receita.nutricao
        return { kcal: (n.kcal ?? 0) / d, prot: (n.proteinas ?? 0) / d, carb: (n.carboidratos ?? 0) / d, gord: (n.gorduras ?? 0) / d }
      })()
    : null

  useSeo(
    receita
      ? {
          titulo: receita.nome,
          descricao: receita.descricao ?? `Receita de ${receita.nome}${receita.chef ? `, por ${receita.chef.nome}` : ''}. ${receita.nPorcoes} porções.`,
          imagem: receita.imagem,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Recipe',
            name: receita.nome,
            description: receita.descricao ?? receita.nome,
            image: receita.imagem ? [receita.imagem] : undefined,
            author: receita.chef ? { '@type': 'Person', name: receita.chef.nome } : undefined,
            totalTime: receita.tempoPreparo ? `PT${receita.tempoPreparo}M` : undefined,
            recipeYield: `${receita.nPorcoes} porções`,
            recipeIngredient: ingredientes.map((i) => `${fmtNum(i.quantidade)} ${unidade(i.unidade)} ${i.nome}`),
            recipeInstructions: steps.map((s) => ({ '@type': 'HowToStep', name: s.titulo, text: s.texto })),
            nutrition: nutri ? { '@type': 'NutritionInformation', calories: `${Math.round(nutri.kcal)} kcal` } : undefined,
          },
        }
      : { titulo: carregando ? 'Carregando receita' : 'Receita não encontrada' },
  )

  if (carregando && !receita) return <EsqueletoReceita />

  if (naoEncontrada)
    return <EstadoVazio titulo="Receita não encontrada" texto="O link pode estar errado ou a receita foi removida." acao={{ to: '/receitas', rotulo: 'Ver todas as receitas' }} />

  if (!receita)
    return (
      <div className="space-y-4">
        <Aviso tipo="erro">{erro || 'Não foi possível carregar a receita.'}</Aviso>
        <button className="btn-primary" onClick={() => { setCarregando(true); setRecarga((x) => x + 1) }}>Tentar de novo</button>
      </div>
    )

  const compartilhar = async () => {
    const url = location.href
    try {
      if (navigator.share) await navigator.share({ title: receita.nome, text: `Veja esta receita: ${receita.nome}`, url })
      else { await navigator.clipboard.writeText(url); toast.sucesso('Link copiado.') }
    } catch {
      try { await navigator.clipboard.writeText(url); toast.sucesso('Link copiado.') } catch { toast.erro('Não foi possível compartilhar.') }
    }
  }

  const mudarPorcoes = (n: number) => setPorcoes(Math.min(50, Math.max(1, n)))

  const addDica = async (i: number, etapaId: number, e: React.FormEvent) => {
    e.preventDefault()
    const f = novaDica[i]
    if (!accessToken || !f?.titulo.trim() || !f?.texto.trim()) return
    setEnviandoDica(i)
    try {
      await criarDicaEtapa(accessToken, id, etapaId, { tipo: f.tipo, titulo: f.titulo.trim(), texto: f.texto.trim() })
      setNovaDica((n) => ({ ...n, [i]: { tipo: 'DICA', titulo: '', texto: '' } }))
      setRecarga((x) => x + 1)
      toast.sucesso('Dica adicionada.')
    } catch (x) {
      toast.erro((x as Error).message || 'Não foi possível adicionar a dica.')
    } finally {
      setEnviandoDica(null)
    }
  }

  if (guided !== null && steps[guided]) {
    const s = steps[guided]
    return (
      <div className="fixed inset-0 z-30 flex flex-col overflow-y-auto bg-black p-6 text-white">
        <div className="flex items-center justify-between text-sm">
          <span>Modo cozinhar • Passo {guided + 1} de {steps.length}</span>
          <button className="rounded-full bg-white/10 px-4 py-2" onClick={() => setGuided(null)}>Sair</button>
        </div>
        <div className="mx-auto flex max-w-3xl flex-1 flex-col justify-center gap-6 py-6">
          <h2 className="text-4xl font-extrabold">{s.titulo}</h2>
          <p className="text-xl leading-relaxed text-white/85">{s.texto}</p>
          {s.dicas.map((d, k) => <BlocoDica key={d.id ?? k} d={d} />)}
          {s.segundos ? <div><StepTimer key={guided} seconds={s.segundos} /></div> : null}
        </div>
        <div className="flex justify-between">
          <button className="btn-ghost" disabled={guided === 0} onClick={() => setGuided(guided - 1)}>← Anterior</button>
          {guided < steps.length - 1 ? <button className="btn-primary" onClick={() => setGuided(guided + 1)}>Próximo →</button> : <button className="btn-primary" onClick={() => setGuided(null)}>Finalizar</button>}
        </div>
      </div>
    )
  }

  const etapaAtiva = vid && steps.some((s) => s.videoAt !== undefined)
    ? steps.reduce((acc, s, i) => (s.videoAt !== undefined && tempo >= s.videoAt ? i : acc), -1)
    : -1

  const tags = [
    receita.tempoPreparo ? `${receita.tempoPreparo} min` : undefined,
    `${servings} porções`,
    rot(DIFICULDADE, receita.dificuldade),
    rot(ENUMS.tipo, receita.tipo),
    rot(ENUMS.metodo, receita.metodo),
    rot(ENUMS.ocasiao, receita.ocasiao),
    rot(ENUMS.perfil, receita.perfil),
  ].filter((t): t is string => Boolean(t))

  return (
    <div className={`space-y-8 ${comNutri ? '' : 'imprimir-sem-nutri'}`}>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <nav aria-label="Trilha" className="text-xs text-ink-faint print:hidden">
        <Link to="/receitas" className="hover:text-terra">Receitas</Link>
        {rot(ENUMS.tipo, receita.tipo) && <> › {rot(ENUMS.tipo, receita.tipo)}</>} › {receita.nome}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-2">
          {vid ? (
            <PlayerYT videoId={vid} titulo={receita.nome} seek={seek} onTempo={setTempo} />
          ) : (
            <Photo emoji="🍽️" seed={receita.id} className="aspect-video w-full rounded-2xl">
              {receita.imagem && <img src={receita.imagem} alt={receita.nome} className="absolute inset-0 h-full w-full object-cover" />}
            </Photo>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card space-y-3 p-5">
            <h1 className="text-2xl font-extrabold leading-tight">{receita.nome}</h1>
            {receita.descricao && <p className="text-sm text-ink-soft">{receita.descricao}</p>}
            <ul className="flex flex-wrap gap-2 text-xs font-medium">
              {tags.map((t) => (
                <li key={t} className="rounded-full border border-line px-3 py-1">{t}</li>
              ))}
            </ul>
            {receita.chef && (
              <div className="flex items-center gap-2 rounded-2xl bg-peach p-3 text-xs">
                <Avatar className="h-9 w-9" />
                <div className="flex-1"><b>{receita.chef.nome}</b></div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 print:hidden">
              {steps.length > 0 && <button className="btn-primary flex-1" onClick={() => setGuided(0)}>Modo cozinhar</button>}
              <button className="btn-ghost" onClick={compartilhar}><Share2 size={15} /> Compartilhar</button>
              <button className="btn-ghost" onClick={() => window.print()}><Printer size={15} /> Imprimir</button>
            </div>
            {nutri && (
              <label className="flex items-center gap-2 text-xs text-ink-soft print:hidden">
                <input type="checkbox" checked={comNutri} onChange={(e) => setComNutri(e.target.checked)} /> Incluir tabela nutricional na impressão
              </label>
            )}
          </div>
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="card space-y-3 p-5" aria-busy={recarregando}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-xl font-bold">Ingredientes</h2>
            <div className="flex items-center gap-2 rounded-full bg-peach px-3 py-1 text-xs print:hidden">
              Rendimento:
              <button aria-label="Menos porções" className="h-7 w-7 cursor-pointer rounded-full bg-surface font-bold" onClick={() => mudarPorcoes(servings - 1)}>−</button>
              <b className="text-terra">{servings}</b> porções
              <button aria-label="Mais porções" className="h-7 w-7 cursor-pointer rounded-full bg-surface font-bold" onClick={() => mudarPorcoes(servings + 1)}>+</button>
            </div>
          </div>
          {ingredientes.length === 0 && <p className="text-sm text-ink-soft">Esta receita ainda não tem ingredientes cadastrados.</p>}
          <ul className={`divide-y divide-line transition-opacity ${recarregando ? 'opacity-50' : ''}`}>
            {ingredientes.map((i, k) => (
              <li key={`${i.nome}-${k}`}>
                <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm">
                  <input type="checkbox" checked={checked.includes(k)} onChange={() => setChecked(toggleArr(checked, k))} />
                  <span className={`flex-1 ${checked.includes(k) ? 'text-ink-faint line-through' : ''}`}>{i.nome}</span>
                  <b className="text-xs">{fmtNum(i.quantidade)} {unidade(i.unidade)}</b>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="card nutri space-y-3 p-5">
          <h2 className="text-lg font-bold">Tabela nutricional</h2>
          {nutri ? (
            <>
              <p className="text-[11px] text-ink-faint">Estimativa por porção, calculada pelo servidor.</p>
              <p className="flex items-center justify-between rounded-2xl bg-peach px-3 py-2 text-sm">Valor energético <b className="font-display text-2xl text-terra">{Math.round(nutri.kcal)} <small className="text-xs">kcal</small></b></p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[['Carboidratos', nutri.carb], ['Proteínas', nutri.prot], ['Gorduras', nutri.gord]].map(([n, v]) => (
                  <div key={n as string} className="rounded-xl border border-line p-2"><p className="text-ink-soft">{n}</p><b>{fmtNum(v as number)} g</b></div>
                ))}
              </div>
            </>
          ) : <p className="text-xs text-ink-faint">Esta receita ainda não tem informação nutricional.</p>}
        </section>
      </div>

      {steps.length > 0 && (
        <section className="card space-y-4 p-5" aria-labelledby="passos-t">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="passos-t" className="text-2xl font-bold">Passo a passo</h2>
            <p className="text-xs text-leaf print:hidden">{doneSteps.length}/{steps.length} etapas concluídas</p>
          </div>
          <ol className="space-y-4">
            {steps.map((s, i) => {
              const f = novaDica[i] ?? { tipo: 'DICA' as DicaReceita['tipo'], titulo: '', texto: '' }
              return (
                <li key={s.id ?? i} className={`grid gap-4 rounded-2xl border bg-cream p-4 ${s.imagem ? 'md:grid-cols-[1fr_160px]' : ''} ${etapaAtiva === i ? 'border-terra' : 'border-line'} ${doneSteps.includes(i) ? 'opacity-60' : ''}`}>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terra text-sm font-bold text-on-accent">{i + 1}</span>
                      <h3 className="flex-1 text-base font-bold">{s.titulo}</h3>
                      <label className="flex items-center gap-1 text-[11px] text-ink-faint print:hidden"><input type="checkbox" checked={doneSteps.includes(i)} onChange={() => setDoneSteps(toggleArr(doneSteps, i))} /> Concluído</label>
                    </div>
                    <p className="text-sm text-ink-soft">{s.texto}</p>
                    <div className="flex flex-wrap gap-2 print:hidden">
                      {s.segundos ? <StepTimer seconds={s.segundos} /> : null}
                      {vid && s.videoAt !== undefined && (
                        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => { setSeek((p) => ({ t: s.videoAt as number, n: (p?.n ?? 0) + 1 })); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                          <Play size={13} /> Ver este passo no vídeo ({clock(s.videoAt)})
                        </button>
                      )}
                    </div>
                    {s.dicas.map((d, k) => <BlocoDica key={d.id ?? k} d={d} />)}
                    {isChef && s.id !== undefined && (
                      <details className="print:hidden">
                        <summary className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-terra"><ChevronDown size={14} /> Adicionar dica a esta etapa</summary>
                        <form onSubmit={(e) => addDica(i, s.id as number, e)} className="mt-2 space-y-2">
                          <select aria-label="Tipo" className="input" value={f.tipo} onChange={(e) => setNovaDica({ ...novaDica, [i]: { ...f, tipo: e.target.value as DicaReceita['tipo'] } })}><option value="DICA">Dica</option><option value="ERRO_COMUM">Erro comum</option></select>
                          <input aria-label="Título" className="input" placeholder="Título" maxLength={150} value={f.titulo} onChange={(e) => setNovaDica({ ...novaDica, [i]: { ...f, titulo: e.target.value } })} />
                          <textarea aria-label="Texto" className="input" rows={2} placeholder="Texto" value={f.texto} onChange={(e) => setNovaDica({ ...novaDica, [i]: { ...f, texto: e.target.value } })} />
                          <button className="btn-ghost w-full text-xs" disabled={enviandoDica === i}>{enviandoDica === i ? 'Enviando...' : 'Adicionar dica'}</button>
                        </form>
                      </details>
                    )}
                  </div>
                  {s.imagem && <img src={s.imagem} alt={`Etapa ${i + 1}: ${s.titulo}`} loading="lazy" width={160} height={112} className="h-28 w-full rounded-xl object-cover md:h-full" />}
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </div>
  )
}