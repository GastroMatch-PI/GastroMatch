import type { Ingredient } from '../data/data'

export function clock(total: number) {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Quantidade já ajustada ao número de porções ("320 g", "1,2 L", "3 dentes").
export function formatQty(ingredient: Ingredient, factor: number) {
  if (ingredient.qty === undefined) return 'a gosto'

  const raw = ingredient.qty * factor
  let n: number
  if (ingredient.unit === 'g' || ingredient.unit === 'ml') {
    n = raw >= 100 ? Math.round(raw / 5) * 5 : Math.round(raw)
  } else if (ingredient.unit === 'L') {
    n = Math.round(raw * 100) / 100
  } else {
    n = Math.max(0.5, Math.round(raw * 2) / 2)
  }

  const unit = n <= 1 ? ingredient.unit : (ingredient.plural ?? ingredient.unit)
  return `${n.toLocaleString('pt-BR')}${unit ? ` ${unit}` : ''}`
}
