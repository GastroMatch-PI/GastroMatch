import { apiAutenticada, ApiError } from './http'
import { listarTodasAsPaginas } from './receitas'

export type PapelApi = 'CHEF' | 'NUTRICIONISTA' | 'RESTAURANTE'
export type StatusApi = 'PENDENTE' | 'APROVADO' | 'REJEITADO'

// confirmar: campos reais de CadastroChefRequest
export type CadastroChefBody = { especializacao: string; bio?: string }

// confirmar: campos reais de CadastroNutricionistaRequest
export type CadastroNutricionistaBody = { crn: string; bio?: string }

// confirmar: campos reais de CadastroRestauranteRequest
export type CadastroRestauranteBody = {
  nome: string
  cnpj: string
  idChef: number
  cep?: string
  rua?: string
  numero?: number
  bairro?: string
  cidade?: string
  estado?: string
}

// confirmar: campos reais de ChefPerfilResponse
export type ChefPerfilDto = {
  id: number
  nome: string
  bio?: string | null
  especializacao?: string | null
}

export type ChefOpcao = { id: number; nome: string }

// confirmar: campo status e motivo em ChefResponse e NutricionistaResponse
type PerfilStatusDto = { status?: StatusApi; motivoRejeicao?: string | null }

export type StatusPerfil = { papel: PapelApi; status: StatusApi; motivo?: string | null }

/** Lê um perfil. Devolve null quando ele não existe (404). */
async function lerOuNulo<T>(path: string, token: string): Promise<T | null> {
  try {
    return await apiAutenticada<T>(path, token)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

/** Status de cada perfil profissional do usuário logado. */
export async function buscarStatusPerfis(token: string): Promise<StatusPerfil[]> {
  const [chefR, nutriR] = await Promise.allSettled([
    lerOuNulo<PerfilStatusDto>('/chefs/me', token),
    lerOuNulo<PerfilStatusDto>('/nutricionistas/me', token),
    // confirmar: se existir GET /restaurantes/me, inclua aqui
  ])

  // Se os dois falharam, ou se a falha é de rede/sessão (0 ou 401), não dá para saber: propaga o erro.
  const falhas = [chefR, nutriR].filter((r): r is PromiseRejectedResult => r.status === 'rejected')
  const grave = falhas.find((f) => !(f.reason instanceof ApiError) || f.reason.status === 0 || f.reason.status === 401)
  if (grave || falhas.length === 2) throw (grave ?? falhas[0]).reason

  const lista: StatusPerfil[] = []
  if (chefR.status === 'fulfilled' && chefR.value)
    lista.push({ papel: 'CHEF', status: chefR.value.status ?? 'APROVADO', motivo: chefR.value.motivoRejeicao })
  if (nutriR.status === 'fulfilled' && nutriR.value)
    lista.push({ papel: 'NUTRICIONISTA', status: nutriR.value.status ?? 'PENDENTE', motivo: nutriR.value.motivoRejeicao })
  return lista
}

/** Papéis que o usuário logado já possui. */
export async function buscarPapeisDoUsuario(token: string): Promise<PapelApi[]> {
  return (await buscarStatusPerfis(token)).map((p) => p.papel)
}

export const buscarChefMe = (token: string) => lerOuNulo<ChefPerfilDto>('/chefs/me', token)

export const atualizarPerfilChef = (token: string, body: CadastroChefBody) =>
  apiAutenticada<ChefPerfilDto>('/chefs/me', token, { method: 'PUT', body })

export const criarPerfilChef = (token: string, body: CadastroChefBody) =>
  apiAutenticada('/chefs', token, { method: 'POST', body })

export const criarPerfilNutricionista = (token: string, body: CadastroNutricionistaBody) =>
  apiAutenticada('/nutricionistas', token, { method: 'POST', body })

export const criarRestaurante = (token: string, body: CadastroRestauranteBody) =>
  apiAutenticada('/restaurantes', token, { method: 'POST', body })

/** Lista de chefs para escolher o responsável pelo restaurante (leitura pública, todas as páginas). */
export const listarChefs = () => listarTodasAsPaginas<ChefOpcao>('/chefs')

/** Perfil público de um chef (leitura pública). */
export const buscarChefPublico = (id: string) =>
  apiAutenticada<ChefPerfilDto>(`/chefs/${id}`, null)