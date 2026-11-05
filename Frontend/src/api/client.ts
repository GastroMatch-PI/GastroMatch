export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

const KEY = 'gm-auth'

export type Usuario = { id: number; email: string; username: string; capa: string | null }
export type Sessao = { accessToken: string; refreshToken: string; usuario: Usuario }

export function lerSessao(): Sessao | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Sessao) : null
  } catch {
    return null
  }
}
export function salvarSessao(s: Sessao | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    /* sem storage */
  }
}

export class ApiError extends Error {
  status: number
  erros?: Record<string, string>
  constructor(status: number, message: string, erros?: Record<string, string>) {
    super(message)
    this.status = status
    this.erros = erros
  }
}

async function chamar(path: string, init: RequestInit, token?: string): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${API_URL}${path}`, { ...init, headers: { ...headers, ...(init.headers as object) } })
}

async function renovar(): Promise<Sessao | null> {
  const s = lerSessao()
  if (!s) return null
  const r = await chamar('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: s.refreshToken }) })
  if (!r.ok) {
    salvarSessao(null)
    return null
  }
  const d = await r.json()
  const nova = { accessToken: d.accessToken, refreshToken: d.refreshToken, usuario: d.usuario }
  salvarSessao(nova)
  return nova
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let s = lerSessao()
  let r = await chamar(path, init, s?.accessToken)
  if (r.status === 401 && s) {
    s = await renovar()
    if (s) r = await chamar(path, init, s.accessToken)
  }
  if (!r.ok) {
    let msg = `Erro ${r.status}`
    let erros: Record<string, string> | undefined
    try {
      const j = await r.json()
      msg = j.mensagem ?? msg
      erros = j.erros
    } catch {
      /* sem corpo */
    }
    throw new ApiError(r.status, msg, erros)
  }
  if (r.status === 204) return undefined as T
  const txt = await r.text()
  return (txt ? JSON.parse(txt) : undefined) as T
}

export const post = <T,>(p: string, body?: unknown) => api<T>(p, { method: 'POST', body: JSON.stringify(body ?? {}) })
export const put = <T,>(p: string, body?: unknown) => api<T>(p, { method: 'PUT', body: JSON.stringify(body ?? {}) })
export const del = <T,>(p: string) => api<T>(p, { method: 'DELETE' })

export type Pagina<T> = { conteudo: T[]; pagina: number; tamanho: number; totalElementos: number; totalPaginas: number }
export type Ingrediente = { id: number; nome: string; porcaoBase: number; calorias: number }
export type ReceitaResumo = {
  id: number
  nome: string
  descricao: string | null
  imagem: string | null
  tempoPreparo: number
  nPorcoes: number
  dificuldade: string
  tipo: string
  chef: { username?: string } | null
}

export const ENUMS = {
  dificuldade: { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' },
  tipo: { CAFE_DA_MANHA: 'Café da manhã', ALMOCO: 'Almoço', JANTAR: 'Jantar', LANCHE: 'Lanche', SOBREMESA: 'Sobremesa' },
  metodo: { FORNO: 'Forno', AIR_FRYER: 'Air fryer', GRELHA: 'Grelha', FOGAO: 'Fogão' },
  ocasiao: { ANIVERSARIO: 'Aniversário', CHURRASCO: 'Churrasco', NATAL: 'Natal', DIA_A_DIA: 'Dia a dia' },
  perfil: { VEGANO: 'Vegano', VEGETARIANO: 'Vegetariano', LOW_CARB: 'Low carb', SEM_GLUTEN: 'Sem glúten', SEM_LACTOSE: 'Sem lactose' },
  unidade: { G: 'g', ML: 'ml', UNIDADE: 'unidade', XICARA: 'xícara' },
  especializacao: { CONFEITARIA: 'Confeitaria', PANIFICACAO: 'Panificação', CARNES: 'Carnes', MASSAS: 'Massas', COZINHA_VEGETARIANA: 'Cozinha vegetariana' },
} as const
