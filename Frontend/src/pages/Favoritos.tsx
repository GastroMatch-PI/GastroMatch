import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, del, type Pagina, type ReceitaResumo } from '../api/client'
import { Aviso } from '../components/Campo'
import Protegida from '../components/Protegida'

export default function Favoritos() {
  const [lista, setLista] = useState<ReceitaResumo[] | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api<Pagina<ReceitaResumo> | ReceitaResumo[]>('/usuarios/me/favoritos')
      .then((d) => setLista(Array.isArray(d) ? d : d.conteudo))
      .catch((e: Error) => setErro(e.message ?? 'Erro ao carregar'))
  }, [])

  const remover = async (id: number) => {
    try {
      await del(`/receitas/${id}/favorito`)
      setLista((l) => l?.filter((r) => r.id !== id) ?? null)
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  return (
    <Protegida>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Minhas receitas favoritas</h1>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {lista === null && !erro && <p className="text-sm text-ink-soft">Carregando...</p>}
        {lista?.length === 0 && (
          <p className="text-sm text-ink-soft">
            Nenhum favorito ainda. <Link to="/" className="text-terra">Explorar receitas</Link>
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista?.map((r) => (
            <article key={r.id} className="card space-y-2 p-4">
              {r.imagem && <img src={r.imagem} alt="" className="h-36 w-full rounded-xl object-cover" />}
              <Link to={`/receita/${r.id}`} className="block font-display text-lg font-bold hover:text-terra">{r.nome}</Link>
              <p className="text-xs text-ink-soft">⏱ {r.tempoPreparo} min · {r.nPorcoes} porções</p>
              <button className="btn-ghost w-full" onClick={() => remover(r.id)}>♥ Remover</button>
            </article>
          ))}
        </div>
      </div>
    </Protegida>
  )
}
