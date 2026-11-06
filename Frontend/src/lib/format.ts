export function dataRelativa(ts: number | string, agora = Date.now()): string {
  const t = typeof ts === 'number' ? ts : Date.parse(ts)
  if (Number.isNaN(t)) return String(ts)
  const s = Math.max(0, Math.round((agora - t) / 1000))
  if (s < 60) return 'agora'
  const min = Math.floor(s / 60)
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
  return new Date(t).toLocaleDateString('pt-BR')
}

export const fmtNum = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

/** Páginas a mostrar: 1 … atual-1 atual atual+1 … última. */
export function paginasVisiveis(atual: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, atual - 1, atual, atual + 1])
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
}
