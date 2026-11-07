import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Campo, Opcoes } from '../components/Campo'
import { useConfirmar, useToast } from '../components/Feedback'
import Protegida from '../components/Protegida'
import { Carregando, ErroApi, EstadoVazio, UploadImagem } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import { del, errosDeCampo, mensagem, post, put } from '../lib/api'
import type { Ingrediente, ReceitaDetalhe, TipoDica } from '../lib/apiTipos'
import { fmtNum } from '../lib/format'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'
import { numero, obrigatorio, tamanho, youtube, type Regra } from '../lib/validar'

type Item = { id: string; qty: string; unit: string }
type Et = { titulo: string; instrucao: string; timestamp: string; imagem?: string; dicas: { tipo: TipoDica; conteudo: string }[] }
type Geral = { nome: string; desc: string; imagem?: string; video: string; n: string; min: string; dif: string; tipo: string; metodo: string; ocasiao: string; perfil: string }
type Rascunho = { geral: Geral; itens: Item[]; etapas: Et[]; passo: number }

const ETAPAS = ['Dados gerais', 'Ingredientes', 'Modo de preparo', 'Dicas e revisão']
const novaEtapa = (): Et => ({ titulo: '', instrucao: '', timestamp: '', dicas: [] })
const vazio = (): Rascunho => ({
  geral: { nome: '', desc: '', video: '', n: '4', min: '30', dif: 'FACIL', tipo: 'ALMOCO', metodo: '', ocasiao: '', perfil: '' },
  itens: [{ id: '', qty: '', unit: 'G' }],
  etapas: [novaEtapa()],
  passo: 0,
})

const regrasGeral: Record<string, Regra[]> = {
  nome: [obrigatorio('Informe o nome'), tamanho(1, 150)],
  desc: [tamanho(0, 1000)],
  video: [youtube()],
  n: [obrigatorio('Informe as porções'), numero(1, 'Pelo menos 1 porção')],
  min: [obrigatorio('Informe o tempo'), numero(1, 'Pelo menos 1 minuto')],
}
// campos de ReceitaRequest da API que cada passo do assistente cobre
const campoParaPasso: Record<string, number> = { nome: 0, descricao: 0, imagem: 0, videoUrl: 0, nPorcoes: 0, tempoPreparo: 0, dificuldade: 0, tipo: 0 }

const mover = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const c = [...arr]; [c[i], c[j]] = [c[j], c[i]]
  return c
}

