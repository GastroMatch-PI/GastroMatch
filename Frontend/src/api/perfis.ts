
import { apiAutenticada, ApiError } from './http'

export type PapelApi = 'CHEF' | 'NUTRICIONISTA' | 'RESTAURANTE'

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
export type ChefOpcao = { id: number; nome: string }

/** Retorna null quando o perfil ainda não existe (404). */
async function existe(path: string, token: string): Promise<boolean> {
  try {
    await apiAutenticada(path, token)
    return true
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return false
    throw e
  }
}

/** Papéis que o usuário logado já possui. */
export async function buscarPapeisDoUsuario(token: string): Promise<PapelApi[]> {
  const [chef, nutri] = await Promise.all([
    existe('/chefs/me', token),
    existe('/nutricionistas/me', token),
    // confirmar: não recebi RestauranteController. Se existir GET /restaurantes/me, adicione aqui.
  ])
  const papeis: PapelApi[] = []
  if (chef) papeis.push('CHEF')
  if (nutri) papeis.push('NUTRICIONISTA')
  return papeis
}

export const criarPerfilChef = (token: string, body: CadastroChefBody) =>
  apiAutenticada('/chefs', token, { method: 'POST', body })

export const criarPerfilNutricionista = (token: string, body: CadastroNutricionistaBody) =>
  apiAutenticada('/nutricionistas', token, { method: 'POST', body })

export const criarRestaurante = (token: string, body: CadastroRestauranteBody) =>
  apiAutenticada('/restaurantes', token, { method: 'POST', body })

/** Lista de chefs para escolher o responsável pelo restaurante. */
export async function listarChefs(): Promise<ChefOpcao[]> {
  const pagina = await apiAutenticada<{ resultados: ChefOpcao[] }>('/chefs?pagina=0&tamanho=100', null)
  return pagina?.resultados ?? []
}