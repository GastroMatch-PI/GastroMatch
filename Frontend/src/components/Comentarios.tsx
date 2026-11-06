import { Flag, MoreVertical, Pencil, Star, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useLocalState } from '../hooks/useLocalState'
import { dataRelativa, fmtNum } from '../lib/format'
import type { Comentario, Denuncia } from '../lib/tipos'
import { Avatar } from './Photo'
import Stars from './Stars'
import { useConfirmar, useToast, Modal } from './Feedback'
import { EstadoVazio, Skeleton, UploadImagem } from './Ui'

const POR_PAGINA = 5
const MAX = 2000

// Nota em estrelas acessível por teclado (grupo de rádios).
function EntradaEstrelas({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Sua nota" className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="cursor-pointer p-1 has-[:focus-visible]:rounded-md has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-terra">
          <input type="radio" name="nota" value={n} checked={valor === n} onChange={() => onChange(n)} className="sr-only" aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`} />
          <Star size={22} className={n <= valor ? 'fill-gold text-gold' : 'text-line'} />
        </label>
      ))}
      {valor > 0 && <button type="button" className="ml-2 text-xs text-ink-faint underline" onClick={() => onChange(0)}>limpar</button>}
    </div>
  )
}

export default function Comentarios({ receitaId, titulo }: { receitaId: string; titulo: string }) {
  const { usuario } = useAuth()
  const loc = useLocation()
  const toast = useToast()
  const confirmar = useConfirmar()
  const [todos, setTodos] = useLocalState<Record<string, Comentario[]>>('gm-comentarios', {})
  const [, setDenuncias] = useLocalState<Denuncia[]>('gm-denuncias', [])
  const [carregando, setCarregando] = useState(true)
  const [ordem, setOrdem] = useState<'recentes' | 'nota'>('recentes')
  const [visiveis, setVisiveis] = useState(POR_PAGINA)
  const [texto, setTexto] = useState('')
  const [nota, setNota] = useState(0)
  const [foto, setFoto] = useState<string | undefined>()
  const [editando, setEditando] = useState<number | null>(null)
  const [textoEd, setTextoEd] = useState('')
  const [menu, setMenu] = useState<number | null>(null)
  const [foto_aberta, setFotoAberta] = useState<string | null>(null)
  const [denunciando, setDenunciando] = useState<Comentario | null>(null)
  const [motivo, setMotivo] = useState('Conteúdo ofensivo')

  useEffect(() => { const t = setTimeout(() => setCarregando(false), 250); return () => clearTimeout(t) }, [receitaId])

  const lista = todos[receitaId] ?? []
  const ts = (c: Comentario) => (typeof c.quando === 'number' ? c.quando : Date.parse(c.quando) || 0)
  const ordenada = [...lista].sort((a, b) => (ordem === 'nota' ? b.nota - a.nota || ts(b) - ts(a) : ts(b) - ts(a)))
  const notas = lista.filter((c) => c.nota > 0)
  const media = notas.length ? notas.reduce((a, c) => a + c.nota, 0) / notas.length : 0
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, q: notas.filter((c) => c.nota === n).length }))

  const publicar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario || !texto.trim()) return
    const c: Comentario = { id: Date.now(), autorId: usuario.id, autor: usuario.username, texto: texto.trim(), nota, quando: Date.now(), foto }
    setTodos((m) => ({ ...m, [receitaId]: [c, ...(m[receitaId] ?? [])] }))
    setTexto(''); setNota(0); setFoto(undefined)
    toast.sucesso('Comentário publicado.')
  }

  const salvarEdicao = (id: number) => {
    if (!textoEd.trim()) return
    setTodos((m) => ({ ...m, [receitaId]: (m[receitaId] ?? []).map((c) => (c.id === id ? { ...c, texto: textoEd.trim(), editado: true } : c)) }))
    setEditando(null)
    toast.sucesso('Comentário atualizado.')
  }

  const excluir = async (c: Comentario) => {
    setMenu(null)
    if (await confirmar({ titulo: 'Excluir comentário?', texto: 'Essa ação não pode ser desfeita.', confirmar: 'Excluir', perigo: true })) {
      setTodos((m) => ({ ...m, [receitaId]: (m[receitaId] ?? []).filter((x) => x.id !== c.id) }))
      toast.sucesso('Comentário excluído.')
    }
  }

  const denunciar = () => {
    if (!usuario || !denunciando) return
    setDenuncias((l) => [...l, { id: Date.now(), receita: titulo, comentario: denunciando.id, motivo, autor: usuario.username, quando: new Date().toLocaleDateString('pt-BR'), resolvida: false }])
    setDenunciando(null)
    toast.sucesso('Denúncia enviada para análise manual.')
  }

  return (
    <section className="card space-y-5 p-5 md:p-6" aria-labelledby="coment-t">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="coment-t" className="text-2xl font-bold">Comentários e avaliações</h2>
        {lista.length > 1 && (
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            Ordenar
            <select className="input !w-auto !py-1.5" value={ordem} onChange={(e) => { setOrdem(e.target.value as 'recentes' | 'nota'); setVisiveis(POR_PAGINA) }}>
              <option value="recentes">Mais recentes</option>
              <option value="nota">Melhor nota</option>
            </select>
          </label>
        )}
      </div>

      {notas.length > 0 && (
        <div className="grid gap-4 rounded-2xl bg-peach p-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="text-center sm:px-4">
            <p className="font-display text-4xl font-extrabold">{fmtNum(media)}</p>
            <Stars value={Math.round(media)} />
            <p className="text-xs text-ink-faint">{notas.length} {notas.length === 1 ? 'avaliação' : 'avaliações'}</p>
          </div>
          <ul className="space-y-1" aria-label="Distribuição das notas">
            {dist.map(({ n, q }) => (
              <li key={n} className="flex items-center gap-2 text-xs">
                <span className="w-8">{n} ★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-line"><span className="block h-full bg-terra" style={{ width: `${(q / notas.length) * 100}%` }} /></span>
                <span className="w-6 text-right text-ink-faint">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {usuario ? (
        <form className="space-y-3" onSubmit={publicar}>
          <div>
            <label htmlFor="novo-coment" className="mb-1 block text-xs font-semibold text-ink-soft">Seu comentário</label>
            <textarea id="novo-coment" className="input h-24" maxLength={MAX} placeholder="Você fez essa receita? Conte como ficou..." value={texto} onChange={(e) => setTexto(e.target.value)} aria-describedby="coment-cont" />
            <p id="coment-cont" className="mt-1 text-right text-[11px] text-ink-faint">{texto.length} / {MAX}</p>
          </div>
          <UploadImagem rotulo="Foto do prato (opcional)" valor={foto} onChange={setFoto} max={900} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <EntradaEstrelas valor={nota} onChange={setNota} />
            <button className="btn-primary" disabled={!texto.trim()}>Publicar</button>
          </div>
        </form>
      ) : (
        <p className="rounded-2xl bg-peach p-4 text-sm">
          <Link to="/login" state={{ from: loc.pathname }} className="font-bold text-terra">Entre</Link> ou <Link to="/cadastro" className="font-bold text-terra">crie uma conta</Link> para comentar e avaliar.
        </p>
      )}

      {carregando ? (
        <div className="space-y-3" aria-busy="true"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : lista.length === 0 ? (
        <EstadoVazio titulo="Seja o primeiro a comentar" texto="Conte como ficou a sua versão desta receita." />
      ) : (
        <ul className="space-y-3">
          {ordenada.slice(0, visiveis).map((c) => {
            const meu = !!usuario && c.autorId === usuario.id
            return (
              <li key={c.id} className="rounded-2xl border border-line bg-cream p-4 text-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9" />
                  <div className="flex-1 text-xs">
                    <b className="text-sm">{c.autor}</b>
                    <p className="text-ink-faint">{dataRelativa(c.quando)}{c.editado ? ' · editado' : ''}</p>
                  </div>
                  {c.nota > 0 && <Stars value={c.nota} />}
                  <div className="relative">
                    <button aria-label="Ações do comentário" aria-expanded={menu === c.id} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-peach" onClick={() => setMenu(menu === c.id ? null : c.id)}><MoreVertical size={16} /></button>
                    {menu === c.id && (
                      <div role="menu" className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-line bg-surface p-1 shadow-lift">
                        {meu && <button role="menuitem" className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-peach" onClick={() => { setEditando(c.id); setTextoEd(c.texto); setMenu(null) }}><Pencil size={14} /> Editar</button>}
                        {meu && <button role="menuitem" className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-alert hover:bg-peach" onClick={() => excluir(c)}><Trash2 size={14} /> Excluir</button>}
                        {usuario && !meu && <button role="menuitem" className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-peach" onClick={() => { setDenunciando(c); setMenu(null) }}><Flag size={14} /> Denunciar</button>}
                        {!usuario && <p className="px-3 py-2 text-xs text-ink-faint">Entre para interagir.</p>}
                      </div>
                    )}
                  </div>
                </div>
                {editando === c.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea aria-label="Editar comentário" className="input h-20" maxLength={MAX} value={textoEd} onChange={(e) => setTextoEd(e.target.value)} />
                    <div className="flex gap-2">
                      <button className="btn-primary !py-1.5 text-xs" onClick={() => salvarEdicao(c.id)}>Salvar</button>
                      <button className="btn-ghost !py-1.5 text-xs" onClick={() => setEditando(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap break-words text-ink-soft">{c.texto}</p>
                )}
                {c.foto && (
                  <button className="mt-3 block cursor-zoom-in overflow-hidden rounded-xl" onClick={() => setFotoAberta(c.foto!)} aria-label="Ampliar foto do comentário">
                    <img src={c.foto} alt={`Foto enviada por ${c.autor}`} loading="lazy" className="h-28 w-28 object-cover" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {ordenada.length > visiveis && <button className="btn-ghost w-full" onClick={() => setVisiveis(visiveis + POR_PAGINA)}>Carregar mais ({ordenada.length - visiveis})</button>}

      <Modal titulo="Denunciar comentário" aberto={!!denunciando} onFechar={() => setDenunciando(null)}>
        <label className="block text-xs font-semibold text-ink-soft">Motivo
          <select className="input mt-1" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option>Conteúdo ofensivo</option><option>Spam</option><option>Informação falsa</option><option>Outro</option>
          </select>
        </label>
        <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setDenunciando(null)}>Cancelar</button><button className="btn-primary" onClick={denunciar}>Enviar denúncia</button></div>
      </Modal>

      {foto_aberta && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={() => setFotoAberta(null)} onKeyDown={(e) => e.key === 'Escape' && setFotoAberta(null)}>
          <button autoFocus aria-label="Fechar foto" className="absolute right-4 top-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-surface"><X size={18} /></button>
          <img src={foto_aberta} alt="Foto ampliada do comentário" className="max-h-full max-w-full rounded-2xl" />
        </div>
      )}
    </section>
  )
}
