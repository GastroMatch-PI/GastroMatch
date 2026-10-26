import { createStore } from './store'

export type ShopItem = { id: number; name: string; qty: string; done: boolean }
export type PlannedMeal = { recipeId: string; day: string }

export const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export const shopping = createStore<ShopItem[]>('gm:v2:shopping', [
  { id: 1, name: 'Queijo de cabra', qty: '150 g', done: false },
  { id: 2, name: 'Tomate-cereja', qty: '1 caixa', done: false },
  { id: 3, name: 'Folhas de sálvia', qty: '1 maço', done: true },
])

export const menu = createStore<PlannedMeal[]>('gm:v2:menu', [
  { recipeId: 'massa-tomates-confitados', day: 'Seg' },
  { recipeId: 'shakshuka-rustica', day: 'Qua' },
  { recipeId: 'risoto-de-abobora', day: 'Sex' },
])

export const saved = createStore<string[]>('gm:v2:saved', [])

// Ingredientes já separados, por receita (continuam marcados ao recarregar a página).
export const checklists = createStore<Record<string, string[]>>('gm:v2:checklists', {})

export function toggleChecked(recipeId: string, name: string) {
  checklists.set((prev) => {
    const current = prev[recipeId] ?? []
    return { ...prev, [recipeId]: current.includes(name) ? current.filter((n) => n !== name) : [...current, name] }
  })
}

export function clearChecked(recipeId: string) {
  checklists.set((prev) => ({ ...prev, [recipeId]: [] }))
}

export function addToMenu(recipeId: string) {
  menu.set((prev) => {
    if (prev.some((meal) => meal.recipeId === recipeId)) return prev
    const day = days.find((d) => !prev.some((meal) => meal.day === d)) ?? days[prev.length % days.length]
    return [...prev, { recipeId, day }]
  })
}

export function removeFromMenu(recipeId: string) {
  menu.set((prev) => prev.filter((meal) => meal.recipeId !== recipeId))
}

export function toggleSaved(recipeId: string) {
  saved.set((prev) => (prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]))
}

// Junta itens à lista de compras sem repetir o que já está nela. Devolve quantos entraram.
export function addToShopping(entries: { name: string; qty: string }[]) {
  let added = 0
  shopping.set((prev) => {
    const known = new Set(prev.map((item) => item.name.toLowerCase()))
    const fresh = entries
      .filter((entry) => !known.has(entry.name.toLowerCase()))
      .map((entry, index) => ({ id: Date.now() + index, name: entry.name, qty: entry.qty, done: false }))
    added = fresh.length
    return fresh.length ? [...prev, ...fresh] : prev
  })
  return added
}
