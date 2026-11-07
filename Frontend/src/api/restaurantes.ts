import type { PerfilPro } from '../lib/tipos'
import { apiAutenticada } from './http'
import { extrairPagina } from './receitas'
// confirmar: campos reais de RestauranteResumoResponse
export type RestauranteResumoDto = {
  id: number
  nome: string
  cidade?: string | null
  estado?: string | null
  bairro?: string | null
}

export type FiltrosRestaurante = { texto?: string; cidade?: string; estado?: string; bairro?: string }

const qs = (obj: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== '') p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

/** Diretório público de restaurantes (GET /restaurantes não exige login). */
export async function listarRestaurantes(f: FiltrosRestaurante & { pagina?: number; tamanho?: number }) {
  const bruto = await apiAutenticada<unknown>(`/restaurantes${qs(f)}`, null)
  return extrairPagina<RestauranteResumoDto>(bruto)
}

/**
 * Adapta o restaurante da API para o formato que CardRestaurante usa hoje.
 * Quando CardRestaurante for ajustado para receber RestauranteResumoDto, remova este adaptador.
 */
export function adaptarRestaurante(r: RestauranteResumoDto): PerfilPro {
  return {
    userId: String(r.id),
    papel: 'RESTAURANTE',
    nome: r.nome,
    bio: '',
    status: 'APROVADO',
    cidade: [r.bairro, r.cidade, r.estado].filter(Boolean).join(' - '),
    cidadeNome: r.cidade ?? '',
    estado: r.estado ?? '',
    bairro: r.bairro ?? '',
  } as PerfilPro
}
