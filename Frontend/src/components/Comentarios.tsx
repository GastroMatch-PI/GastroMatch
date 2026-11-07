import { MoreVertical, Pencil, Star, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { del, get, mensagem, post, put, urlImagem } from '../lib/api'
import type { Comentario, Pagina } from '../lib/apiTipos'
import { dataRelativa, fmtNum } from '../lib/format'
import { useConfirmar, useToast } from './Feedback'
import { Avatar } from './Photo'
import Stars from './Stars'
import { Carregando, ErroApi, EstadoVazio, UploadImagem } from './Ui'

const TAMANHO = 10
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

export default function Comentarios({ receitaId }: { receitaId: number }) {
  const { usuario } = useAuth()
  const loc = useLocation()
  const toast = useToast()
  const confirmar = useConfirmar()
  const [lista, setLista] = useState<Comentario[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<Error | null>(null)
  const [ordem, setOrdem] = useState<'recentes' | 'nota'>('recentes')
  const [texto, setTexto] = useState('')
  const [nota, setNota] = useState(0)
  const [foto, setFoto] = useState<string | undefined>()
  const [enviando, setEnviando] = useState(false)
  const [errosCampo, setErrosCampo] = useState('')
  const [editando, setEditando] = useState<number | null>(null)
  const [textoEd, setTextoEd] = useState('')
  const [menu, setMenu] = useState<number | null>(null)
  const [fotoAberta, setFotoAberta] = useState<string | null>(null)

  const carregar = async (p: number) => {
    setCarregando(true); setErro(null)
    try {
      const pg = await get<Pagina<Comentario>>(`/receitas/${receitaId}/comentarios?pagina=${p}&tamanho=${TAMANHO}`)
      setLista((l) => (p === 0 ? pg.conteudo : [...l, ...pg.conteudo]))
      setTotal(pg.totalElementos)
      setPagina(p)
    } catch (e) {
      setErro(e as Error)
    } finally {
      setCarregando(false)
    }
  }
  useEffect(() => { void carregar(0) }, [receitaId]) // eslint-disable-line react-hooks/exhaustive-deps

  const ordenada = [...lista].sort((a, b) => (ordem === 'nota' ? (b.nota ?? 0) - (a.nota ?? 0) : 0))
  const notas = lista.filter((c) => (c.nota ?? 0) > 0)
  const media = notas.length ? notas.reduce((a, c) => a + (c.nota ?? 0), 0) / notas.length : 0
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, q: notas.filter((c) => Math.round(c.nota ?? 0) === n).length }))
  const temMais = lista.length < total

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true); setErrosCampo('')
    try {
      const c = await post<Comentario>(`/receitas/${receitaId}/comentarios`, { texto: texto.trim(), nota: nota || undefined, foto })
      setLista((l) => [c, ...l]); setTotal((t) => t + 1)
      setTexto(''); setNota(0); setFoto(undefined)
      toast.sucesso('Comentário publicado.')
    } catch (er) {
      setErrosCampo(mensagem(er))
    } finally {
      setEnviando(false)
    }
  }

  const salvarEdicao = async (c: Comentario) => {
    if (!textoEd.trim()) return
    try {
      const novo = await put<Comentario>(`/comentarios/${c.id}`, { texto: textoEd.trim(), nota: c.nota ?? undefined, foto: c.foto ?? undefined })
      setLista((l) => l.map((x) => (x.id === c.id ? novo : x)))
      setEditando(null)
      toast.sucesso('Comentário atualizado.')
    } catch (er) {
      toast.erro(mensagem(er)) // mantém o texto digitado
    }
  }

  const excluir = async (c: Comentario) => {
    setMenu(null)
    if (!(await confirmar({ titulo: 'Excluir comentário?', texto: 'Essa ação não pode ser desfeita.', confirmar: 'Excluir', perigo: true }))) return
    try {
      await del(`/comentarios/${c.id}`)
      setLista((l) => l.filter((x) => x.id !== c.id)); setTotal((t) => t - 1)
      toast.sucesso('Comentário excluído.')
    } catch (er) {
      toast.erro(mensagem(er))
    }
  }

  return (
    <section className="card space-y-5 p-5 md:p-6" aria-labelledby="coment-t">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="coment-t" className="text-2xl font-bold">Comentários e avaliações</h2>
        {lista.length > 1 && (
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            Ordenar
            <select className="input !w-auto !py-1.5" value={ordem} onChange={(e) => setOrdem(e.target.value as 'recentes' | 'nota')}>
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
            <p className="text-xs text-ink-faint">{notas.length} {notas.length === 1 ? 'avaliação' : 'avaliações'}{temMais ? ' (carregadas)' : ''}</p>
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
          <UploadImagem rotulo="Foto do prato (opcional)" valor={foto} onChange={setFoto} />
          {errosCampo && <p role="alert" className="text-xs text-alert">{errosCampo}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <EntradaEstrelas valor={nota} onChange={setNota} />
            <button className="btn-primary" disabled={!texto.trim() || enviando}>{enviando ? 'Publicando...' : 'Publicar'}</button>
          </div>
        </form>
      ) : (
        <p className="rounded-2xl bg-peach p-4 text-sm">
          <Link to="/login" state={{ from: loc.pathname }} className="font-bold text-terra">Entre</Link> ou <Link to="/cadastro" className="font-bold text-terra">crie uma conta</Link> para comentar e avaliar.
        </p>
      )}

      {erro ? (
        <ErroApi erro={erro} onTentar={() => carregar(0)} />
      ) : carregando && lista.length === 0 ? (
        <Carregando texto="Carregando comentários" />
      ) : lista.length === 0 ? (
        <EstadoVazio titulo="Seja o primeiro a comentar" texto="Conte como ficou a sua versão desta receita." />
      ) : (
        <ul className="space-y-3">
          {ordenada.map((c) => {
            const meu = usuario?.id === c.idUsuario
            return (
              <li key={c.id} className="rounded-2xl border border-line bg-cream p-4 text-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9" />
                  <div className="flex-1 text-xs">
                    <b className="text-sm">{c.username}</b>
                    <p className="text-ink-faint">{dataRelativa(c.criadoEm)}{c.atualizadoEm && c.atualizadoEm !== c.criadoEm ? ' · editado' : ''}</p>
                  </div>
                  {(c.nota ?? 0) > 0 && <Stars value={Math.round(c.nota ?? 0)} />}
                  {meu && (
                    <div className="relative">
                      <button aria-label="Ações do comentário" aria-expanded={menu === c.id} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-peach" onClick={() => setMenu(menu === c.id ? null : c.id)}><MoreVertical size={16} /></button>
                      {menu === c.id && (
                        <div role="menu" className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-line bg-surface p-1 shadow-lift">
                          <button role="menuitem" className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-peach" onClick={() => { setEditando(c.id); setTextoEd(c.texto); setMenu(null) }}><Pencil size={14} /> Editar</button>
                          <button role="menuitem" className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-alert hover:bg-peach" onClick={() => excluir(c)}><Trash2 size={14} /> Excluir</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {editando === c.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea aria-label="Editar comentário" className="input h-20" maxLength={MAX} value={textoEd} onChange={(e) => setTextoEd(e.target.value)} />
                    <div className="flex gap-2">
                      <button className="btn-primary !py-1.5 text-xs" onClick={() => salvarEdicao(c)}>Salvar</button>
                      <button className="btn-ghost !py-1.5 text-xs" onClick={() => setEditando(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap break-words text-ink-soft">{c.texto}</p>
                )}
                {c.foto && (
                  <button className="mt-3 block cursor-zoom-in overflow-hidden rounded-xl" onClick={() => setFotoAberta(urlImagem(c.foto) ?? null)} aria-label="Ampliar foto do comentário">
                    <img src={urlImagem(c.foto)} alt={`Foto enviada por ${c.username}`} loading="lazy" className="h-28 w-28 object-cover" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {temMais && !erro && <button className="btn-ghost w-full" disabled={carregando} onClick={() => carregar(pagina + 1)}>{carregando ? 'Carregando...' : `Carregar mais (${total - lista.length})`}</button>}

      {fotoAberta && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={() => setFotoAberta(null)} onKeyDown={(e) => e.key === 'Escape' && setFotoAberta(null)}>
          <button autoFocus aria-label="Fechar foto" className="absolute right-4 top-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-surface"><X size={18} /></button>
          <img src={fotoAberta} alt="Foto ampliada do comentário" className="max-h-full max-w-full rounded-2xl" />
        </div>
      )}
    </section>
  )
}