export default function NovaReceita() {
  const { id: editId } = useParams()
  const { usuario, perfil, carregandoPerfil } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const confirmar = useConfirmar()
  useSeo({ titulo: editId ? 'Editar receita' : 'Publicar receita' })

  const catalogo = useApi<Ingrediente[]>('/ingredientes')
  const existente = useApi<ReceitaDetalhe>(editId ? `/receitas/${editId}` : null)
  const chave = `gm-rascunho:${usuario?.id ?? ''}`
  const [d, setD] = useState<Rascunho>(vazio)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [errosPasso, setErrosPasso] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)
  const [sujo, setSujo] = useState(false)
  const [oferecer, setOferecer] = useState<Rascunho | null>(null)
  const [busca, setBusca] = useState('')
  const [arrasto, setArrasto] = useState<number | null>(null)
  const topo = useRef<HTMLHeadingElement>(null)

  const itensCatalogo = catalogo.dados ?? []
  const porId = useMemo(() => new Map(itensCatalogo.map((i) => [String(i.id), i])), [itensCatalogo])

  // edição: carrega a receita da API no formulário
  useEffect(() => {
    const r = existente.dados
    if (!editId || !r) return
    setD({
      passo: 0,
      geral: { nome: r.nome, desc: r.descricao ?? '', imagem: r.imagem ?? undefined, video: r.videoUrl ?? '', n: String(r.nPorcoes), min: String(r.tempoPreparo), dif: r.dificuldade, tipo: r.tipo, metodo: r.metodoPreparo ?? '', ocasiao: r.ocasiao ?? '', perfil: r.perfil ?? '' },
      itens: r.ingredientes.map((i) => ({ id: String(i.idIngrediente), qty: String(i.quantidade), unit: i.unidadeMedida })),
      etapas: r.etapas.map((e) => ({ titulo: e.titulo, instrucao: e.instrucao, timestamp: e.timestampVideo != null ? String(e.timestampVideo) : '', imagem: e.imagem ?? undefined, dicas: e.dicas.map((x) => ({ tipo: x.tipo, conteudo: x.conteudo })) })),
    })
  }, [editId, existente.dados])

  // criação: oferece o rascunho local deste usuário
  useEffect(() => {
    if (editId || !usuario) return
    try { const raw = localStorage.getItem(chave); if (raw) setOferecer(JSON.parse(raw) as Rascunho) } catch { /* sem rascunho */ }
  }, [editId, usuario, chave])

  // rascunho local por usuário, com debounce e tratamento de cota
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
  }, [d, sujo]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sujo || !editId) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [sujo, editId])

  const alterar = (fn: (r: Rascunho) => Rascunho) => { setD((p) => fn(p)); setSujo(true) }
  const setG = (k: keyof Geral) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    alterar((p) => ({ ...p, geral: { ...p.geral, [k]: e.target.value } }))
    if (erros[k]) setErros((x) => ({ ...x, [k]: '' }))
  }

  // estimativa local (a tabela oficial vem da API depois de publicar)
  const estimativa = useMemo(() => {
    let kcal = 0, fora = 0
    for (const i of d.itens) {
      const c = porId.get(i.id)
      const q = Number(i.qty.replace(',', '.'))
      if (!c || !(q > 0)) continue
      if (i.unit !== 'G' && i.unit !== 'ML') { fora++; continue }
      kcal += c.calorias * (q / (c.porcaoBase || 100))
    }
    return { porcao: kcal / (Number(d.geral.n) || 1), fora }
  }, [d.itens, d.geral.n, porId])

  if (!usuario) return <Navigate to="/login" replace state={{ from: '/publicar' }} />
  const ehChef = perfil?.papel === 'CHEF'
  const dono = editId && existente.dados && ehChef && perfil.dados.id === existente.dados.chef.id

  const validaPasso = (passo: number): boolean => {
    const novos: Record<string, string> = {}
    const lista: string[] = []
    if (passo === 0) for (const [k, rs] of Object.entries(regrasGeral)) for (const r of rs) { const e = r(d.geral[k as keyof Geral] as string, {}); if (e) { novos[k] = e; break } }
    if (passo === 1) {
      if (d.itens.filter((i) => i.id).length === 0) lista.push('Adicione ao menos um ingrediente do catálogo.')
      d.itens.forEach((i, k) => { if (i.id && !(Number(i.qty.replace(',', '.')) > 0)) lista.push(`Ingrediente ${k + 1}: a quantidade deve ser maior que zero.`) })
    }
    if (passo === 2) {
      if (d.etapas.filter((e) => e.titulo.trim() && e.instrucao.trim()).length === 0) lista.push('Adicione ao menos uma etapa com título e instrução.')
      d.etapas.forEach((e, k) => { if ((e.titulo.trim() || e.instrucao.trim()) && !(e.titulo.trim() && e.instrucao.trim())) lista.push(`Etapa ${k + 1}: preencha título e instrução.`) })
    }
    setErros(novos); setErrosPasso(lista)
    if (Object.keys(novos).length) document.querySelector<HTMLElement>(`[name="${Object.keys(novos)[0]}"]`)?.focus()
    return Object.keys(novos).length === 0 && lista.length === 0
  }
  const ir = (p: number) => { setD((x) => ({ ...x, passo: p })); setErros({}); setErrosPasso([]); setTimeout(() => topo.current?.focus(), 0) }
  const avancar = () => { if (validaPasso(d.passo)) ir(d.passo + 1) }

  // Monta o corpo exatamente como o ReceitaRequest da API.
  const corpoReceita = () => ({
    nome: d.geral.nome.trim(), descricao: d.geral.desc || undefined, imagem: d.geral.imagem || undefined, videoUrl: d.geral.video || undefined,
    nPorcoes: Number(d.geral.n), dificuldade: d.geral.dif, tipo: d.geral.tipo, metodoPreparo: d.geral.metodo || undefined, ocasiao: d.geral.ocasiao || undefined,
    tempoPreparo: Number(d.geral.min), perfil: d.geral.perfil || undefined,
    ingredientes: d.itens.filter((i) => i.id).map((i) => ({ idIngrediente: Number(i.id), quantidade: Number(i.qty.replace(',', '.')), unidadeMedida: i.unit })),
  })

  const publicar = async () => {
    if (enviando) return // duplo envio impedido
    for (let p = 0; p < 3; p++) if (!validaPasso(p)) return ir(p)
    setEnviando(true)
    try {
      let idReceita = Number(editId)
      if (editId) {
        await put(`/receitas/${editId}`, corpoReceita())
        // o PUT troca dados e ingredientes; as etapas são refeitas na ordem da tela
        for (const e of existente.dados?.etapas ?? []) await del(`/receitas/${editId}/etapas/${e.id}`)
      } else {
        idReceita = (await post<{ id: number }>('/receitas', corpoReceita())).id
      }
      const etapas = d.etapas.filter((e) => e.titulo.trim() && e.instrucao.trim())
      for (const [k, e] of etapas.entries()) {
        const criada = await post<{ id: number }>(`/receitas/${idReceita}/etapas`, { ordem: k + 1, titulo: e.titulo.trim(), instrucao: e.instrucao.trim(), timestampVideo: e.timestamp ? Number(e.timestamp) : undefined, imagem: e.imagem })
        for (const x of e.dicas.filter((y) => y.conteudo.trim())) await post(`/receitas/${idReceita}/etapas/${criada.id}/dicas`, { tipo: x.tipo, conteudo: x.conteudo.trim() })
      }
      try { localStorage.removeItem(chave) } catch { /* ok */ }
      setSujo(false)
      toast.sucesso(editId ? 'Receita atualizada.' : 'Receita publicada.')
      nav(`/receita/${idReceita}`)
    } catch (e) {
      // erro de campo da API leva o usuário ao passo correspondente
      const ec = errosDeCampo(e)
      const campos = Object.keys(ec)
      if (campos.length) {
        const passo = campos.some((c) => c.startsWith('ingredientes')) ? 1 : campos.some((c) => c.startsWith('etapas')) ? 2 : (campoParaPasso[campos[0]] ?? 0)
        setErros(ec); setErrosPasso(campos.map((c) => `${c}: ${ec[c]}`)); setD((x) => ({ ...x, passo }))
      } else setErrosPasso([mensagem(e)])
      toast.erro(mensagem(e))
    } finally {
      setEnviando(false)
    }
  }

  const excluir = async () => {
    if (!(await confirmar({ titulo: 'Excluir esta receita?', texto: 'Ela sai do site e não pode ser restaurada.', confirmar: 'Excluir', perigo: true }))) return
    try { await del(`/receitas/${editId}`); setSujo(false); toast.sucesso('Receita excluída.'); nav('/receitas') } catch (e) { toast.erro(mensagem(e)) }
  }

  if (carregandoPerfil) return <Protegida><Carregando texto="Verificando seu perfil" /></Protegida>
  if (!ehChef) return <Protegida><EstadoVazio titulo="Só chefs publicam receitas" texto="Crie seu perfil de chef para publicar." acao={{ to: '/onboarding', rotulo: 'Criar perfil de chef' }} /></Protegida>
  if (editId && existente.erro) return <ErroApi erro={existente.erro} onTentar={existente.recarregar} />
  if (editId && !existente.dados) return <Carregando lento={existente.lento} texto="Carregando a receita" />
  if (editId && existente.dados && !dono) return <EstadoVazio titulo="Você não pode editar esta receita" texto="Só o chef dono edita a própria receita." acao={{ to: `/receita/${editId}`, rotulo: 'Ver a receita' }} />
  if (catalogo.erro) return <ErroApi erro={catalogo.erro} onTentar={catalogo.recarregar} />
  if (!catalogo.dados) return <Carregando lento={catalogo.lento} texto="Carregando ingredientes" />

  const g = d.geral
  const upItem = (i: number, k: keyof Item, v: string) => alterar((p) => ({ ...p, itens: p.itens.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }))
  const upEt = (i: number, patch: Partial<Et>) => alterar((p) => ({ ...p, etapas: p.etapas.map((x, j) => (j === i ? { ...x, ...patch } : x)) }))
  const filtrados = itensCatalogo.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
  const btnIcone = 'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line disabled:opacity-30'

  return (
    <Protegida>
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
          <div role="alert" className="rounded-2xl bg-alert-soft p-3 text-xs text-alert"><ul className="list-disc space-y-0.5 pl-4">{errosPasso.map((e) => <li key={e}>{e}</li>)}</ul></div>
        )}

        {d.passo === 0 && (
          <section className="card grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Campo label="Nome" erro={erros.nome}><input name="nome" className="input" maxLength={150} value={g.nome} onChange={setG('nome')} /></Campo></div>
            <div className="sm:col-span-2"><Campo label="Descrição" erro={erros.desc ?? erros.descricao} dica={`${g.desc.length} / 1000`}><textarea name="desc" className="input" rows={3} maxLength={1000} value={g.desc} onChange={setG('desc')} /></Campo></div>
            <div className="sm:col-span-2"><UploadImagem rotulo="Imagem de capa (opcional)" valor={g.imagem} onChange={(v) => alterar((p) => ({ ...p, geral: { ...p.geral, imagem: v } }))} /></div>
            <Campo label="Link do vídeo (YouTube)" erro={erros.video ?? erros.videoUrl}><input name="video" className="input" maxLength={500} value={g.video} onChange={setG('video')} /></Campo>
            <Campo label="Porções" erro={erros.n ?? erros.nPorcoes}><input name="n" className="input" inputMode="numeric" value={g.n} onChange={setG('n')} /></Campo>
            <Campo label="Tempo (min)" erro={erros.min ?? erros.tempoPreparo}><input name="min" className="input" inputMode="numeric" value={g.min} onChange={setG('min')} /></Campo>
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
                    <select aria-label={`Ingrediente ${i + 1}`} className="input" value={it.id} onChange={(e) => upItem(i, 'id', e.target.value)}>
                      <option value="">Ingrediente</option>
                      {(it.id && !filtrados.some((c) => String(c.id) === it.id) && porId.get(it.id) ? [porId.get(it.id)!, ...filtrados] : filtrados).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                    <input aria-label={`Quantidade ${i + 1}`} className="input" inputMode="decimal" placeholder="Qtd" value={it.qty} onChange={(e) => upItem(i, 'qty', e.target.value)} />
                    <select aria-label={`Unidade ${i + 1}`} className="input" value={it.unit} onChange={(e) => upItem(i, 'unit', e.target.value)}><Opcoes mapa={ENUMS.unidade} /></select>
                  </div>
                  {it.id && (it.unit === 'UNIDADE' || it.unit === 'XICARA') && <p className="text-[11px] text-gold">Só ingredientes em g e ml entram no cálculo nutricional.</p>}
                  <div className="flex gap-1">
                    <button type="button" aria-label={`Subir ingrediente ${i + 1}`} className={btnIcone} disabled={i === 0} onClick={() => alterar((p) => ({ ...p, itens: mover(p.itens, i, -1) }))}><ArrowUp size={14} /></button>
                    <button type="button" aria-label={`Descer ingrediente ${i + 1}`} className={btnIcone} disabled={i === d.itens.length - 1} onClick={() => alterar((p) => ({ ...p, itens: mover(p.itens, i, 1) }))}><ArrowDown size={14} /></button>
                    <button type="button" aria-label={`Remover ingrediente ${i + 1}`} className={`${btnIcone} text-alert`} disabled={d.itens.length === 1} onClick={() => alterar((p) => ({ ...p, itens: p.itens.filter((_, j) => j !== i) }))}><Trash2 size={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-ghost" onClick={() => alterar((p) => ({ ...p, itens: [...p.itens, { id: '', qty: '', unit: 'G' }] }))}><Plus size={15} /> Ingrediente</button>
            <p className="rounded-2xl bg-peach p-3 text-sm" aria-live="polite">Estimativa: <b className="text-terra">{Math.round(estimativa.porcao)} kcal</b> por porção{estimativa.fora > 0 ? ` (${estimativa.fora} item fora da conta)` : ''}. A tabela oficial é calculada pela API depois de publicar.</p>
          </section>
        )}

        {d.passo === 2 && (
          <section className="card space-y-4 p-5">
            <ol className="space-y-4">
              {d.etapas.map((et, i) => (
                <li key={i} draggable onDragStart={() => setArrasto(i)} onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (arrasto !== null && arrasto !== i) alterar((p) => { const c = [...p.etapas]; const [m] = c.splice(arrasto, 1); c.splice(i, 0, m); return { ...p, etapas: c } }); setArrasto(null) }}
                  className={`space-y-2 rounded-2xl border border-line p-4 ${arrasto === i ? 'opacity-50' : ''}`}>
                  <p className="cursor-grab text-xs font-bold text-terra">Etapa {i + 1} <span className="font-normal text-ink-faint">(arraste ou use as setas)</span></p>
                  <input aria-label={`Título da etapa ${i + 1}`} className="input" placeholder="Título" maxLength={150} value={et.titulo} onChange={(e) => upEt(i, { titulo: e.target.value })} />
                  <textarea aria-label={`Instrução da etapa ${i + 1}`} className="input" rows={3} placeholder="Instrução" maxLength={2000} value={et.instrucao} onChange={(e) => upEt(i, { instrucao: e.target.value })} />
                  <input aria-label="Segundo do vídeo" className="input sm:max-w-xs" inputMode="numeric" placeholder="Segundo do vídeo em que começa" value={et.timestamp} onChange={(e) => upEt(i, { timestamp: e.target.value.replace(/\D/g, '') })} />
                  <UploadImagem rotulo="Imagem da etapa (opcional)" valor={et.imagem} onChange={(v) => upEt(i, { imagem: v })} />
                  <div className="flex gap-1">
                    <button type="button" aria-label={`Subir etapa ${i + 1}`} className={btnIcone} disabled={i === 0} onClick={() => alterar((p) => ({ ...p, etapas: mover(p.etapas, i, -1) }))}><ArrowUp size={14} /></button>
                    <button type="button" aria-label={`Descer etapa ${i + 1}`} className={btnIcone} disabled={i === d.etapas.length - 1} onClick={() => alterar((p) => ({ ...p, etapas: mover(p.etapas, i, 1) }))}><ArrowDown size={14} /></button>
                    <button type="button" aria-label={`Remover etapa ${i + 1}`} className={`${btnIcone} text-alert`} disabled={d.etapas.length === 1} onClick={() => alterar((p) => ({ ...p, etapas: p.etapas.filter((_, j) => j !== i) }))}><Trash2 size={14} /></button>
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
              {d.etapas.map((et, idx) => et.titulo.trim() && (
                <div key={idx} className="space-y-2 rounded-2xl border border-line p-3">
                  <p className="text-sm font-semibold">{idx + 1}. {et.titulo}</p>
                  {et.dicas.map((x, j) => (
                    <div key={j} className="grid gap-2 sm:grid-cols-[130px_1fr_auto]">
                      <select aria-label="Tipo" className="input" value={x.tipo} onChange={(e) => upEt(idx, { dicas: et.dicas.map((y, k) => (k === j ? { ...y, tipo: e.target.value as TipoDica } : y)) })}><option value="DICA">Dica</option><option value="ERRO_COMUM">Erro comum</option></select>
                      <textarea aria-label="Conteúdo da dica" className="input" rows={2} maxLength={1000} placeholder="Conteúdo" value={x.conteudo} onChange={(e) => upEt(idx, { dicas: et.dicas.map((y, k) => (k === j ? { ...y, conteudo: e.target.value } : y)) })} />
                      <button type="button" aria-label="Remover dica" className={`${btnIcone} text-alert`} onClick={() => upEt(idx, { dicas: et.dicas.filter((_, k) => k !== j) })}><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button type="button" className="text-xs font-semibold text-terra" onClick={() => upEt(idx, { dicas: [...et.dicas, { tipo: 'DICA', conteudo: '' }] })}>+ Adicionar dica</button>
                </div>
              ))}
            </div>

            <div className="card space-y-4 p-5">
              <h2 className="text-lg font-bold">Revisão</h2>
              <Resumo titulo="Dados gerais" onEditar={() => ir(0)}><p><b>{g.nome || '—'}</b> · {g.n} porções · {g.min} min · {ENUMS.dificuldade[g.dif as keyof typeof ENUMS.dificuldade]} · {ENUMS.tipo[g.tipo as keyof typeof ENUMS.tipo]}</p></Resumo>
              <Resumo titulo="Ingredientes" onEditar={() => ir(1)}>
                <ul className="list-disc pl-4">{d.itens.filter((i) => i.id).map((i, k) => <li key={k}>{fmtNum(Number(i.qty.replace(',', '.')) || 0)} {ENUMS.unidade[i.unit as keyof typeof ENUMS.unidade]} {porId.get(i.id)?.nome}</li>)}</ul>
              </Resumo>
              <Resumo titulo="Modo de preparo" onEditar={() => ir(2)}><ol className="list-decimal pl-4">{d.etapas.filter((e) => e.titulo.trim()).map((e, k) => <li key={k}>{e.titulo}</li>)}</ol></Resumo>
            </div>
          </section>
        )}

        <div className="flex justify-between gap-3">
          <button className="btn-ghost" disabled={d.passo === 0} onClick={() => ir(d.passo - 1)}>Voltar</button>
          {d.passo < 3 ? <button className="btn-primary" onClick={avancar}>Avançar</button> : <button className="btn-primary" disabled={enviando} onClick={publicar}><Check size={16} /> {enviando ? 'Enviando...' : editId ? 'Salvar alterações' : 'Publicar receita'}</button>}
        </div>
        <p className="text-center text-xs text-ink-faint"><Link to="/receitas" className="underline">Cancelar</Link></p>
      </div>
    </Protegida>
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
