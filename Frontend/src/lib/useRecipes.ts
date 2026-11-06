import { recipes as seed, type Recipe } from '../data/data'
import { useAuth } from '../context/Auth'
import { useLocalState } from '../hooks/useLocalState'
import type { Comentario } from './tipos'

/** Receitas visíveis: as do usuário (não excluídas) e as de demonstração. */
export function useRecipes(incluirExcluidas = false) {
  const [mine] = useLocalState<Recipe[]>('gm-receitas', [])
  return [...mine.filter((r) => incluirExcluidas || !r.deleted), ...seed]
}

type FavMap = Record<string, string[]>

export function useFavoritos() {
  const { usuario } = useAuth()
  const [mapa, setMapa] = useLocalState<FavMap>('gm-favs-v2', {})
  const favs = usuario ? (mapa[usuario.id] ?? []) : []
  // atualização otimista: o estado local muda na hora
  const toggle = (id: string) => {
    if (!usuario) return
    setMapa((m) => {
      const atual = m[usuario.id] ?? []
      return { ...m, [usuario.id]: atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id] }
    })
  }
  const contar = (id: string) => Object.values(mapa).filter((l) => l.includes(id)).length
  return { favs, toggle, contar }
}

export function useNotas() {
  const [todos] = useLocalState<Record<string, Comentario[]>>('gm-comentarios', {})
  return (id: string) => {
    const c = (todos[id] ?? []).filter((x) => x.nota > 0)
    return { media: c.length ? c.reduce((a, x) => a + x.nota, 0) / c.length : 0, total: c.length }
  }
}
