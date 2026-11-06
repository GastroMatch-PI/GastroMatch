import { AlertTriangle, ChevronDown, Heart, Lightbulb, Pencil, Play, Printer, Share2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Comentarios from '../components/Comentarios'
import { useToast } from '../components/Feedback'
import Photo, { Avatar } from '../components/Photo'
import PlayerYT, { ytId } from '../components/PlayerYT'
import Stars from '../components/Stars'
import { EstadoVazio } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { catalogo, ENUMS } from '../data/enums'
import { useLocalState } from '../hooks/useLocalState'
import { fmtNum } from '../lib/format'
import { useSeo } from '../lib/seo'
import type { Dica } from '../lib/tipos'
import { useFavoritos, useNotas, useRecipes } from '../lib/useRecipes'

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const unidade = (u: string) => ENUMS.unidade[u as keyof typeof ENUMS.unidade] ?? u.toLowerCase()
const rot = (m: Record<string, string>, k?: string) => (k ? m[k] : undefined)

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

function BlocoDica({ d }: { d: Dica }) {
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
      <p className="mt-1 text-[11px] text-ink-faint">Chef {d.autor}</p>
    </div>
  )
}

export default function Recipe() {
  const { id = '' } = useParams()
  const loc = useLocation()
  const nav = useNavigate()
  const toast = useToast()
  const todas = useRecipes()
  const r = todas.find((x) => x.id === id)
  const { usuario, meusPerfis } = useAuth()
  const { favs, toggle, contar } = useFavoritos()
  const notaDe = useNotas()

  const [servings, setServings] = useState(r?.servings ?? 1)
  const [checked, setChecked] = useState<string[]>([])
  const [doneSteps, setDoneSteps] = useState<number[]>([])
  const [guided, setGuided] = useState<number | null>(null)
  const [seek, setSeek] = useState<{ t: number; n: number } | undefined>()
  const [tempo, setTempo] = useState(0)
  const [comNutri, setComNutri] = useState(true)
  const [novaDica, setNovaDica] = useState<Record<number, { tipo: Dica['tipo']; titulo: string; texto: string }>>({})
  const [allDicas, setAllDicas] = useLocalState<Record<string, Dica[]>>('gm-dicas', {})

  useEffect(() => {
    setServings(r?.servings ?? 1)
    setChecked([]); setDoneSteps([]); setGuided(null); setSeek(undefined)
  }, [id, r?.servings])

  const detail = r?.detail ?? { ing: [], steps: [] }
  const steps = detail.steps
  const vid = ytId(r?.video)
  const { media, total } = notaDe(id)

  const nutri = useMemo(() => {
    if (!r?.detail) return null
    const tot = { kcal: 0, prot: 0, carb: 0, gord: 0 }
    let fora = 0
    for (const i of r.detail.ing) {
      const c = catalogo.find((x) => x.id === i.cat)
      if (!c || (i.unit !== 'G' && i.unit !== 'ML')) { fora++; continue }
      const f = i.qty / 100
      tot.kcal += c.kcal * f; tot.prot += c.prot * f; tot.carb += c.carb * f; tot.gord += c.gord * f
    }
    const p = r.servings || 1
    return { kcal: tot.kcal / p, prot: tot.prot / p, carb: tot.carb / p, gord: tot.gord / p, fora }
  }, [r])

  useSeo(
    r
      ? {
          titulo: r.title,
          descricao: r.description ?? `Receita de ${r.title}, por ${r.author}. ${r.minutes} min, ${r.servings} porções.`,
          imagem: r.image,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Recipe',
            name: r.title,
            description: r.description ?? r.title,
            image: r.image ? [r.image] : undefined,
            author: { '@type': 'Person', name: r.author },
            totalTime: `PT${r.minutes}M`,
            recipeYield: `${r.servings} porções`,
            recipeIngredient: detail.ing.map((i) => `${fmtNum(i.qty)} ${unidade(i.unit)} ${i.name}`),
            recipeInstructions: steps.map((s) => ({ '@type': 'HowToStep', name: s.title, text: s.text })),
            nutrition: nutri ? { '@type': 'NutritionInformation', calories: `${Math.round(nutri.kcal)} kcal` } : undefined,
            aggregateRating: total ? { '@type': 'AggregateRating', ratingValue: fmtNum(media), ratingCount: total } : undefined,
          },
        }
      : { titulo: 'Receita não encontrada' },
  )

  if (!r)
    return <EstadoVazio titulo="Receita não encontrada" texto="O link pode estar errado ou a receita foi removida." acao={{ to: '/receitas', rotulo: 'Ver todas as receitas' }} />

  const factor = servings / r.servings
  const dicas = allDicas[r.id] ?? []
  const isChef = meusPerfis.some((p) => p.papel === 'CHEF')
  const dono = !!usuario && r.owner === usuario.id
  const toggleArr = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const salvo = favs.includes(r.id)

  const favoritar = () => {
    if (!usuario) return nav('/login', { state: { from: loc.pathname } })
    toggle(r.id)
    toast.sucesso(salvo ? 'Removida dos favoritos.' : 'Adicionada aos favoritos.')
  }

  const compartilhar = async () => {
    const url = location.href
    try {
      if (navigator.share) await navigator.share({ title: r.title, text: `Veja esta receita: ${r.title}`, url })
      else { await navigator.clipboard.writeText(url); toast.sucesso('Link copiado.') }
    } catch {
      try { await navigator.clipboard.writeText(url); toast.sucesso('Link copiado.') } catch { toast.erro('Não foi possível compartilhar.') }
    }
  }

  const addDica = (etapa: number, e: React.FormEvent) => {
    e.preventDefault()
    const f = novaDica[etapa]
    if (!usuario || !f?.titulo?.trim() || !f?.texto?.trim()) return
    const d: Dica = { id: Date.now(), etapa, tipo: f.tipo, titulo: f.titulo.trim(), texto: f.texto.trim(), autor: usuario.username, autorId: usuario.id }
    setAllDicas((m) => ({ ...m, [r.id]: [...(m[r.id] ?? []), d] }))
    setNovaDica((n) => ({ ...n, [etapa]: { tipo: 'DICA', titulo: '', texto: '' } }))
    toast.sucesso('Dica adicionada.')
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
          <h2 className="text-4xl font-extrabold">{s.title}</h2>
          <p className="text-xl leading-relaxed text-white/85">{s.text}</p>
          {dicas.filter((d) => d.etapa === guided).map((d) => <BlocoDica key={d.id} d={d} />)}
          {s.seconds ? <div><StepTimer key={guided} seconds={s.seconds} /></div> : null}
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

  return (
    <div className={`space-y-8 ${comNutri ? '' : 'imprimir-sem-nutri'}`}>
      <nav aria-label="Trilha" className="text-xs text-ink-faint print:hidden">
        <Link to="/receitas" className="hover:text-terra">Receitas</Link> › {r.collections[0]} › {r.title}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-2">
          {vid ? (
            <PlayerYT videoId={vid} titulo={r.title} seek={seek} onTempo={setTempo} />
          ) : (
            <Photo emoji={r.emoji} seed={r.seed} className="aspect-video w-full rounded-2xl">
              {r.image && <img src={r.image} alt={r.title} className="absolute inset-0 h-full w-full object-cover" />}
            </Photo>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card space-y-3 p-5">
            <h1 className="text-2xl font-extrabold leading-tight">{r.title}</h1>
            {r.description && <p className="text-sm text-ink-soft">{r.description}</p>}
            <p className="flex flex-wrap items-center gap-2 text-xs">
              {total > 0 ? <><Stars value={Math.round(media)} /> <b>{fmtNum(media)}</b> <span>({total})</span></> : <span className="text-ink-faint">Sem avaliações ainda</span>}
              <span>• {contar(r.id)} {contar(r.id) === 1 ? 'favorito' : 'favoritos'}</span>
            </p>
            <ul className="flex flex-wrap gap-2 text-xs font-medium">
              {[`${r.minutes} min`, `${r.servings} porções`, r.difficulty, rot(ENUMS.tipo, r.tipo), rot(ENUMS.metodo, r.metodo), rot(ENUMS.ocasiao, r.ocasiao), rot(ENUMS.perfil, r.perfil)].filter(Boolean).map((t) => (
                <li key={t} className="rounded-full border border-line px-3 py-1">{t}</li>
              ))}
            </ul>
            <div className="flex items-center gap-2 rounded-2xl bg-peach p-3 text-xs">
              <Avatar className="h-9 w-9" />
              <div className="flex-1"><b>{r.author}</b></div>
              <button className="btn-ghost !px-3 !py-1.5 text-xs" aria-pressed={salvo} onClick={favoritar}>
                <Heart size={14} className={salvo ? 'fill-terra text-terra' : ''} /> {salvo ? 'Favorita' : 'Favoritar'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              {steps.length > 0 && <button className="btn-primary flex-1" onClick={() => setGuided(0)}>Modo cozinhar</button>}
              <button className="btn-ghost" onClick={compartilhar}><Share2 size={15} /> Compartilhar</button>
              <button className="btn-ghost" onClick={() => window.print()}><Printer size={15} /> Imprimir</button>
              {dono && <Link to={`/receita/${r.id}/editar`} className="btn-ghost"><Pencil size={15} /> Editar</Link>}
            </div>
            <label className="flex items-center gap-2 text-xs text-ink-soft print:hidden">
              <input type="checkbox" checked={comNutri} onChange={(e) => setComNutri(e.target.checked)} /> Incluir tabela nutricional na impressão
            </label>
          </div>
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="card space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-xl font-bold">Ingredientes</h2>
            <div className="flex items-center gap-2 rounded-full bg-peach px-3 py-1 text-xs print:hidden">
              Rendimento:
              <button aria-label="Menos porções" className="h-7 w-7 cursor-pointer rounded-full bg-surface font-bold" onClick={() => setServings(Math.max(1, servings - 1))}>−</button>
              <b className="text-terra">{servings}</b> porções
              <button aria-label="Mais porções" className="h-7 w-7 cursor-pointer rounded-full bg-surface font-bold" onClick={() => setServings(Math.min(50, servings + 1))}>+</button>
            </div>
          </div>
          <ul className="divide-y divide-line">
            {detail.ing.map((i) => (
              <li key={i.name}>
                <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm">
                  <input type="checkbox" checked={checked.includes(i.name)} onChange={() => setChecked(toggleArr(checked, i.name))} />
                  <span className={`flex-1 ${checked.includes(i.name) ? 'text-ink-faint line-through' : ''}`}>{i.name}</span>
                  <b className="text-xs">{fmtNum(i.qty * factor)} {unidade(i.unit)}</b>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="card nutri space-y-3 p-5">
          <h2 className="text-lg font-bold">Tabela nutricional</h2>
          {nutri ? (
            <>
              <p className="text-[11px] text-ink-faint">Estimativa por porção, com base no catálogo local de ingredientes.</p>
              <p className="flex items-center justify-between rounded-2xl bg-peach px-3 py-2 text-sm">Valor energético <b className="font-display text-2xl text-terra">{Math.round(nutri.kcal)} <small className="text-xs">kcal</small></b></p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[['Carboidratos', nutri.carb], ['Proteínas', nutri.prot], ['Gorduras', nutri.gord]].map(([n, v]) => (
                  <div key={n as string} className="rounded-xl border border-line p-2"><p className="text-ink-soft">{n}</p><b>{fmtNum(v as number)} g</b></div>
                ))}
              </div>
              {nutri.fora > 0 && <p className="rounded-xl bg-gold-soft p-2 text-[11px] text-gold">Cálculo parcial: {nutri.fora} {nutri.fora === 1 ? 'item não entrou' : 'itens não entraram'} na conta.</p>}
            </>
          ) : <p className="text-xs text-ink-faint">Sem dados de ingredientes.</p>}
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
              const dd = dicas.filter((d) => d.etapa === i)
              const f = novaDica[i] ?? { tipo: 'DICA' as Dica['tipo'], titulo: '', texto: '' }
              return (
                <li key={i} className={`grid gap-4 rounded-2xl border bg-cream p-4 ${s.image ? 'md:grid-cols-[1fr_160px]' : ''} ${etapaAtiva === i ? 'border-terra' : 'border-line'} ${doneSteps.includes(i) ? 'opacity-60' : ''}`}>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terra text-sm font-bold text-on-accent">{i + 1}</span>
                      <h3 className="flex-1 text-base font-bold">{s.title}</h3>
                      <label className="flex items-center gap-1 text-[11px] text-ink-faint print:hidden"><input type="checkbox" checked={doneSteps.includes(i)} onChange={() => setDoneSteps(toggleArr(doneSteps, i))} /> Concluído</label>
                    </div>
                    <p className="text-sm text-ink-soft">{s.text}</p>
                    <div className="flex flex-wrap gap-2 print:hidden">
                      {s.seconds ? <StepTimer seconds={s.seconds} /> : null}
                      {vid && s.videoAt !== undefined && (
                        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => { setSeek((p) => ({ t: s.videoAt!, n: (p?.n ?? 0) + 1 })); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                          <Play size={13} /> Ver este passo no vídeo ({clock(s.videoAt)})
                        </button>
                      )}
                    </div>
                    {dd.map((d) => <BlocoDica key={d.id} d={d} />)}
                    {isChef && (
                      <details className="print:hidden">
                        <summary className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-terra"><ChevronDown size={14} /> Adicionar dica a esta etapa</summary>
                        <form onSubmit={(e) => addDica(i, e)} className="mt-2 space-y-2">
                          <select aria-label="Tipo" className="input" value={f.tipo} onChange={(e) => setNovaDica({ ...novaDica, [i]: { ...f, tipo: e.target.value as Dica['tipo'] } })}><option value="DICA">Dica</option><option value="ERRO_COMUM">Erro comum</option></select>
                          <input aria-label="Título" className="input" placeholder="Título" maxLength={150} value={f.titulo} onChange={(e) => setNovaDica({ ...novaDica, [i]: { ...f, titulo: e.target.value } })} />
                          <textarea aria-label="Texto" className="input" rows={2} placeholder="Texto" value={f.texto} onChange={(e) => setNovaDica({ ...novaDica, [i]: { ...f, texto: e.target.value } })} />
                          <button className="btn-ghost w-full text-xs">Adicionar dica</button>
                        </form>
                      </details>
                    )}
                  </div>
                  {s.image && <img src={s.image} alt={`Etapa ${i + 1}: ${s.title}`} loading="lazy" width={160} height={112} className="h-28 w-full rounded-xl object-cover md:h-full" />}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <div className="print:hidden"><Comentarios receitaId={r.id} titulo={r.title} /></div>
    </div>
  )
}
