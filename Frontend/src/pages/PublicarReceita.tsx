import { X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Opcoes } from '../components/Campo'
import Protegida from '../components/Protegida'
import { useAuth } from '../context/Auth'
import type { Recipe } from '../data/data'
import { catalogo, ENUMS } from '../data/enums'
import { useLocalState } from '../hooks/useLocalState'
import type { EtapaR } from '../lib/tipos'

type Item = { cat: string; qty: string; unit: string }
type Et = { title: string; text: string; videoAt: string; image: string }

const ytOk = /^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]{11}([?&#]\S*)?$/

export default function PublicarReceita() {
  const { usuario, meusPerfis } = useAuth()
  const [, setReceitas] = useLocalState<Recipe[]>('gm-receitas', [])
  const [f, setF] = useState<Record<string, string>>({ n: '4', dif: 'FACIL', tipo: 'ALMOCO', min: '30' })
  const [itens, setItens] = useState<Item[]>([{ cat: '', qty: '', unit: 'G' }])
  const [etapas, setEtapas] = useState<Et[]>([{ title: '', text: '', videoAt: '', image: '' }])
  const [erro, setErro] = useState('')
  const [novoId, setNovoId] = useState('')
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value })
  const upItem = (i: number, k: keyof Item, v: string) => setItens(itens.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const upEt = (i: number, k: keyof Et, v: string) => setEtapas(etapas.map((x, j) => (j === i ? { ...x, [k]: v } : x)))

  const chef = meusPerfis.find((p) => p.papel === 'CHEF')
  if (!chef && usuario)
    return (
      <Protegida>
        <div className="card mx-auto max-w-md space-y-3 p-6 text-center">
          <h1 className="text-xl font-bold">Só chefs publicam receitas</h1>
          <Link to="/onboarding" className="btn-primary">Criar perfil de chef</Link>
        </div>
      </Protegida>
    )

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (f.img && !/^https?:\/\/\S+$/.test(f.img)) return setErro('A imagem deve ser um link http ou https.')
    if (f.video && !ytOk.test(f.video)) return setErro('O vídeo deve ser um link do YouTube.')
    const ing = itens.filter((x) => x.cat).map((x) => ({
      cat: x.cat, name: catalogo.find((c) => c.id === x.cat)!.nome, qty: Number(x.qty), unit: x.unit,
    }))
    if (ing.length === 0 || ing.some((x) => !(x.qty > 0))) return setErro('Informe ao menos um ingrediente com quantidade maior que zero.')
    const steps: EtapaR[] = etapas.filter((x) => x.title && x.text).map((x) => ({
      title: x.title, text: x.text, videoAt: x.videoAt ? Number(x.videoAt) : undefined, image: x.image || undefined,
    }))
    const id = `u${Date.now()}`
    const r: Recipe = {
      id, title: f.nome, emoji: '🍽️', seed: Date.now() % 5, minutes: Number(f.min),
      difficulty: ENUMS.dificuldade[f.dif as keyof typeof ENUMS.dificuldade] as Recipe['difficulty'],
      servings: Number(f.n), author: `Chef ${usuario!.username}`, role: 'Chef',
      collections: [ENUMS.tipo[f.tipo as keyof typeof ENUMS.tipo], ...(f.perfil ? [ENUMS.perfil[f.perfil as keyof typeof ENUMS.perfil]] : [])],
      ingredients: ing.map((x) => x.name), nutrition: 'Estimativa calculada pelos ingredientes',
      image: f.img || undefined, video: f.video || undefined, description: f.desc || undefined,
      detail: { ing, steps }, owner: usuario!.id,
    }
    setReceitas((l) => [r, ...l])
    setNovoId(id)
  }

  return (
    <Protegida>
      <form onSubmit={enviar} className="mx-auto max-w-3xl space-y-5">
        <h1 className="text-2xl font-bold">Publicar receita</h1>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {novoId && <Aviso tipo="ok">Receita publicada. <Link className="underline" to={`/receita/${novoId}`}>Ver receita</Link></Aviso>}
        <section className="card grid gap-3 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Campo label="Nome"><input className="input" required maxLength={150} onChange={set('nome')} /></Campo></div>
          <div className="sm:col-span-2"><Campo label="Descrição"><textarea className="input" rows={3} maxLength={1000} onChange={set('desc')} /></Campo></div>
          <Campo label="Link da imagem (http/https)"><input className="input" maxLength={500} onChange={set('img')} /></Campo>
          <Campo label="Link do vídeo (YouTube)"><input className="input" maxLength={500} onChange={set('video')} /></Campo>
          <Campo label="Porções"><input className="input" type="number" min={1} required value={f.n} onChange={set('n')} /></Campo>
          <Campo label="Tempo (min)"><input className="input" type="number" min={1} required value={f.min} onChange={set('min')} /></Campo>
          <Campo label="Dificuldade"><select className="input" value={f.dif} onChange={set('dif')}><Opcoes mapa={ENUMS.dificuldade} /></select></Campo>
          <Campo label="Refeição"><select className="input" value={f.tipo} onChange={set('tipo')}><Opcoes mapa={ENUMS.tipo} /></select></Campo>
          <Campo label="Método"><select className="input" defaultValue="" onChange={set('metodo')}><option value="">—</option><Opcoes mapa={ENUMS.metodo} /></select></Campo>
          <Campo label="Ocasião"><select className="input" defaultValue="" onChange={set('ocasiao')}><option value="">—</option><Opcoes mapa={ENUMS.ocasiao} /></select></Campo>
          <Campo label="Perfil alimentar"><select className="input" defaultValue="" onChange={set('perfil')}><option value="">—</option><Opcoes mapa={ENUMS.perfil} /></select></Campo>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Ingredientes</h2>
          {itens.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_110px_auto] gap-2">
              <select className="input" required value={it.cat} onChange={(e) => upItem(i, 'cat', e.target.value)}>
                <option value="">Ingrediente</option>
                {catalogo.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <input className="input" type="number" step="any" min={0.01} required placeholder="Qtd" value={it.qty} onChange={(e) => upItem(i, 'qty', e.target.value)} />
              <select className="input" value={it.unit} onChange={(e) => upItem(i, 'unit', e.target.value)}><Opcoes mapa={ENUMS.unidade} /></select>
              <button type="button" className="btn-ghost" onClick={() => setItens(itens.filter((_, j) => j !== i))} disabled={itens.length === 1} aria-label="Remover ingrediente"><X size={15} /></button>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => setItens([...itens, { cat: '', qty: '', unit: 'G' }])}>+ Ingrediente</button>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Modo de preparo</h2>
          {etapas.map((et, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-line p-3">
              <p className="text-xs font-semibold text-terra">Etapa {i + 1}</p>
              <input className="input" placeholder="Título" maxLength={150} value={et.title} onChange={(e) => upEt(i, 'title', e.target.value)} />
              <textarea className="input" rows={3} placeholder="Instrução" maxLength={2000} value={et.text} onChange={(e) => upEt(i, 'text', e.target.value)} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="input" type="number" min={0} placeholder="Segundo do vídeo" value={et.videoAt} onChange={(e) => upEt(i, 'videoAt', e.target.value)} />
                <input className="input" placeholder="Link da imagem" value={et.image} onChange={(e) => upEt(i, 'image', e.target.value)} />
              </div>
              <button type="button" className="text-xs text-alert" onClick={() => setEtapas(etapas.filter((_, j) => j !== i))} disabled={etapas.length === 1}>Remover etapa</button>
            </div>
          ))}
          <button type="button" className="btn-ghost" onClick={() => setEtapas([...etapas, { title: '', text: '', videoAt: '', image: '' }])}>+ Etapa</button>
        </section>

        <button className="btn-primary w-full">Publicar receita</button>
      </form>
    </Protegida>
  )
}
