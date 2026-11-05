import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api, ENUMS, post, type Ingrediente, type Pagina } from '../api/client'
import { Aviso, Campo, Opcoes } from '../components/Campo'
import Protegida from '../components/Protegida'

type Item = { idIngrediente: string; quantidade: string; unidadeMedida: string }
type Etapa = { titulo: string; instrucao: string; timestampVideo: string; imagem: string }

export default function PublicarReceita() {
  const [f, setF] = useState<Record<string, string>>({ nPorcoes: '4', dificuldade: 'FACIL', tipo: 'ALMOCO', tempoPreparo: '30' })
  const [itens, setItens] = useState<Item[]>([{ idIngrediente: '', quantidade: '', unidadeMedida: 'G' }])
  const [etapas, setEtapas] = useState<Etapa[]>([{ titulo: '', instrucao: '', timestampVideo: '', imagem: '' }])
  const [catalogo, setCatalogo] = useState<Ingrediente[]>([])
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [novoId, setNovoId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    const t = setTimeout(() => {
      api<Pagina<Ingrediente> | Ingrediente[]>(`/ingredientes?nome=${encodeURIComponent(busca)}`)
        .then((d) => setCatalogo(Array.isArray(d) ? d : d.conteudo))
        .catch(() => setCatalogo([]))
    }, 300)
    return () => clearTimeout(t)
  }, [busca])

  const upItem = (i: number, k: keyof Item, v: string) => setItens(itens.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const upEtapa = (i: number, k: keyof Etapa, v: string) => setEtapas(etapas.map((x, j) => (j === i ? { ...x, [k]: v } : x)))

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setErros({}); setBusy(true)
    try {
      const r = await post<{ id: number }>('/receitas', {
        nome: f.nome, descricao: f.descricao || null, imagem: f.imagem || null, videoUrl: f.videoUrl || null,
        nPorcoes: Number(f.nPorcoes), dificuldade: f.dificuldade, tipo: f.tipo,
        metodoPreparo: f.metodoPreparo || null, ocasiao: f.ocasiao || null, perfil: f.perfil || null,
        tempoPreparo: Number(f.tempoPreparo),
        ingredientes: itens.filter((x) => x.idIngrediente).map((x) => ({
          idIngrediente: Number(x.idIngrediente), quantidade: Number(x.quantidade), unidadeMedida: x.unidadeMedida,
        })),
      })
      for (const [i, et] of etapas.filter((x) => x.titulo && x.instrucao).entries()) {
        await post(`/receitas/${r.id}/etapas`, {
          ordem: i + 1, titulo: et.titulo, instrucao: et.instrucao,
          timestampVideo: et.timestampVideo ? Number(et.timestampVideo) : null, imagem: et.imagem || null,
        })
      }
      setNovoId(r.id)
    } catch (x) {
      if (x instanceof ApiError) {
        setErros(x.erros ?? {})
        setErro(x.status === 403 ? 'Apenas chefs podem publicar receitas. Crie seu perfil de chef.' : x.message)
      } else setErro('Falha de conexão.')
    } finally { setBusy(false) }
  }

  return (
    <Protegida>
      <form onSubmit={enviar} className="mx-auto max-w-3xl space-y-5">
        <h1 className="text-2xl font-bold">Publicar receita</h1>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {novoId && (
          <Aviso tipo="ok">Receita publicada. <Link className="underline" to={`/receita/${novoId}`}>Ver receita</Link></Aviso>
        )}
        <section className="card grid gap-3 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Campo label="Nome" erro={erros.nome}><input className="input" required maxLength={150} onChange={set('nome')} /></Campo></div>
          <div className="sm:col-span-2"><Campo label="Descrição" erro={erros.descricao}><textarea className="input" rows={3} maxLength={1000} onChange={set('descricao')} /></Campo></div>
          <Campo label="Link da imagem (http/https)" erro={erros.imagem}><input className="input" onChange={set('imagem')} /></Campo>
          <Campo label="Link do vídeo (YouTube)" erro={erros.videoUrl}><input className="input" onChange={set('videoUrl')} /></Campo>
          <Campo label="Porções" erro={erros.nPorcoes}><input className="input" type="number" min={1} required value={f.nPorcoes} onChange={set('nPorcoes')} /></Campo>
          <Campo label="Tempo (min)" erro={erros.tempoPreparo}><input className="input" type="number" min={1} required value={f.tempoPreparo} onChange={set('tempoPreparo')} /></Campo>
          <Campo label="Dificuldade"><select className="input" value={f.dificuldade} onChange={set('dificuldade')}><Opcoes mapa={ENUMS.dificuldade} /></select></Campo>
          <Campo label="Refeição"><select className="input" value={f.tipo} onChange={set('tipo')}><Opcoes mapa={ENUMS.tipo} /></select></Campo>
          <Campo label="Método"><select className="input" defaultValue="" onChange={set('metodoPreparo')}><option value="">—</option><Opcoes mapa={ENUMS.metodo} /></select></Campo>
          <Campo label="Ocasião"><select className="input" defaultValue="" onChange={set('ocasiao')}><option value="">—</option><Opcoes mapa={ENUMS.ocasiao} /></select></Campo>
          <Campo label="Perfil alimentar"><select className="input" defaultValue="" onChange={set('perfil')}><option value="">—</option><Opcoes mapa={ENUMS.perfil} /></select></Campo>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Ingredientes</h2>
          <input className="input" placeholder="Filtrar catálogo..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          {itens.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_110px_auto] gap-2">
              <select className="input" required value={it.idIngrediente} onChange={(e) => upItem(i, 'idIngrediente', e.target.value)}>
                <option value="">Ingrediente</option>
                {catalogo.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <input className="input" type="number" step="any" min={0.01} required placeholder="Qtd" value={it.quantidade} onChange={(e) => upItem(i, 'quantidade', e.target.value)} />
              <select className="input" value={it.unidadeMedida} onChange={(e) => upItem(i, 'unidadeMedida', e.target.value)}><Opcoes mapa={ENUMS.unidade} /></select>
              <button type="button" className="btn-ghost" onClick={() => setItens(itens.filter((_, j) => j !== i))} disabled={itens.length === 1}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => setItens([...itens, { idIngrediente: '', quantidade: '', unidadeMedida: 'G' }])}>+ Ingrediente</button>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Modo de preparo</h2>
          {etapas.map((et, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-line p-3">
              <p className="text-xs font-semibold text-terra">Etapa {i + 1}</p>
              <input className="input" placeholder="Título" maxLength={150} value={et.titulo} onChange={(e) => upEtapa(i, 'titulo', e.target.value)} />
              <textarea className="input" rows={3} placeholder="Instrução" maxLength={2000} value={et.instrucao} onChange={(e) => upEtapa(i, 'instrucao', e.target.value)} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="input" type="number" min={0} placeholder="Segundo do vídeo" value={et.timestampVideo} onChange={(e) => upEtapa(i, 'timestampVideo', e.target.value)} />
                <input className="input" placeholder="Link da imagem" value={et.imagem} onChange={(e) => upEtapa(i, 'imagem', e.target.value)} />
              </div>
              <button type="button" className="text-xs text-alert" onClick={() => setEtapas(etapas.filter((_, j) => j !== i))} disabled={etapas.length === 1}>Remover etapa</button>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => setEtapas([...etapas, { titulo: '', instrucao: '', timestampVideo: '', imagem: '' }])}>+ Etapa</button>
        </section>

        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Publicando...' : 'Publicar receita'}</button>
      </form>
    </Protegida>
  )
}
