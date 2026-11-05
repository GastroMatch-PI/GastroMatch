import { recipes as seed, type Recipe } from '../data/data'
import { useLocalState } from '../hooks/useLocalState'

export function useRecipes() {
  const [mine] = useLocalState<Recipe[]>('gm-receitas', [])
  return [...mine, ...seed]
}

export function useFavoritos() {
  const [favs, setFavs] = useLocalState<string[]>('gm-favs', [])
  const toggle = (id: string) => setFavs((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))
  return { favs, toggle }
}
