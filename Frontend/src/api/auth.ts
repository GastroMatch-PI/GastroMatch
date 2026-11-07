const API_URL = import.meta.env.VITE_API_URL


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

export class ApiError extends Error {
  constructor(message: string, status: number) {
    super(message)
  }
}

async function mensagemDeErro(res: Response): Promise<string> {
  const data = await res.json().catch(() => null)
  if (data?.message) return data.message
  if (res.status === 401) return 'E-mail ou senha inválidos.'
  if (res.status === 409) return 'E-mail ou username já cadastrado.'
  if (res.status === 400) return 'Verifique os dados informados.'
  return 'Não foi possível concluir a operação. Tente novamente.'
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new ApiError(await mensagemDeErro(res), res.status)
  if (res.status === 204) return null
  return (await res.json()) as T
}

export const cadastroApi = (email: string, username: string, password: string) =>
  post<UsuarioDto>('/auth/cadastro', { email, username, password })

export const loginApi = (email: string, password: string) =>
  post<AuthDto>('/auth/login', { email, password })

export const refreshApi = (refreshToken: string) =>
  post<AuthDto>('/auth/refresh', { refreshToken })

export const logoutApi = (refreshToken: string) =>
  post<null>('/auth/logout', { refreshToken })