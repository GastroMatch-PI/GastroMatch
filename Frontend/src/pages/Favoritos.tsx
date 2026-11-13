import { useEffect, useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import Protegida from '../components/Protegida'
import RecipeCard from '../components/RecipeCard'
import { EstadoVazio } from '../components/Ui'
import { useRecipes, useFavoritos } from '../lib/useRecipes'
import {
  adaptarResumo,
  listarTodasAsPaginas,
  type ReceitaResumoDto,
} from '../api/receitas'
import type { Recipe } from '../data/data'
import { useSeo } from '../lib/seo'

export default function Favoritos() {
  useSeo({ titulo: 'Meus favoritos' })

  const { favs } = useFavoritos()
  const receitasLocais = useRecipes()
  const [receitasDaApi, setReceitasDaApi] = useState<Recipe[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    listarTodasAsPaginas<ReceitaResumoDto>('/receitas')
      .then((lista) => {
        if (ativo) setReceitasDaApi(lista.map(adaptarResumo))
      })
      .catch((erroApi: unknown) => {
        if (!ativo) return
        setErro(
          erroApi instanceof Error
            ? erroApi.message
            : 'Não foi possível carregar as receitas.',
        )
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  const favoritas = useMemo(() => {
    // A API substitui uma receita local caso os IDs coincidam.
    const receitasPorId = new Map<string, Recipe>()

    for (const receita of receitasLocais) {
      receitasPorId.set(String(receita.id), receita)
    }

    for (const receita of receitasDaApi) {
      receitasPorId.set(String(receita.id), receita)
    }

    return favs
      .map((id) => receitasPorId.get(String(id)))
      .filter((receita): receita is Recipe => receita !== undefined)
  }, [favs, receitasLocais, receitasDaApi])

  return (
    <Protegida>
      <div className="space-y-6">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold">
          <Heart className="fill-terra text-terra" />
          Meus favoritos
        </h1>

        {erro && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {erro}
          </p>
        )}

        {favoritas.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favoritas.map((receita) => (
              <RecipeCard key={receita.id} recipe={receita} />
            ))}
          </div>
        )}

        {carregando && favoritas.length === 0 && (
          <p className="card p-10 text-center text-sm text-ink-soft">
            Carregando favoritos...
          </p>
        )}

        {!carregando && favoritas.length === 0 && !erro && (
          <EstadoVazio
            titulo="Você ainda não tem receitas favoritas"
            texto="Toque no coração de uma receita para encontrá-la aqui."
            acao={{ to: '/receitas', rotulo: 'Explorar receitas' }}
          />
        )}

        {!carregando && favoritas.length === 0 && erro && favs.length > 0 && (
          <p className="card p-6 text-center text-sm text-ink-soft">
            Há receitas marcadas como favoritas, mas não foi possível encontrar
            os dados delas. Verifique a conexão com o servidor e tente novamente.
          </p>
        )}
      </div>
    </Protegida>
  )
}