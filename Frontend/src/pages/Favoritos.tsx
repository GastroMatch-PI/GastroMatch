import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import Protegida from '../components/Protegida'
import RecipeCard from '../components/RecipeCard'
import { Carregando, ErroApi, EstadoVazio, Paginacao } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { qs } from '../lib/api'
import type { Pagina, ReceitaResumo } from '../lib/apiTipos'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'

const TAMANHO = 12

function Lista() {
  const { favoritos } = useAuth()
  const [pagina, setPagina] = useState(1)
  const { dados, carregando, erro, lento, recarregar } = useApi<Pagina<ReceitaResumo>>(`/usuarios/me/favoritos${qs({ pagina: pagina - 1, tamanho: TAMANHO })}`)

  // ao desfavoritar um card, a lista é buscada de novo (a receita some)
  const [qtd, setQtd] = useState(favoritos.size)
  useEffect(() => { if (favoritos.size !== qtd) { setQtd(favoritos.size); recarregar() } }, [favoritos.size]) // eslint-disable-line react-hooks/exhaustive-deps

  if (erro) return <ErroApi erro={erro} onTentar={recarregar} />
  if (!dados) return <Carregando lento={lento} texto="Carregando favoritos" />
  return (
    <>
      <p className="mt-1 text-sm text-ink-soft" role="status">{dados.totalElementos} {dados.totalElementos === 1 ? 'receita salva' : 'receitas salvas'}</p>
      {dados.conteudo.length === 0 ? (
        <EstadoVazio titulo="Nenhum favorito ainda" texto="Toque no coração de uma receita para guardá-la aqui." acao={{ to: '/receitas', rotulo: 'Explorar receitas' }} />
      ) : (
        <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${carregando ? 'opacity-60' : ''}`}>{dados.conteudo.map((r) => <RecipeCard key={r.id} receita={r} />)}</div>
      )}
      <Paginacao pagina={pagina} total={dados.totalPaginas} onMudar={setPagina} />
    </>
  )
}

export default function Favoritos() {
  useSeo({ titulo: 'Meus favoritos' })
  return (
    <Protegida>
      <div className="space-y-6">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold"><Heart className="fill-terra text-terra" /> Meus favoritos</h1>
        <Lista />
      </div>
    </Protegida>
  )
}
