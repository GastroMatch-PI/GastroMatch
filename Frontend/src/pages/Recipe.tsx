import { AlertTriangle, ChevronDown, Heart, Lightbulb, Pencil, Play, Printer, Share2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Comentarios from '../components/Comentarios'
import { useConfirmar, useToast } from '../components/Feedback'
import Photo, { Avatar } from '../components/Photo'
import PlayerYT, { ytId } from '../components/PlayerYT'
import { Carregando, ErroApi } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import { del, mensagem, post, urlImagem } from '../lib/api'
import type { Dica, ReceitaDetalhe, TipoDica } from '../lib/apiTipos'
import { fmtNum } from '../lib/format'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const unidade = (u: string) => ENUMS.unidade[u as keyof typeof ENUMS.unidade] ?? u.toLowerCase()
const rot = (m: Record<string, string>, k?: string | null) => (k ? m[k] : undefined)

function BlocoDica({ d, onExcluir }: { d: Dica; onExcluir?: () => void }) {
  const [aberto, setAberto] = useState(false)
  const erro = d.tipo === 'ERRO_COMUM'
  const longo = d.conteudo.length > 160
  const Icon = erro ? AlertTriangle : Lightbulb
  return (
    <div className={`rounded-2xl border p-3 text-xs ${erro ? 'border-alert/40 bg-alert-soft' : 'border-gold/40 bg-gold-soft'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`flex items-center gap-2 font-bold ${erro ? 'text-alert' : 'text-gold'}`}><Icon size={15} /> {erro ? 'Erro comum' : 'Dica do chef'}</p>
        {onExcluir && <button aria-label="Excluir dica" className="cursor-pointer text-ink-faint hover:text-alert print:hidden" onClick={onExcluir}><Trash2 size={14} /></button>}
      </div>
      <p className={`mt-1 whitespace-pre-wrap text-ink-soft ${longo && !aberto ? 'line-clamp-2' : ''}`}>{d.conteudo}</p>
      {longo && <button className="mt-1 font-semibold text-terra" onClick={() => setAberto(!aberto)}>{aberto ? 'ver menos' : 'ver mais'}</button>}
    </div>
  )
}

export default function Recipe() {
  const { id = '' } = useParams()
  const idNum = Number(id)
  const loc = useLocation()
  const nav = useNavigate()
  const toast = useToast()
  const confirmar = useConfirmar()
  const { usuario, perfil, favoritos, alternarFavorito } = useAuth()

  const [porcoes, setPorcoes] = useState<number | null>(null) // null = porções da receita
  const [porcoesDebounce, setPorcoesDebounce] = useState<number | null>(null)
  useEffect(() => { setPorcoes(null); setPorcoesDebounce(null) }, [id])
  useEffect(() => { const t = setTimeout(() => setPorcoesDebounce(porcoes), 350); return () => clearTimeout(t) }, [porcoes])

  const caminho = Number.isInteger(idNum) && idNum > 0 ? `/receitas/${idNum}${porcoesDebounce ? `?porcoes=${porcoesDebounce}` : ''}` : null
  const { dados, carregando, erro, lento, recarregar, setDados } = useApi<ReceitaDetalhe>(caminho)
  const r = dados && dados.id === idNum ? dados : null

  const [checked, setChecked] = useState<string[]>([])
  const [doneSteps, setDoneSteps] = useState<number[]>([])
  const [guided, setGuided] = useState<number | null>(null)
  const [seek, setSeek] = useState<{ t: number; n: number } | undefined>()
  const [tempo, setTempo] = useState(0)
  const [comNutri, setComNutri] = useState(true)
  const [novaDica, setNovaDica] = useState<Record<number, { tipo: TipoDica; conteudo: string }>>({})
  useEffect(() => { setChecked([]); setDoneSteps([]); setGuided(null); setSeek(undefined) }, [id])

  const vid = ytId(r?.videoUrl ?? undefined)
  const dono = !!r && perfil?.papel === 'CHEF' && perfil.dados.id === r.chef.id
  const salvo = favoritos.has(idNum)

  useSeo(
    r
      ? {
          titulo: r.nome,
          descricao: r.descricao ?? `Receita de ${r.nome}, por Chef ${r.chef.username}. ${r.tempoPreparo} min, ${r.nPorcoes} porções.`,
          imagem: urlImagem(r.imagem),
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Recipe',
            name: r.nome,
            description: r.descricao ?? r.nome,
            image: r.imagem ? [urlImagem(r.imagem)] : undefined,
            author: { '@type': 'Person', name: r.chef.username },
            totalTime: `PT${r.tempoPreparo}M`,
            recipeYield: `${r.nPorcoes} porções`,
            recipeIngredient: r.ingredientes.map((i) => `${fmtNum(i.quantidade)} ${unidade(i.unidadeMedida)} ${i.nome}`),
            recipeInstructions: r.etapas.map((s) => ({ '@type': 'HowToStep', name: s.titulo, text: s.instrucao })),
            nutrition: { '@type': 'NutritionInformation', calories: `${Math.round(r.nutricao.porPorcao.calorias)} kcal` },
          },
        }
      : { titulo: erro?.status === 404 ? 'Receita não encontrada' : 'Receita' },
  )

  if (!caminho) return <ErroApi erro={{ message: 'Receita inválida.', status: 404 }} />
  if (!r && erro) return <ErroApi erro={erro} onTentar={recarregar} />
  if (!r) return <Carregando lento={lento} texto="Carregando a receita" />

  const toggleArr = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const n = porcoes ?? r.porcoes

  const favoritar = async () => {
    if (!usuario) return nav('/login', { state: { from: loc.pathname } })
    try {
      await alternarFavorito(idNum)
      toast.sucesso(salvo ? 'Removida dos favoritos.' : 'Adicionada aos favoritos.')
    } catch (e) {
      toast.erro(mensagem(e))
    }
  }

  const compartilhar = async () => {
    const url = location.href
    try {
      if (navigator.share) await navigator.share({ title: r.nome, text: `Veja esta receita: ${r.nome}`, url })
      else { await navigator.clipboard.writeText(url); toast.sucesso('Link copiado.') }
    } catch {
      try { await navigator.clipboard.writeText(url); toast.sucesso('Link copiado.') } catch { toast.erro('Não foi possível compartilhar.') }
    }
  }

  const excluirReceita = async () => {
    if (!(await confirmar({ titulo: 'Excluir esta receita?', texto: 'Ela e suas etapas saem do site. Essa ação não pode ser desfeita.', confirmar: 'Excluir', perigo: true }))) return
    try { await del(`/receitas/${r.id}`); toast.sucesso('Receita excluída.'); nav('/receitas') } catch (e) { toast.erro(mensagem(e)) }
  }

  const addDica = async (idEtapa: number, e: React.FormEvent) => {
    e.preventDefault()
    const f = novaDica[idEtapa] ?? { tipo: 'DICA' as TipoDica, conteudo: '' }
    if (!f.conteudo.trim()) return
    try {
      const d = await post<Dica>(`/receitas/${r.id}/etapas/${idEtapa}/dicas`, { tipo: f.tipo, conteudo: f.conteudo.trim() })
      setDados({ ...r, etapas: r.etapas.map((s) => (s.id === idEtapa ? { ...s, dicas: [...s.dicas, d] } : s)) })
      setNovaDica((m) => ({ ...m, [idEtapa]: { tipo: 'DICA', conteudo: '' } }))
      toast.sucesso('Dica adicionada.')
    } catch (er) { toast.erro(mensagem(er)) }
  }

  const excluirDica = async (idEtapa: number, idDica: number) => {
    try {
      await del(`/receitas/${r.id}/etapas/${idEtapa}/dicas/${idDica}`)
      setDados({ ...r, etapas: r.etapas.map((s) => (s.id === idEtapa ? { ...s, dicas: s.dicas.filter((d) => d.id !== idDica) } : s)) })
    } catch (er) { toast.erro(mensagem(er)) }
  }

  if (guided !== null && r.etapas[guided]) {
    const s = r.etapas[guided]
    return (
      <div className="fixed inset-0 z-30 flex flex-col overflow-y-auto bg-black p-6 text-white">
        <div className="flex items-center justify-between text-sm">
          <span>Modo cozinhar • Passo {guided + 1} de {r.etapas.length}</span>
          <button className="rounded-full bg-white/10 px-4 py-2" onClick={() => setGuided(null)}>Sair</button>
        </div>
        <div className="mx-auto flex max-w-3xl flex-1 flex-col justify-center gap-6 py-6">
          <h2 className="text-4xl font-extrabold">{s.titulo}</h2>
          <p className="text-xl leading-relaxed text-white/85">{s.instrucao}</p>
          {s.dicas.map((d) => <BlocoDica key={d.id} d={d} />)}
        </div>
        <div className="flex justify-between">
          <button className="btn-ghost" disabled={guided === 0} onClick={() => setGuided(guided - 1)}>← Anterior</button>
          {guided < r.etapas.length - 1 ? <button className="btn-primary" onClick={() => setGuided(guided + 1)}>Próximo →</button> : <button className="btn-primary" onClick={() => setGuided(null)}>Finalizar</button>}
        </div>
      </div>
    )
  }

  const etapaAtiva = vid && r.etapas.some((s) => s.timestampVideo != null)
    ? r.etapas.reduce((acc, s, i) => (s.timestampVideo != null && tempo >= s.timestampVideo ? i : acc), -1)
    : -1
  const np = r.nutricao.porPorcao

  return (
    <div className={`space-y-8 ${comNutri ? '' : 'imprimir-sem-nutri'}`}>
      <nav aria-label="Trilha" className="text-xs text-ink-faint print:hidden">
        <Link to="/receitas" className="hover:text-terra">Receitas</Link> › {r.nome}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-2">
          {vid ? (
            <PlayerYT videoId={vid} titulo={r.nome} seek={seek} onTempo={setTempo} />
          ) : (
            <Photo emoji="🍽️" seed={r.id} className="aspect-video w-full rounded-2xl">
              {r.imagem && <img src={urlImagem(r.imagem)} alt={r.nome} className="absolute inset-0 h-full w-full object-cover" />}
            </Photo>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card space-y-3 p-5">
            <h1 className="text-2xl font-extrabold leading-tight">{r.nome}</h1>
            {r.descricao && <p className="text-sm text-ink-soft">{r.descricao}</p>}
            <ul className="flex flex-wrap gap-2 text-xs font-medium">
              {[`${r.tempoPreparo} min`, `${r.nPorcoes} porções`, ENUMS.dificuldade[r.dificuldade], rot(ENUMS.tipo, r.tipo), rot(ENUMS.metodo, r.metodoPreparo), rot(ENUMS.ocasiao, r.ocasiao), rot(ENUMS.perfil, r.perfil)].filter(Boolean).map((t) => (
                <li key={t} className="rounded-full border border-line px-3 py-1">{t}</li>
              ))}
            </ul>
            <div className="flex items-center gap-2 rounded-2xl bg-peach p-3 text-xs">
              <Avatar className="h-9 w-9" />
              <div className="flex-1"><Link to={`/chef/${r.chef.id}`} className="font-bold hover:text-terra">Chef {r.chef.username}</Link></div>
              <button className="btn-ghost !px-3 !py-1.5 text-xs" aria-pressed={salvo} onClick={favoritar}>
                <Heart size={14} className={salvo ? 'fill-terra text-terra' : ''} /> {salvo ? 'Favorita' : 'Favoritar'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              {r.etapas.length > 0 && <button className="btn-primary flex-1" onClick={() => setGuided(0)}>Modo cozinhar</button>}
              <button className="btn-ghost" onClick={compartilhar}><Share2 size={15} /> Compartilhar</button>
              <button className="btn-ghost" onClick={() => window.print()}><Printer size={15} /> Imprimir</button>
              {dono && <Link to={`/receita/${r.id}/editar`} className="btn-ghost"><Pencil size={15} /> Editar</Link>}
              {dono && <button className="btn-ghost text-alert" onClick={excluirReceita}><Trash2 size={15} /> Excluir</button>}
            </div>
            <label className="flex items-center gap-2 text-xs text-ink-soft print:hidden">
              <input type="checkbox" checked={comNutri} onChange={(e) => setComNutri(e.target.checked)} /> Incluir tabela nutricional na impressão
            </label>
          </div>
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="card space-y-3 p-5" aria-busy={carregando}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-xl font-bold">Ingredientes</h2>
            <div className="flex items-center gap-2 rounded-full bg-peach px-3 py-1 text-xs print:hidden">
              Rendimento:
              <button aria-label="Menos porções" className="h-7 w-7 cursor-pointer rounded-full bg-surface font-bold" onClick={() => setPorcoes(Math.max(1, n - 1))}>−</button>
              <b className="text-terra">{n}</b> porções
              <button aria-label="Mais porções" className="h-7 w-7 cursor-pointer rounded-full bg-surface font-bold" onClick={() => setPorcoes(Math.min(100, n + 1))}>+</button>
            </div>
          </div>
          <ul className={`divide-y divide-line transition-opacity ${carregando ? 'opacity-60' : ''}`}>
            {r.ingredientes.map((i) => (
              <li key={i.idIngrediente}>
                <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm">
                  <input type="checkbox" checked={checked.includes(i.nome)} onChange={() => setChecked(toggleArr(checked, i.nome))} />
                  <span className={`flex-1 ${checked.includes(i.nome) ? 'text-ink-faint line-through' : ''}`}>{i.nome}</span>
                  <b className="text-xs">{fmtNum(i.quantidade)} {unidade(i.unidadeMedida)}</b>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="card nutri space-y-3 p-5">
          <h2 className="text-lg font-bold">Tabela nutricional</h2>
          <p className="text-[11px] text-ink-faint">Por porção, calculada pela API para {r.porcoes} {r.porcoes === 1 ? 'porção' : 'porções'}.</p>
          <p className="flex items-center justify-between rounded-2xl bg-peach px-3 py-2 text-sm">Valor energético <b className="font-display text-2xl text-terra">{Math.round(np.calorias)} <small className="text-xs">kcal</small></b></p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[['Carboidratos', np.carboidrato], ['Proteínas', np.proteina], ['Gorduras', np.gordura]].map(([t, v]) => (
              <div key={t as string} className="rounded-xl border border-line p-2"><p className="text-ink-soft">{t}</p><b>{fmtNum(v as number)} g</b></div>
            ))}
          </div>
          {!r.nutricao.completa && (
            <p className="rounded-xl bg-gold-soft p-2 text-[11px] text-gold">
              Valor aproximado: {r.nutricao.naoCalculados.length === 1 ? 'este item não entrou' : 'estes itens não entraram'} na conta ({r.nutricao.naoCalculados.join(', ')}). Só ingredientes em g e ml são somados.
            </p>
          )}
        </section>
      </div>

      {r.etapas.length > 0 && (
        <section className="card space-y-4 p-5" aria-labelledby="passos-t">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="passos-t" className="text-2xl font-bold">Passo a passo</h2>
            <p className="text-xs text-leaf print:hidden">{doneSteps.length}/{r.etapas.length} etapas concluídas</p>
          </div>
          <ol className="space-y-4">
            {r.etapas.map((s, i) => {
              const f = novaDica[s.id] ?? { tipo: 'DICA' as TipoDica, conteudo: '' }
              return (
                <li key={s.id} className={`grid gap-4 rounded-2xl border bg-cream p-4 ${s.imagem ? 'md:grid-cols-[1fr_160px]' : ''} ${etapaAtiva === i ? 'border-terra' : 'border-line'} ${doneSteps.includes(i) ? 'opacity-60' : ''}`}>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terra text-sm font-bold text-on-accent">{s.ordem}</span>
                      <h3 className="flex-1 text-base font-bold">{s.titulo}</h3>
                      <label className="flex items-center gap-1 text-[11px] text-ink-faint print:hidden"><input type="checkbox" checked={doneSteps.includes(i)} onChange={() => setDoneSteps(toggleArr(doneSteps, i))} /> Concluído</label>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-ink-soft">{s.instrucao}</p>
                    {vid && s.timestampVideo != null && (
                      <button className="btn-ghost !px-3 !py-1.5 text-xs print:hidden" onClick={() => { setSeek((p) => ({ t: s.timestampVideo!, n: (p?.n ?? 0) + 1 })); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                        <Play size={13} /> Ver este passo no vídeo ({clock(s.timestampVideo)})
                      </button>
                    )}
                    {s.dicas.map((d) => <BlocoDica key={d.id} d={d} onExcluir={dono ? () => excluirDica(s.id, d.id) : undefined} />)}
                    {dono && (
                      <details className="print:hidden">
                        <summary className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-terra"><ChevronDown size={14} /> Adicionar dica a esta etapa</summary>
                        <form onSubmit={(e) => addDica(s.id, e)} className="mt-2 space-y-2">
                          <select aria-label="Tipo" className="input" value={f.tipo} onChange={(e) => setNovaDica({ ...novaDica, [s.id]: { ...f, tipo: e.target.value as TipoDica } })}><option value="DICA">Dica</option><option value="ERRO_COMUM">Erro comum</option></select>
                          <textarea aria-label="Conteúdo" className="input" rows={2} maxLength={1000} placeholder="Conteúdo" value={f.conteudo} onChange={(e) => setNovaDica({ ...novaDica, [s.id]: { ...f, conteudo: e.target.value } })} />
                          <button className="btn-ghost w-full text-xs">Adicionar dica</button>
                        </form>
                      </details>
                    )}
                  </div>
                  {s.imagem && <img src={urlImagem(s.imagem)} alt={`Etapa ${s.ordem}: ${s.titulo}`} loading="lazy" width={160} height={112} className="h-28 w-full rounded-xl object-cover md:h-full" />}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <div className="print:hidden"><Comentarios receitaId={r.id} /></div>
    </div>
  )
}
