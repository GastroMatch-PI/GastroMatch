import { ApiError, MSG_SEM_CONEXAO, mensagemDeErro } from './http'

const API_URL = import.meta.env.VITE_API_URL as string

export type UsuarioDto = {
  id: number
  email: string
  username: string
  // demais campos de UsuarioResponse
}

export type AuthDto = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  usuario: UsuarioDto
}

export { ApiError }

async function post<T>(path: string, body: unknown, msg401?: string): Promise<T | null> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError(MSG_SEM_CONEXAO, 0)
  }
  if (!res.ok) {
    const msg = res.status === 401 && msg401 ? msg401 : await mensagemDeErro(res)
    throw new ApiError(msg, res.status)
  }
  if (res.status === 204) return null
  const texto = await res.text()
  return (texto ? JSON.parse(texto) : null) as T | null
}

export const cadastroApi = (email: string, username: string, password: string) =>
  post<UsuarioDto>('/auth/cadastro', { email, username, password })

export const loginApi = (email: string, password: string) =>
  post<AuthDto>('/auth/login', { email, password }, 'E-mail ou senha inválidos.')

export const refreshApi = (refreshToken: string) =>
  post<AuthDto>('/auth/refresh', { refreshToken })

export const logoutApi = (refreshToken: string) =>
  post<null>('/auth/logout', { refreshToken })