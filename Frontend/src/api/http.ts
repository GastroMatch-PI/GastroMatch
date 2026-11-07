const API_URL = import.meta.env.VITE_API_URL as string

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function mensagemDeErro(res: Response): Promise<string> {
  const data = await res.json().catch(() => null)
  // o backend responde em "mensagem"; "message" é o padrão do Spring
  const msg = data?.mensagem ?? data?.message
  if (typeof msg === 'string' && msg) return msg
  if (res.status === 400) return 'Verifique os dados informados.'
  if (res.status === 401) return 'Sua sessão expirou. Entre novamente.'
  if (res.status === 403) return 'Você não tem permissão para esta ação.'
  if (res.status === 404) return 'Recurso não encontrado.'
  if (res.status === 409) return 'Já existe um cadastro com esses dados.'
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export const MSG_SEM_CONEXAO = 'Não foi possível conectar ao servidor. Verifique sua conexão.'

// Registrado pelo AuthProvider: renova o access token e devolve o novo (ou null se não deu).
type Renovador = (tokenQueFalhou: string) => Promise<string | null>
let renovarSessao: Renovador | null = null
export const definirRenovadorDeSessao = (fn: Renovador | null) => {
  renovarSessao = fn
}

type Opcoes = { method?: string; body?: unknown }

async function enviar(path: string, token: string | null, opcoes: Opcoes): Promise<Response> {
  const temCorpo = opcoes.body !== undefined
  try {
    return await fetch(`${API_URL}${path}`, {
      method: opcoes.method ?? 'GET',
      headers: {
        ...(temCorpo ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: temCorpo ? JSON.stringify(opcoes.body) : undefined,
    })
  } catch {
    throw new ApiError(MSG_SEM_CONEXAO, 0) // rede, CORS ou servidor fora do ar
  }
}

export async function apiAutenticada<T>(
  path: string,
  token: string | null,
  opcoes: Opcoes = {},
): Promise<T | null> {
  let usado = token
  let res = await enviar(path, usado, opcoes)

  // Token vencido: renova uma vez e repete o pedido com o token novo.
  if (res.status === 401 && token && renovarSessao) {
    const novo = await renovarSessao(token)
    if (novo) {
      usado = novo
      res = await enviar(path, novo, opcoes)
    }
  }

  if (!res.ok) {
    if (import.meta.env.DEV) {
      const corpo = await res.clone().text().catch(() => '')
      let exp = ''
      try {
        const payload = JSON.parse(atob((usado ?? '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        exp = `, expira em ${payload.exp - Math.floor(Date.now() / 1000)}s`
      } catch { /* sem token ou token que não é JWT */ }
      console.warn(`[api] ${opcoes.method ?? 'GET'} ${path} → ${res.status} (${usado ? 'com token' : 'sem token'}${exp})`, corpo)
    }
    throw new ApiError(await mensagemDeErro(res), res.status)
  }
  if (res.status === 204) return null
  // corpo vazio em 200 não derruba a tela
  const texto = await res.text()
  return (texto ? JSON.parse(texto) : null) as T | null
}