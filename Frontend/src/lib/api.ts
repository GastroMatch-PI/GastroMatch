// Cliente único da API. Nenhuma tela chama fetch direto.
// Fonte da verdade das rotas: Backend/Readme.md, seção 3.
import type { SessaoDto } from './apiTipos'

export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080').replace(/\/$/, '')

// O refresh token fica no localStorage (sobrevive a recarregar a página e é rotacionado a cada uso).
// O access token (15 min) fica só em memória.
const REFRESH_KEY = 'gm-refresh-token'
let accessToken: string | null = null
let aoMudarSessao: ((s: SessaoDto | null) => void) | null = null

export const lerRefreshToken = () => {
  try { return localStorage.getItem(REFRESH_KEY) } catch { return null }
}
export function guardarSessao(s: SessaoDto | null) {
  accessToken = s?.accessToken ?? null
  try {
    if (s) localStorage.setItem(REFRESH_KEY, s.refreshToken)
    else localStorage.removeItem(REFRESH_KEY)
  } catch { /* sem storage: a sessão vale só nesta aba */ }
}
export const registrarOuvinteSessao = (f: ((s: SessaoDto | null) => void) | null) => { aoMudarSessao = f }
export const temToken = () => accessToken !== null

/** Erro da API no formato { status, mensagem, erros? }. */
export class ApiError extends Error {
  status: number
  erros?: Record<string, string>
  constructor(status: number, mensagem: string, erros?: Record<string, string>) {
    super(mensagem)
    this.status = status
    this.erros = erros
  }
}

const PADRAO: Record<number, string> = {
  400: 'Verifique os dados informados.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Não encontrado.',
  409: 'Já existe um cadastro com esses dados.',
}

async function lerErro(res: Response): Promise<ApiError> {
  let corpo: { mensagem?: string; erros?: Record<string, string> } | null = null
  try { corpo = await res.json() } catch { /* sem corpo */ }
  const msg = corpo?.mensagem ?? PADRAO[res.status] ?? 'Não foi possível concluir a operação. Tente novamente.'
  return new ApiError(res.status, res.status >= 500 ? 'O servidor falhou. Tente novamente em instantes.' : msg, corpo?.erros)
}

let renovando: Promise<boolean> | null = null
/** Troca o refresh token por novos tokens (uma renovação por vez). */
export function renovarSessao(): Promise<boolean> {
  if (renovando) return renovando
  const rt = lerRefreshToken()
  if (!rt) return Promise.resolve(false)
  renovando = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) })
      if (!res.ok) throw new Error('refresh')
      const s = (await res.json()) as SessaoDto
      guardarSessao(s)
      aoMudarSessao?.(s)
      return true
    } catch {
      guardarSessao(null)
      aoMudarSessao?.(null)
      return false
    } finally {
      renovando = null
    }
  })()
  return renovando
}

type Opcoes = { method?: string; body?: unknown; form?: FormData; auth?: boolean; signal?: AbortSignal }

async function enviar(path: string, o: Opcoes): Promise<Response> {
  const headers: Record<string, string> = {}
  if (o.body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken && o.auth !== false) headers.Authorization = `Bearer ${accessToken}`
  try {
    return await fetch(`${API_URL}${path}`, {
      method: o.method ?? 'GET',
      headers,
      body: o.form ?? (o.body !== undefined ? JSON.stringify(o.body) : undefined),
      signal: o.signal,
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet e tente de novo.')
  }
}

/** Chamada à API. Em 401, renova o token uma vez e repete a chamada. */
export async function api<T = void>(path: string, o: Opcoes = {}): Promise<T> {
  let res = await enviar(path, o)
  if (res.status === 401 && o.auth !== false && lerRefreshToken() && (await renovarSessao())) res = await enviar(path, o)
  if (!res.ok) throw await lerErro(res)
  if (res.status === 204) return undefined as T
  const txt = await res.text()
  return (txt ? JSON.parse(txt) : undefined) as T
}

export const get = <T,>(path: string, signal?: AbortSignal) => api<T>(path, { signal })
export const post = <T = void,>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body: body ?? {} })
export const put = <T = void,>(path: string, body?: unknown) => api<T>(path, { method: 'PUT', body: body ?? {} })
export const del = (path: string) => api<void>(path, { method: 'DELETE' })

/** Monta query string ignorando valores vazios. Listas viram a,b,c. */
export function qs(p: Record<string, string | number | number[] | undefined | null>): string {
  const u = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === '') continue
    u.set(k, Array.isArray(v) ? v.join(',') : String(v))
  }
  const s = u.toString()
  return s ? `?${s}` : ''
}

/** Envia uma imagem (multipart, campo "arquivo") com progresso e cancelamento. Devolve a URL. */
export function enviarImagem(arquivo: File, onProgresso?: (pct: number) => void, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}/imagens`)
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgresso?.(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve((JSON.parse(xhr.responseText) as { url: string }).url) } catch { reject(new ApiError(500, 'Resposta inesperada do servidor.')) }
      } else {
        let corpo: { mensagem?: string } | null = null
        try { corpo = JSON.parse(xhr.responseText) } catch { /* sem corpo */ }
        reject(new ApiError(xhr.status, corpo?.mensagem ?? PADRAO[xhr.status] ?? 'Não foi possível enviar a imagem.'))
      }
    }
    xhr.onerror = () => reject(new ApiError(0, 'Sem conexão com o servidor.'))
    signal?.addEventListener('abort', () => { xhr.abort(); reject(new DOMException('cancelado', 'AbortError')) })
    const fd = new FormData()
    fd.append('arquivo', arquivo)
    xhr.send(fd)
  })
}

/** A API devolve "/imagens/nome" para arquivos locais: completa com o endereço da API. */
export const urlImagem = (u?: string | null) => (!u ? undefined : u.startsWith('/') ? `${API_URL}${u}` : u)

/** Erros de campo da API (400) viram { campo: mensagem } para os formulários. */
export const errosDeCampo = (e: unknown): Record<string, string> => (e instanceof ApiError && e.erros ? e.erros : {})
export const mensagem = (e: unknown) => (e instanceof Error ? e.message : 'Algo deu errado.')
