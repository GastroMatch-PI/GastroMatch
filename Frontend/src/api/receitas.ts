import type { Recipe } from '../data/data'
import { ENUMS } from '../data/enums'
import { apiAutenticada } from './http'

// confirmar: campos reais de ReceitaResumoResponse
export type ReceitaResumoDto = {
  id: number
  nome: string
  imagem: string | null
  tempoPreparo: number
  nPorcoes: number
  dificuldade: string // nome do enum Java, ex.: "FACIL"
  tipo: string // ex.: "ALMOCO"
  chef: string // confirmar: se vier como objeto, use chef.nome
}

// confirmar: campos reais de PaginaResponse
export type PaginaDto<T> = { resultados: T[]; pagina: number; totalPaginas: number }
/** Extrai a lista de qualquer formato comum de página (resultados, content ou array puro). */
export function extrairLista<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[]
  const o = r as { resultados?: unknown; content?: unknown } | null
  if (Array.isArray(o?.resultados)) return o.resultados as T[]
  if (Array.isArray(o?.content)) return o.content as T[]
  return []
}

/** Extrai a lista e os metadados de paginação de qualquer formato comum. */
export function extrairPagina<T>(r: unknown) {
  const o = r as Record<string, unknown> | null
  return {
    itens: extrairLista<T>(r),
    paginaAtual: Number(o?.pagina ?? o?.number ?? 0),
    totalPaginas: Number(o?.totalPaginas ?? o?.totalPages ?? 1),
  }
}

export type FiltrosReceita = {
  texto?: string
  tempoMax?: number
  dificuldade?: string
  tipo?: string
  metodo?: string
  ocasiao?: string
  perfil?: string
}

const qs = (obj: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== '') p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

/**
 * Junta todas as páginas de uma listagem pública (50 por vez, no máximo 20 páginas).
 * Evita pedir um tamanho de página maior que o aceito pelo backend.
 */
export async function listarTodasAsPaginas<T>(
  path: string,
  extras: Record<string, string | number | undefined> = {},
  tamanho = 50, // confirmar: maior tamanho de página aceito em cada endpoint
): Promise<T[]> {
  const todos: T[] = []
  for (let pagina = 0; pagina < 20; pagina++) {
    const bruto = await apiAutenticada<unknown>(`${path}${qs({ ...extras, pagina, tamanho })}`, null)
    const p = extrairPagina<T>(bruto)
    todos.push(...p.itens)
    if (p.paginaAtual + 1 >= p.totalPaginas) break
  }
  return todos
}

/** Leitura pública: não envia token. */
export const listarReceitas = (f: FiltrosReceita & { pagina?: number; tamanho?: number }) =>
  apiAutenticada<PaginaDto<ReceitaResumoDto>>(`/receitas${qs(f)}`, null) as Promise<PaginaDto<ReceitaResumoDto>>

/** Converte o resumo da API no formato que RecipeCard usa. Campos sem equivalente ficam vazios. */
export function adaptarResumo(r: ReceitaResumoDto): Recipe {
  return {
    id: String(r.id),
    title: r.nome,
    image: r.imagem ?? undefined,
    emoji: '🍽️',
    seed: r.id % 5,
    minutes: r.tempoPreparo,
    servings: r.nPorcoes,
    difficulty: ENUMS.dificuldade[r.dificuldade as keyof typeof ENUMS.dificuldade] as Recipe['difficulty'],
    author: r.chef,
    role: 'Chef',
    collections: [ENUMS.tipo[r.tipo as keyof typeof ENUMS.tipo]],
    ingredients: [], // o resumo não traz ingredientes; a busca pela geladeira fica para a próxima etapa
    nutrition: '',
    detail: { ing: [], steps: [] },
  } as Recipe
}

// confirmar: campos reais de IngredienteResponse. A lista pode vir como array ou como página.
export type IngredienteDto = { id: number; nome: string }

/** Todos os ingredientes do catálogo (todas as páginas), filtrados por nome quando informado. */
export const listarIngredientes = (nome = '') => listarTodasAsPaginas<IngredienteDto>('/ingredientes', { nome })

// confirmar: campos reais de ReceitaRequest. Os opcionais dependem do DTO.
export type ReceitaBody = {
  nome: string
  nPorcoes: number
  tempoPreparo: number
  dificuldade: string
  tipo: string
  ingredientes: { idIngrediente: number; quantidade: number; unidadeMedida: string }[]
  descricao?: string
  imagem?: string
  videoUrl?: string
  metodo?: string
  ocasiao?: string
  perfil?: string
}

// confirmar: campos reais de EtapaRequest
export type EtapaBody = { ordem: number; titulo: string; instrucao: string; timestampVideo?: number; imagem?: string }

// confirmar: campos reais de DicaRequest e valores aceitos em tipo
export type DicaBody = { tipo: 'DICA' | 'ERRO_COMUM'; titulo: string; texto: string }

export const criarReceita = (token: string, body: ReceitaBody) =>
  apiAutenticada<{ id: number }>('/receitas', token, { method: 'POST', body })

export const criarEtapa = (token: string, idReceita: number, body: EtapaBody) =>
  apiAutenticada<{ id: number }>(`/receitas/${idReceita}/etapas`, token, { method: 'POST', body })

export const criarDica = (token: string, idReceita: number, idEtapa: number, body: DicaBody) =>
  apiAutenticada(`/receitas/${idReceita}/etapas/${idEtapa}/dicas`, token, { method: 'POST', body })