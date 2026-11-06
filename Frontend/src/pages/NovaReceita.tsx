import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Campo, Opcoes } from '../components/Campo'
import { useConfirmar, useToast } from '../components/Feedback'
import { EstadoVazio, UploadImagem } from '../components/Ui'
import { useAuth } from '../context/Auth'
import type { Recipe } from '../data/data'
import { catalogo, ENUMS } from '../data/enums'
import { useLocalState } from '../hooks/useLocalState'
import { fmtNum } from '../lib/format'
import { useSeo } from '../lib/seo'
import type { Dica } from '../lib/tipos'
import { useRecipes } from '../lib/useRecipes'
import { numero, obrigatorio, tamanho, url, youtube, type Regra } from '../lib/validar'

type Item = { cat: string; qty: string; unit: string }
type Et = { title: string; text: string; videoAt: string; image: string; seconds: string; dicas: { tipo: Dica['tipo']; titulo: string; texto: string }[] }
type Geral = { nome: string; desc: string; img: string; video: string; n: string; min: string; dif: string; tipo: string; metodo: string; ocasiao: string; perfil: string }
type Rascunho = { geral: Geral; itens: Item[]; etapas: Et[]; passo: number }

const DESTINO_LOGIN = { from: '/publicar' }
const ETAPAS = ['Dados gerais', 'Ingredientes', 'Modo de preparo', 'Dicas e revisão']
const novaEtapa = (): Et => ({ title: '', text: '', videoAt: '', image: '', seconds: '', dicas: [] })
const geralVazio = (): Geral => ({ nome: '', desc: '', img: '', video: '', n: '4', min: '30', dif: 'FACIL', tipo: 'ALMOCO', metodo: '', ocasiao: '', perfil: '' })
const vazio = (): Rascunho => ({ geral: geralVazio(), itens: [{ cat: '', qty: '', unit: 'G' }], etapas: [novaEtapa()], passo: 0 })

const regrasGeral: Record<string, Regra[]> = {
  nome: [obrigatorio('Informe o nome'), tamanho(1, 150)],
  desc: [tamanho(0, 1000)],
  img: [url()],
  video: [youtube()],
  n: [obrigatorio('Informe as porções'), numero(1, 'Pelo menos 1 porção')],
  min: [obrigatorio('Informe o tempo'), numero(1, 'Pelo menos 1 minuto')],
}
const difKey = (label: string) => Object.entries(ENUMS.dificuldade).find(([, v]) => v === label)?.[0] ?? 'FACIL'

