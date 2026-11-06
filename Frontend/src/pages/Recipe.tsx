import { Check, Flag, Heart, Lightbulb, ShoppingBasket, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Photo, { Avatar } from '../components/Photo'
import Stars from '../components/Stars'
import { useAuth } from '../context/Auth'
import { catalogo, ENUMS } from '../data/enums'
import { useLocalState } from '../hooks/useLocalState'
import type { Comentario, Denuncia, Dica } from '../lib/tipos'
import { useFavoritos, useRecipes } from '../lib/useRecipes'

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const unidade = (u: string) => ENUMS.unidade[u as keyof typeof ENUMS.unidade] ?? u.toLowerCase()
const ytId = (u: string) => u.match(/(?:v=|embed\/|shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1]

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
    <div className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs">
      <span aria-hidden>⏰</span>
      Timer da etapa
      <button
        className="rounded bg-terra px-2 py-1 font-semibold text-white"
        onClick={() => {
          if (done) setLeft(seconds)
          setRunning(!running || done)
        }}
      >
        {done ? '↺ Reiniciar' : running ? `⏸ ${clock(left)}` : `▶ Iniciar ${clock(left)}`}
      </button>
    </div>
  )
}

export default function Recipe() {
  const { id = '' } = useParams()
  const todas = useRecipes()
  const r = todas.find((x) => x.id === id)
  const { usuario, meusPerfis } = useAuth()
  const { favs, toggle } = useFavoritos()

  const [servings, setServings] = useState(r?.servings ?? 1)
  const [checked, setChecked] = useState<string[]>([])
  const [doneSteps, setDoneSteps] = useState<number[]>([])
  const [listed, setListed] = useState(false)
  const [guided, setGuided] = useState<number | null>(null)
  const [stepVideo, setStepVideo] = useState(0)
  const [text, setText] = useState('')
  const [rating, setRating] = useState(0)
  const [aviso, setAviso] = useState('')
  const [denunciando, setDenunciando] = useState<number | null>(null)
  const [motivo, setMotivo] = useState('Conteúdo ofensivo')
  const [novaDica, setNovaDica] = useState({ tipo: 'DICA' as Dica['tipo'], titulo: '', texto: '' })

  const [allComments, setAllComments] = useLocalState<Record<string, Comentario[]>>('gm-comentarios', {})
  const [allDicas, setAllDicas] = useLocalState<Record<string, Dica[]>>('gm-dicas', {})
  const [, setShopping] = useLocalState<{ id: number; name: string; qty: string; done: boolean }[]>('gm-shopping', [])
  const [, setDenuncias] = useLocalState<Denuncia[]>('gm-denuncias', [])

  useEffect(() => {
    setServings(r?.servings ?? 1)
    setChecked([]); setDoneSteps([]); setListed(false); setGuided(null)
  }, [id, r?.servings])

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

  if (!r)
    return (
      <div className="card mx-auto max-w-md space-y-3 p-6 text-center">
        <h1 className="text-xl font-bold">Receita não encontrada</h1>
        <Link to="/" className="btn-primary">Voltar às receitas</Link>
      </div>
    )

  const detail = r.detail ?? { ing: [], steps: [] }
  const steps = detail.steps
  const factor = servings / r.servings
  const comments = allComments[r.id] ?? []
  const dicas = allDicas[r.id] ?? []
  const toggleArr = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const media = comments.filter((c) => c.nota > 0)
  const nota = media.length ? media.reduce((a, c) => a + c.nota, 0) / media.length : 0
  const isChef = meusPerfis.some((p) => p.papel === 'CHEF')
  const vid = r.video ? ytId(r.video) : undefined

  const publicar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario || !text.trim()) return
    const c: Comentario = { id: Date.now(), autor: usuario.username, texto: text.trim(), nota: rating, quando: new Date().toLocaleDateString('pt-BR') }
    setAllComments((m) => ({ ...m, [r.id]: [c, ...(m[r.id] ?? [])] }))
    setText(''); setRating(0)
  }

  const denunciar = (cid: number) => {
    if (!usuario) return
    setDenuncias((l) => [...l, { id: Date.now(), receita: r.title, comentario: cid, motivo, autor: usuario.username, quando: new Date().toLocaleDateString('pt-BR'), resolvida: false }])
    setDenunciando(null)
    setAviso('Denúncia enviada para análise manual.')
  }

  const addDica = (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario || !novaDica.titulo.trim() || !novaDica.texto.trim()) return
    const d: Dica = { id: Date.now(), ...novaDica, autor: usuario.username }
    setAllDicas((m) => ({ ...m, [r.id]: [...(m[r.id] ?? []), d] }))
    setNovaDica({ tipo: 'DICA', titulo: '', texto: '' })
  }

  if (guided !== null && steps[guided]) {
    const s = steps[guided]
    return (
      <div className="fixed inset-0 z-30 flex flex-col bg-ink p-6 text-white">
        <div className="flex items-center justify-between text-sm">
          <span>Modo Cozinhar Guiado • Passo {guided + 1} de {steps.length}</span>
          <button className="rounded bg-white/10 px-3 py-1.5" onClick={() => setGuided(null)}>Sair</button>
        </div>
        <div className="mx-auto flex max-w-3xl flex-1 flex-col justify-center gap-6">
          <h2 className="text-4xl font-extrabold">{s.title}</h2>
          <p className="text-xl leading-relaxed text-white/85">{s.text}</p>
          {s.seconds ? <div className="text-ink"><StepTimer key={guided} seconds={s.seconds} /></div> : null}
        </div>
        <div className="flex justify-between">
          <button className="btn-ghost" disabled={guided === 0} onClick={() => setGuided(guided - 1)}>← Anterior</button>
          {guided < steps.length - 1 ? (
            <button className="btn-primary" onClick={() => setGuided(guided + 1)}>Próximo →</button>
          ) : (
            <button className="btn-primary" onClick={() => setGuided(null)}>Finalizar</button>
          )}
        </div>
      </div>
    )
  }

  const startAt = steps[stepVideo]?.videoAt ?? 0

  return (
    <div className="space-y-8">
      <nav className="text-xs text-ink-faint">
        <Link to="/" className="hover:text-terra">Receitas</Link> › {r.collections[0]} › {r.title}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          {vid ? (
            <iframe
              key={`${vid}-${startAt}`}
              className="aspect-video w-full rounded-2xl"
              src={`https://www.youtube-nocookie.com/embed/${vid}?start=${startAt}`}
              title={r.title}
              allowFullScreen
            />
          ) : (
            <Photo emoji={r.emoji} seed={r.seed} className="aspect-video w-full rounded-2xl">
              {r.image && <img src={r.image} alt="" className="absolute inset-0 h-full w-full rounded-2xl object-cover" />}
            </Photo>
          )}
          {vid && steps.some((s) => s.videoAt !== undefined) && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {steps.map((s, i) => s.videoAt !== undefined && (
                <button key={i} onClick={() => setStepVideo(i)} className={`rounded-full border px-3 py-1 ${stepVideo === i ? 'border-terra bg-peach text-terra' : 'border-line bg-white'}`}>
                  {clock(s.videoAt)} · Etapa {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card space-y-3 p-5">
            <h1 className="text-2xl font-extrabold leading-tight">{r.title}</h1>
            {r.description && <p className="text-sm text-ink-soft">{r.description}</p>}
            <p className="flex flex-wrap items-center gap-2 text-xs">
              {media.length > 0 ? (<><Stars value={Math.round(nota)} /> <b>{fmt(nota)}</b> <span>({media.length} avaliações)</span></>) : <span className="text-ink-faint">Sem avaliações ainda</span>}
              <span>• ⏱ {r.minutes} min • {r.difficulty}</span>
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-peach p-3 text-xs">
              <Avatar className="h-9 w-9" />
              <div className="flex-1"><b>{r.author}</b></div>
              <button className="btn-ghost !px-3 !py-1 text-xs" onClick={() => (usuario ? toggle(r.id) : setAviso('Entre na sua conta para favoritar.'))}>
                <Heart size={14} className={favs.includes(r.id) ? 'fill-terra text-terra' : ''} /> {favs.includes(r.id) ? 'Favorita' : 'Favoritar'}
              </button>
            </div>
            {aviso && <p className="text-xs text-terra">{aviso}</p>}
            {steps.length > 0 && (
              <button className="btn-primary w-full" onClick={() => setGuided(0)}>Iniciar Modo Cozinhar Guiado →</button>
            )}
          </div>
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="card space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-xl font-bold">Ingredientes</h2>
            <div className="flex items-center gap-2 rounded-lg bg-peach px-2 py-1 text-xs">
              Rendimento:
              <button aria-label="Menos porções" className="h-6 w-6 rounded bg-white font-bold" onClick={() => setServings(Math.max(1, servings - 1))}>−</button>
              <b className="text-terra">{servings}</b> porções
              <button aria-label="Mais porções" className="h-6 w-6 rounded bg-white font-bold" onClick={() => setServings(Math.min(50, servings + 1))}>+</button>
            </div>
          </div>
          <ul className="divide-y divide-line">
            {detail.ing.map((i) => (
              <li key={i.name}>
                <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm">
                  <input type="checkbox" checked={checked.includes(i.name)} onChange={() => setChecked(toggleArr(checked, i.name))} />
                  <span className={`flex-1 ${checked.includes(i.name) ? 'text-ink-faint line-through' : ''}`}>{i.name}</span>
                  <b className="text-xs">{fmt(i.qty * factor)} {unidade(i.unit)}</b>
                </label>
              </li>
            ))}
          </ul>
          <button
            className="w-full rounded-lg bg-leaf-soft py-2.5 text-xs font-semibold text-leaf"
            onClick={() => {
              setShopping((s) => [...s, ...detail.ing.filter((i) => !s.some((x) => x.name === i.name)).map((i, k) => ({ id: Date.now() + k, name: i.name, qty: `${fmt(i.qty * factor)} ${unidade(i.unit)}`, done: false }))])
              setListed(true)
            }}
          >
            {listed ? <><Check size={15} /> Adicionados à lista</> : <><ShoppingBasket size={15} /> Adicionar à lista de compras</>}
          </button>
        </section>

        <div className="space-y-4">
          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-bold">Tabela Nutricional</h2>
            {nutri ? (
              <>
                <p className="text-[11px] text-ink-faint">Estimativa por porção, com base no catálogo local de ingredientes.</p>
                <p className="flex items-center justify-between rounded-lg bg-peach px-3 py-2 text-sm">
                  Valor Energético <b className="font-display text-2xl text-terra">{Math.round(nutri.kcal)} <small className="text-xs">kcal</small></b>
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[['Carboidratos', nutri.carb], ['Proteínas', nutri.prot], ['Gorduras', nutri.gord]].map(([n, v]) => (
                    <div key={n as string} className="rounded-lg border border-line p-2">
                      <p className="text-ink-soft">{n}</p><b>{fmt(v as number)} g</b>
                    </div>
                  ))}
                </div>
                {nutri.fora > 0 && (
                  <p className="rounded-lg bg-gold-soft p-2 text-[11px] text-gold">
                    Cálculo parcial: {nutri.fora} {nutri.fora === 1 ? 'item não entrou' : 'itens não entraram'} na conta (sem unidade g/ml ou sem dados).
                  </p>
                )}
              </>
            ) : <p className="text-xs text-ink-faint">Sem dados de ingredientes.</p>}
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Lightbulb size={18} className="text-gold" /> Dicas e erros comuns</h2>
            {dicas.length === 0 && <p className="text-xs text-ink-faint">Nenhuma dica ainda.</p>}
            {dicas.map((d) => (
              <div key={d.id} className={`rounded-lg border-l-4 p-3 text-xs ${d.tipo === 'ERRO_COMUM' ? 'border-alert bg-alert-soft' : 'border-gold bg-gold-soft'}`}>
                <p className="font-bold">{d.titulo} <span className="font-normal text-ink-faint">— {d.autor}</span></p>
                <p>{d.texto}</p>
              </div>
            ))}
            {isChef && (
              <form onSubmit={addDica} className="space-y-2 border-t border-line pt-3">
                <select className="input" value={novaDica.tipo} onChange={(e) => setNovaDica({ ...novaDica, tipo: e.target.value as Dica['tipo'] })}>
                  <option value="DICA">Dica</option><option value="ERRO_COMUM">Erro comum</option>
                </select>
                <input className="input" placeholder="Título" maxLength={150} value={novaDica.titulo} onChange={(e) => setNovaDica({ ...novaDica, titulo: e.target.value })} />
                <textarea className="input" rows={2} placeholder="Texto" value={novaDica.texto} onChange={(e) => setNovaDica({ ...novaDica, texto: e.target.value })} />
                <button className="btn-ghost w-full text-xs">Adicionar dica</button>
              </form>
            )}
          </section>
        </div>
      </div>

      {steps.length > 0 && (
        <section className="card space-y-4 p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-2xl font-bold">Passo a Passo</h2>
            <p className="text-xs text-leaf">{doneSteps.length}/{steps.length} etapas concluídas</p>
          </div>
          {steps.map((s, i) => (
            <article key={i} className={`grid gap-4 rounded-xl border border-line bg-cream p-4 ${s.image ? 'md:grid-cols-[1fr_160px]' : ''} ${doneSteps.includes(i) ? 'opacity-60' : ''}`}>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terra text-sm font-bold text-white">{i + 1}</span>
                  <h3 className="flex-1 text-base font-bold">{s.title}</h3>
                  <label className="flex items-center gap-1 text-[11px] text-ink-faint">
                    <input type="checkbox" checked={doneSteps.includes(i)} onChange={() => setDoneSteps(toggleArr(doneSteps, i))} /> Concluído
                  </label>
                </div>
                <p className="text-sm text-ink-soft">{s.text}</p>
                {s.seconds ? <StepTimer seconds={s.seconds} /> : null}
              </div>
              {s.image && <img src={s.image} alt="" className="h-28 w-full rounded-lg object-cover md:h-full" />}
            </article>
          ))}
        </section>
      )}

      <section className="card space-y-4 p-5">
        <h2 className="text-2xl font-bold">Comentários e Avaliações</h2>
        {usuario ? (
          <form className="space-y-2" onSubmit={publicar}>
            <textarea id="novo-comentario" className="input h-20" maxLength={2000} placeholder="Você fez essa receita? Conte como ficou..." value={text} onChange={(e) => setText(e.target.value)} />
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                Sua nota:
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" aria-label={`${n} estrelas`} onClick={() => setRating(n)} className="cursor-pointer"><Star size={18} className={n <= rating ? 'fill-gold text-gold' : 'text-line'} /></button>
                ))}
              </span>
              <button className="btn-ghost !py-1.5 text-xs">Publicar</button>
            </div>
          </form>
        ) : (
          <p className="rounded-lg bg-peach p-3 text-xs">
            <Link to="/login" className="font-semibold text-terra">Entre</Link> para comentar e avaliar.
          </p>
        )}
        {comments.length === 0 && <p className="text-sm text-ink-faint">Seja o primeiro a comentar.</p>}
        {comments.map((c) => (
          <article key={c.id} className="rounded-xl border border-line bg-cream p-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9" />
              <div className="flex-1 text-xs"><b className="text-sm">{c.autor}</b><p className="text-ink-faint">{c.quando}</p></div>
              {c.nota > 0 && <Stars value={c.nota} className="text-xs" />}
            </div>
            <p className="mt-2 text-ink-soft">{c.texto}</p>
            {usuario && (
              <div className="mt-2 text-[11px] text-ink-faint">
                {denunciando === c.id ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <select className="input !w-auto !py-1 text-xs" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                      <option>Conteúdo ofensivo</option><option>Spam</option><option>Informação falsa</option><option>Outro</option>
                    </select>
                    <button className="font-semibold text-alert" onClick={() => denunciar(c.id)}>Enviar</button>
                    <button onClick={() => setDenunciando(null)}>Cancelar</button>
                  </span>
                ) : (
                  <button className="hover:text-alert" onClick={() => setDenunciando(c.id)}><Flag size={12} className="mr-1 inline" /> Denunciar</button>
                )}
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
