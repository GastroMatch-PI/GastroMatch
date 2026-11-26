import { BadgeCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CardRestaurante from '../components/CardRestaurante'
import { Avatar } from '../components/Photo'
import RecipeCard from '../components/RecipeCard'
import { Carregando, ErroApi, EstadoVazio, Paginacao } from '../components/Ui'
import { ENUMS } from '../data/enums'
import { urlImagem } from '../lib/api'
import type { ChefPerfil, Pagina, ReceitaResumo, RestauranteDetalhe } from '../lib/apiTipos'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'

const TAMANHO = 12

export default function Chef() {
  const { id = '' } = useParams()
  const [pagina, setPagina] = useState(1)
  const caminho = /^\d+$/.test(id) ? `/chefs/${id}` : null
  const { dados: chef, erro, lento, recarregar } = useApi<ChefPerfil>(caminho)
  const restaurante = useApi<RestauranteDetalhe>(
    chef?.idRestaurante ? `/restaurantes/${chef.idRestaurante}` : null,
  )
  const receitas = useApi<Pagina<ReceitaResumo>>(
    chef ? `/receitas?chefId=${chef.id}&pagina=${pagina - 1}&tamanho=${TAMANHO}` : null,
  )

  useSeo({ titulo: chef ? `Chef ${chef.username}` : 'Chef', descricao: chef?.bio ?? undefined })

  if (!/^\d+$/.test(id)) return <ErroApi erro={{ message: 'Chef inválido.', status: 404 }} />
  if (erro) return <ErroApi erro={erro} onTentar={recarregar} />
  if (!chef) return <Carregando lento={lento} texto="Carregando chef" />

  const fotoUrl = urlImagem(chef.foto)

  return (
    <div className="space-y-8">
      <header className="card grid gap-5 p-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center md:p-8">
        {fotoUrl ? (
          <img src={fotoUrl} alt={`Foto de ${chef.username}`} className="mx-auto h-40 w-40 rounded-full border border-line object-cover sm:mx-0" />
        ) : (
          <Avatar className="mx-auto h-40 w-40 border border-line sm:mx-0" />
        )}
        <div className="min-w-0 space-y-2 text-center sm:text-left">
          <h1 className="break-words font-display text-3xl font-extrabold">{chef.username}</h1>
          <p className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2.5 py-1 text-xs font-semibold text-leaf">
            <BadgeCheck size={13} /> Chef
            {chef.especializacao && ` · ${ENUMS.especializacao[chef.especializacao]}`}
          </p>
          {chef.bio && <p className="max-w-2xl whitespace-pre-wrap text-sm leading-7 text-ink-soft">{chef.bio}</p>}
        </div>
      </header>

      {chef.idRestaurante && (
        <section className="space-y-4" aria-labelledby="restaurante-chef">
          <h2 id="restaurante-chef" className="text-2xl font-bold">Restaurante</h2>
          {restaurante.erro ? (
            <ErroApi erro={restaurante.erro} onTentar={restaurante.recarregar} />
          ) : !restaurante.dados ? (
            <Carregando lento={restaurante.lento} texto="Carregando restaurante" />
          ) : (
            <CardRestaurante restaurante={restaurante.dados} />
          )}
        </section>
      )}

      <section className="space-y-4" aria-labelledby="receitas-chef">
        <div>
          <h2 id="receitas-chef" className="text-2xl font-bold">Receitas de {chef.username}</h2>
          <p className="mt-1 text-sm text-ink-soft">Receitas publicadas por este chef.</p>
        </div>
        {receitas.erro ? (
          <ErroApi erro={receitas.erro} onTentar={receitas.recarregar} />
        ) : !receitas.dados ? (
          <Carregando lento={receitas.lento} texto="Carregando receitas" />
        ) : receitas.dados.conteudo.length === 0 ? (
          <EstadoVazio titulo="Este chef ainda não publicou receitas" acao={{ to: '/receitas', rotulo: 'Explorar receitas' }} />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {receitas.dados.conteudo.map((receita) => <RecipeCard key={receita.id} receita={receita} />)}
            </div>
            <Paginacao pagina={pagina} total={receitas.dados.totalPaginas} onMudar={setPagina} />
          </>
        )}
      </section>

      <p className="text-xs text-ink-faint">
        Compartilhe este perfil: <Link className="underline" to={`/chef/${chef.id}`}>{location.origin}/chef/{chef.id}</Link>
      </p>
    </div>
  )
}