export default function NovaReceita() {
  const { id: editId } = useParams()
  const { usuario, meusPerfis } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const confirmar = useConfirmar()
  const todas = useRecipes(true)
  const [, setReceitas] = useLocalState<Recipe[]>('gm-receitas', [])
  const [allDicas, setAllDicas] = useLocalState<Record<string, Dica[]>>('gm-dicas', {})
  useSeo({ titulo: editId ? 'Editar receita' : 'Publicar receita' })

  const chave = `gm-rascunho:${usuario?.id ?? ''}`
  const existente = editId ? todas.find((r) => r.id === editId) : undefined
  const [d, setD] = useState<Rascunho>(vazio)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [errosPasso, setErrosPasso] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [sujo, setSujo] = useState(false)
  const [oferecer, setOferecer] = useState<Rascunho | null>(null)
  const [busca, setBusca] = useState('')
  const topo = useRef<HTMLHeadingElement>(null)

  // modo edição: carrega a receita; modo criação: oferece o rascunho do usuário
  useEffect(() => {
    if (editId && existente?.detail) {
      const dicas = allDicas[editId] ?? []
      setD({
        passo: 0,
        geral: {
          nome: existente.title, desc: existente.description ?? '', img: existente.image ?? '', video: existente.video ?? '', n: String(existente.servings), min: String(existente.minutes),
          dif: difKey(existente.difficulty), tipo: existente.tipo ?? 'ALMOCO', metodo: existente.metodo ?? '', ocasiao: existente.ocasiao ?? '', perfil: existente.perfil ?? '',
        },
        itens: existente.detail.ing.map((i) => ({ cat: i.cat ?? '', qty: String(i.qty), unit: i.unit })),
        etapas: existente.detail.steps.map((s, k) => ({
          title: s.title, text: s.text, videoAt: s.videoAt !== undefined ? String(s.videoAt) : '', image: s.image ?? '', seconds: s.seconds ? String(s.seconds) : '',
          dicas: dicas.filter((x) => x.etapa === k).map((x) => ({ tipo: x.tipo, titulo: x.titulo, texto: x.texto })),
        })),
      })
    } else if (!editId) {
      try {
        const raw = localStorage.getItem(chave)
        if (raw) setOferecer(JSON.parse(raw) as Rascunho)
      } catch { /* sem rascunho */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, existente?.id])

  // rascunho local por usuário (chave inclui o id), com debounce e tratamento de cota
  useEffect(() => {
    if (editId || !usuario || !sujo) return
    const t = setTimeout(() => {
      try {
        const txt = JSON.stringify(d)
        if (txt.length > 200_000) return toast.aviso('Rascunho grande demais para salvar neste navegador.')
        localStorage.setItem(chave, txt)
      } catch { toast.aviso('Não foi possível salvar o rascunho (armazenamento cheio).') }
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, sujo])

  // alterações não salvas ao sair (edição)
  useEffect(() => {
    if (!sujo || !editId) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [sujo, editId])

  const chef = meusPerfis.find((p) => p.papel === 'CHEF' && p.status === 'APROVADO')
  const alterar = (fn: (r: Rascunho) => Rascunho) => { setD((p) => fn(p)); setSujo(true) }
  const setG = (k: keyof Geral) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    alterar((p) => ({ ...p, geral: { ...p.geral, [k]: e.target.value } }))
    if (erros[k]) setErros((x) => ({ ...x, [k]: '' }))
  }

  const nutri = useMemo(() => {
    const t = { kcal: 0, fora: 0 }
    for (const i of d.itens) {
      const c = catalogo.find((x) => x.id === i.cat)
      const q = Number(String(i.qty).replace(',', '.'))
      if (!c || !(q > 0) || (i.unit !== 'G' && i.unit !== 'ML')) { if (i.cat) t.fora++; continue }
      t.kcal += c.kcal * (q / 100)
    }
    return { porcao: t.kcal / (Number(d.geral.n) || 1), fora: t.fora }
  }, [d.itens, d.geral.n])

  if (!usuario) return <Navigate to="/login" replace state={DESTINO_LOGIN} />
  if (!chef)
    return <EstadoVazio titulo="Só chefs aprovados publicam receitas" texto="Crie seu perfil de chef para publicar." acao={{ to: '/onboarding', rotulo: 'Criar perfil de chef' }} />
  if (editId && !existente) return <EstadoVazio titulo="Receita não encontrada" acao={{ to: '/painel', rotulo: 'Voltar ao painel' }} />
  if (editId && existente && existente.owner !== usuario.id) return <Navigate to="/acesso-negado" replace />

  const validaPasso = (passo: number): boolean => {
    const novos: Record<string, string> = {}
    const lista: string[] = []
    if (passo === 0)
      for (const [k, rs] of Object.entries(regrasGeral)) for (const r of rs) { const e = r(d.geral[k as keyof Geral], {}); if (e) { novos[k] = e; break } }
    if (passo === 1) {
      const validos = d.itens.filter((i) => i.cat)
      if (validos.length === 0) lista.push('Adicione ao menos um ingrediente do catálogo.')
      d.itens.forEach((i, k) => { if (i.cat && !(Number(String(i.qty).replace(',', '.')) > 0)) lista.push(`Ingrediente ${k + 1}: a quantidade deve ser maior que zero.`) })
    }
    if (passo === 2) {
      const validas = d.etapas.filter((e) => e.title.trim() && e.text.trim())
      if (validas.length === 0) lista.push('Adicione ao menos uma etapa com título e instrução.')
      d.etapas.forEach((e, k) => { if ((e.title.trim() || e.text.trim()) && !(e.title.trim() && e.text.trim())) lista.push(`Etapa ${k + 1}: preencha título e instrução.`) })
    }
    setErros(novos)
    setErrosPasso(lista)
    if (Object.keys(novos).length) document.querySelector<HTMLElement>(`[name="${Object.keys(novos)[0]}"]`)?.focus()
    return Object.keys(novos).length === 0 && lista.length === 0
  }

  const ir = (p: number) => { setD((x) => ({ ...x, passo: p })); setErros({}); setErrosPasso([]); setTimeout(() => topo.current?.focus(), 0) }
  const avancar = () => { if (validaPasso(d.passo)) ir(d.passo + 1) }

  const publicar = async () => {
    if (enviando) return // duplo envio impedido
    for (let p = 0; p < 3; p++) if (!validaPasso(p)) return ir(p) // erro leva à etapa correspondente
    setEnviando(true)
    const g = d.geral
    const ing = d.itens.filter((i) => i.cat).map((i) => ({ cat: i.cat, name: catalogo.find((c) => c.id === i.cat)!.nome, qty: Number(String(i.qty).replace(',', '.')), unit: i.unit }))
    const etapasOk = d.etapas.filter((e) => e.title.trim() && e.text.trim())
    const id = editId ?? `u${Date.now()}`
    const rec: Recipe = {
      id, title: g.nome.trim(), emoji: '🍽️', seed: Date.now() % 5, minutes: Number(g.min),
      difficulty: ENUMS.dificuldade[g.dif as keyof typeof ENUMS.dificuldade] as Recipe['difficulty'], servings: Number(g.n),
      author: `Chef ${usuario.username}`, role: 'Chef',
      collections: [ENUMS.tipo[g.tipo as keyof typeof ENUMS.tipo], ...(g.perfil ? [ENUMS.perfil[g.perfil as keyof typeof ENUMS.perfil]] : [])],
      ingredients: ing.map((i) => i.name), nutrition: 'Estimativa calculada pelos ingredientes',
      image: g.img || undefined, video: g.video || undefined, description: g.desc || undefined, owner: usuario.id,
      tipo: g.tipo, metodo: g.metodo || undefined, ocasiao: g.ocasiao || undefined, perfil: g.perfil || undefined, createdAt: existente?.createdAt ?? Date.now(),
      detail: { ing, steps: etapasOk.map((e) => ({ title: e.title.trim(), text: e.text.trim(), videoAt: e.videoAt ? Number(e.videoAt) : undefined, image: e.image || undefined, seconds: e.seconds ? Number(e.seconds) : undefined })) },
    }
    setReceitas((l) => (editId ? l.map((x) => (x.id === id ? rec : x)) : [rec, ...l]))
    const dicas: Dica[] = []
    etapasOk.forEach((e, k) => e.dicas.filter((x) => x.titulo.trim() && x.texto.trim()).forEach((x, j) => dicas.push({ id: Date.now() + k * 100 + j, etapa: k, tipo: x.tipo, titulo: x.titulo.trim(), texto: x.texto.trim(), autor: usuario.username, autorId: usuario.id })))
    setAllDicas((m) => ({ ...m, [id]: dicas }))
    try { localStorage.removeItem(chave) } catch { /* ok */ }
    setSujo(false)
    toast.sucesso(editId ? 'Receita atualizada.' : 'Receita publicada.')
    nav(`/receita/${id}`)
  }

  const excluir = async () => {
    if (await confirmar({ titulo: 'Excluir esta receita?', texto: 'Ela some do site. Você pode restaurá-la depois no painel.', confirmar: 'Excluir', perigo: true })) {
      setReceitas((l) => l.map((x) => (x.id === editId ? { ...x, deleted: true } : x)))
      setSujo(false)
      toast.sucesso('Receita excluída.')
      nav('/painel')
    }
  }

  const mover = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
    const j = i + dir
    if (j < 0 || j >= arr.length) return arr
    const c = [...arr]; [c[i], c[j]] = [c[j], c[i]]
    return c
  }
  const g = d.geral
  const upItem = (i: number, k: keyof Item, v: string) => alterar((p) => ({ ...p, itens: p.itens.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }))
  const upEt = (i: number, patch: Partial<Et>) => alterar((p) => ({ ...p, etapas: p.etapas.map((x, j) => (j === i ? { ...x, ...patch } : x)) }))
  const filtrados = catalogo.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 ref={topo} tabIndex={-1} className="text-3xl font-extrabold outline-none">{editId ? 'Editar receita' : 'Publicar receita'}</h1>
        {editId && <button className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-alert" onClick={excluir}><Trash2 size={15} /> Excluir receita</button>}
      </div>

      {oferecer && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm" role="status">
          <span>Você tem um rascunho salvo neste navegador.</span>
          <span className="flex gap-2">
            <button className="btn-primary !py-2" onClick={() => { setD(oferecer); setOferecer(null); setSujo(true) }}>Continuar rascunho</button>
            <button className="btn-ghost !py-2" onClick={() => { try { localStorage.removeItem(chave) } catch { /* ok */ } setOferecer(null) }}>Descartar</button>
          </span>
        </div>
      )}

      <ol className="flex gap-2" aria-label="Progresso">
        {ETAPAS.map((t, i) => (
          <li key={t} className="flex-1" aria-current={i === d.passo ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full ${i <= d.passo ? 'bg-terra' : 'bg-line'}`} />
            <p className={`mt-1.5 text-[11px] font-semibold ${i === d.passo ? 'text-terra' : 'text-ink-faint'}`}>{i + 1}. {t}</p>
          </li>
        ))}
      </ol>

      {errosPasso.length > 0 && (
        <div role="alert" className="rounded-2xl bg-alert-soft p-3 text-xs text-alert">
          <ul className="list-disc space-y-0.5 pl-4">{errosPasso.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      {d.passo === 0 && (
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Campo label="Nome" erro={erros.nome}><input name="nome" className="input" maxLength={150} value={g.nome} onChange={setG('nome')} /></Campo></div>
          <div className="sm:col-span-2"><Campo label="Descrição" erro={erros.desc} dica={`${g.desc.length} / 1000`}><textarea name="desc" className="input" rows={3} maxLength={1000} value={g.desc} onChange={setG('desc')} /></Campo></div>
          <div className="sm:col-span-2"><UploadImagem rotulo="Imagem de capa (opcional)" valor={g.img || undefined} onChange={(v) => alterar((p) => ({ ...p, geral: { ...p.geral, img: v ?? '' } }))} max={1000} /></div>
          <Campo label="Link do vídeo (YouTube)" erro={erros.video}><input name="video" className="input" maxLength={500} value={g.video} onChange={setG('video')} /></Campo>
          <Campo label="Porções" erro={erros.n}><input name="n" className="input" inputMode="numeric" value={g.n} onChange={setG('n')} /></Campo>
          <Campo label="Tempo (min)" erro={erros.min}><input name="min" className="input" inputMode="numeric" value={g.min} onChange={setG('min')} /></Campo>
          <Campo label="Dificuldade"><select className="input" value={g.dif} onChange={setG('dif')}><Opcoes mapa={ENUMS.dificuldade} /></select></Campo>
          <Campo label="Refeição"><select className="input" value={g.tipo} onChange={setG('tipo')}><Opcoes mapa={ENUMS.tipo} /></select></Campo>
          <Campo label="Método"><select className="input" value={g.metodo} onChange={setG('metodo')}><option value="">—</option><Opcoes mapa={ENUMS.metodo} /></select></Campo>
          <Campo label="Ocasião"><select className="input" value={g.ocasiao} onChange={setG('ocasiao')}><option value="">—</option><Opcoes mapa={ENUMS.ocasiao} /></select></Campo>
          <Campo label="Perfil alimentar"><select className="input" value={g.perfil} onChange={setG('perfil')}><option value="">—</option><Opcoes mapa={ENUMS.perfil} /></select></Campo>
        </section>
      )}

      {d.passo === 1 && (
        <section className="card space-y-4 p-5">
          <Campo label="Filtrar o catálogo" dica="Só é possível usar ingredientes do catálogo."><input className="input" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite para buscar..." /></Campo>
          <ul className="space-y-3">
            {d.itens.map((it, i) => (
              <li key={i} className="space-y-1 rounded-2xl border border-line p-3">
                <div className="grid grid-cols-[1fr_90px_100px] gap-2">
                  <select aria-label={`Ingrediente ${i + 1}`} className="input" value={it.cat} onChange={(e) => upItem(i, 'cat', e.target.value)}>
                    <option value="">Ingrediente</option>
                    {(it.cat && !filtrados.some((c) => c.id === it.cat) ? [catalogo.find((c) => c.id === it.cat)!, ...filtrados] : filtrados).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <input aria-label={`Quantidade ${i + 1}`} className="input" inputMode="decimal" placeholder="Qtd" value={it.qty} onChange={(e) => upItem(i, 'qty', e.target.value)} />
                  <select aria-label={`Unidade ${i + 1}`} className="input" value={it.unit} onChange={(e) => upItem(i, 'unit', e.target.value)}><Opcoes mapa={ENUMS.unidade} /></select>
                </div>
                {it.cat && (it.unit === 'UNIDADE' || it.unit === 'XICARA') && <p className="text-[11px] text-gold">Este catálogo usa g/ml: com “{ENUMS.unidade[it.unit as keyof typeof ENUMS.unidade]}” o item não entra no cálculo nutricional.</p>}
                <div className="flex gap-1">
                  <button type="button" aria-label={`Subir ingrediente ${i + 1}`} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line disabled:opacity-30" disabled={i === 0} onClick={() => alterar((p) => ({ ...p, itens: mover(p.itens, i, -1) }))}><ArrowUp size={14} /></button>
                  <button type="button" aria-label={`Descer ingrediente ${i + 1}`} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line disabled:opacity-30" disabled={i === d.itens.length - 1} onClick={() => alterar((p) => ({ ...p, itens: mover(p.itens, i, 1) }))}><ArrowDown size={14} /></button>
                  <button type="button" aria-label={`Remover ingrediente ${i + 1}`} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line text-alert disabled:opacity-30" disabled={d.itens.length === 1} onClick={() => alterar((p) => ({ ...p, itens: p.itens.filter((_, j) => j !== i) }))}><Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-ghost" onClick={() => alterar((p) => ({ ...p, itens: [...p.itens, { cat: '', qty: '', unit: 'G' }] }))}><Plus size={15} /> Ingrediente</button>
          <p className="rounded-2xl bg-peach p-3 text-sm" aria-live="polite">Prévia nutricional: <b className="text-terra">{Math.round(nutri.porcao)} kcal</b> por porção{nutri.fora > 0 ? ` (cálculo parcial: ${nutri.fora} item fora da conta)` : ''}.</p>
        </section>
      )}

      {d.passo === 2 && (
        <section className="card space-y-4 p-5">
          <ol className="space-y-4">
            {d.etapas.map((et, i) => (
              <li key={i} className="space-y-2 rounded-2xl border border-line p-4">
                <p className="text-xs font-bold text-terra">Etapa {i + 1}</p>
                <input aria-label={`Título da etapa ${i + 1}`} className="input" placeholder="Título" maxLength={150} value={et.title} onChange={(e) => upEt(i, { title: e.target.value })} />
                <textarea aria-label={`Instrução da etapa ${i + 1}`} className="input" rows={3} placeholder="Instrução" maxLength={2000} value={et.text} onChange={(e) => upEt(i, { text: e.target.value })} />
                <div className="grid gap-2 sm:grid-cols-3">
                  <input aria-label="Segundo do vídeo" className="input" inputMode="numeric" placeholder="Segundo do vídeo" value={et.videoAt} onChange={(e) => upEt(i, { videoAt: e.target.value.replace(/\D/g, '') })} />
                  <input aria-label="Timer em segundos" className="input" inputMode="numeric" placeholder="Timer (segundos)" value={et.seconds} onChange={(e) => upEt(i, { seconds: e.target.value.replace(/\D/g, '') })} />
                  <input aria-label="Link da imagem" className="input" placeholder="Link da imagem" value={et.image} onChange={(e) => upEt(i, { image: e.target.value })} />
                </div>
                {(et.title || et.text) && <p className="rounded-xl bg-cream p-3 text-xs text-ink-soft"><b className="text-ink">{i + 1}. {et.title}</b><br />{et.text}</p>}
                <div className="flex gap-1">
                  <button type="button" aria-label={`Subir etapa ${i + 1}`} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line disabled:opacity-30" disabled={i === 0} onClick={() => alterar((p) => ({ ...p, etapas: mover(p.etapas, i, -1) }))}><ArrowUp size={14} /></button>
                  <button type="button" aria-label={`Descer etapa ${i + 1}`} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line disabled:opacity-30" disabled={i === d.etapas.length - 1} onClick={() => alterar((p) => ({ ...p, etapas: mover(p.etapas, i, 1) }))}><ArrowDown size={14} /></button>
                  <button type="button" aria-label={`Remover etapa ${i + 1}`} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line text-alert disabled:opacity-30" disabled={d.etapas.length === 1} onClick={() => alterar((p) => ({ ...p, etapas: p.etapas.filter((_, j) => j !== i) }))}><Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ol>
          <button type="button" className="btn-ghost" onClick={() => alterar((p) => ({ ...p, etapas: [...p.etapas, novaEtapa()] }))}><Plus size={15} /> Etapa</button>
        </section>
      )}

      {d.passo === 3 && (
        <section className="space-y-4">
          <div className="card space-y-4 p-5">
            <h2 className="text-lg font-bold">Dicas e erros comuns por etapa</h2>
            {d.etapas.filter((e) => e.title.trim()).map((et) => {
              const idx = d.etapas.indexOf(et)
              return (
                <div key={idx} className="space-y-2 rounded-2xl border border-line p-3">
                  <p className="text-sm font-semibold">{idx + 1}. {et.title}</p>
                  {et.dicas.map((x, j) => (
                    <div key={j} className="grid gap-2 sm:grid-cols-[130px_1fr_auto]">
                      <select aria-label="Tipo" className="input" value={x.tipo} onChange={(e) => upEt(idx, { dicas: et.dicas.map((y, k) => (k === j ? { ...y, tipo: e.target.value as Dica['tipo'] } : y)) })}><option value="DICA">Dica</option><option value="ERRO_COMUM">Erro comum</option></select>
                      <div className="space-y-1">
                        <input aria-label="Título da dica" className="input" placeholder="Título" value={x.titulo} onChange={(e) => upEt(idx, { dicas: et.dicas.map((y, k) => (k === j ? { ...y, titulo: e.target.value } : y)) })} />
                        <textarea aria-label="Texto da dica" className="input" rows={2} placeholder="Texto" value={x.texto} onChange={(e) => upEt(idx, { dicas: et.dicas.map((y, k) => (k === j ? { ...y, texto: e.target.value } : y)) })} />
                      </div>
                      <button type="button" aria-label="Remover dica" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line text-alert" onClick={() => upEt(idx, { dicas: et.dicas.filter((_, k) => k !== j) })}><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button type="button" className="text-xs font-semibold text-terra" onClick={() => upEt(idx, { dicas: [...et.dicas, { tipo: 'DICA', titulo: '', texto: '' }] })}>+ Adicionar dica</button>
                </div>
              )
            })}
          </div>

          <div className="card space-y-4 p-5">
            <h2 className="text-lg font-bold">Revisão</h2>
            <Resumo titulo="Dados gerais" onEditar={() => ir(0)}>
              <p><b>{g.nome || '—'}</b> · {g.n} porções · {g.min} min · {ENUMS.dificuldade[g.dif as keyof typeof ENUMS.dificuldade]} · {ENUMS.tipo[g.tipo as keyof typeof ENUMS.tipo]}</p>
            </Resumo>
            <Resumo titulo="Ingredientes" onEditar={() => ir(1)}>
              <ul className="list-disc pl-4">{d.itens.filter((i) => i.cat).map((i, k) => <li key={k}>{fmtNum(Number(i.qty) || 0)} {ENUMS.unidade[i.unit as keyof typeof ENUMS.unidade]} {catalogo.find((c) => c.id === i.cat)?.nome}</li>)}</ul>
            </Resumo>
            <Resumo titulo="Modo de preparo" onEditar={() => ir(2)}>
              <ol className="list-decimal pl-4">{d.etapas.filter((e) => e.title.trim()).map((e, k) => <li key={k}>{e.title}</li>)}</ol>
            </Resumo>
          </div>
        </section>
      )}

      <div className="flex justify-between gap-3">
        <button className="btn-ghost" disabled={d.passo === 0} onClick={() => ir(d.passo - 1)}>Voltar</button>
        {d.passo < 3 ? (
          <button className="btn-primary" onClick={avancar}>Avançar</button>
        ) : (
          <button className="btn-primary" disabled={enviando} onClick={publicar}><Check size={16} /> {editId ? 'Salvar alterações' : 'Publicar receita'}</button>
        )}
      </div>
      <p className="text-center text-xs text-ink-faint"><Link to="/painel" className="underline">Cancelar e voltar ao painel</Link></p>
    </div>
  )
}

function Resumo({ titulo, onEditar, children }: { titulo: string; onEditar: () => void; children: React.ReactNode }) {
  return (
    <div className="space-y-1 border-t border-line pt-3 text-sm text-ink-soft first:border-0 first:pt-0">
      <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-ink">{titulo}</h3><button className="text-xs font-semibold text-terra" onClick={onEditar}>Editar</button></div>
      {children}
    </div>
  )
}
