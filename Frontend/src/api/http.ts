
const API_URL = import.meta.env.VITE_API_URL as string

export class ApiError extends Error {
  constructor(message: string,     status: number) {
    super(message)
  }
}

export async function mensagemDeErro(res: Response): Promise<string> {
  const data = await res.json().catch(() => null)
  if (data?.message) return data.message
  if (res.status === 400) return 'Verifique os dados informados.'
  if (res.status === 401) return 'Sua sessão expirou. Entre novamente.'
  if (res.status === 403) return 'Você não tem permissão para esta ação.'
  if (res.status === 404) return 'Recurso não encontrado.'
  if (res.status === 409) return 'Já existe um cadastro com esses dados.'
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export async function apiAutenticada<T>(
  path: string,
  token: string | null,
  opcoes: { method?: string; body?: unknown } = {},
): Promise<T | null> {
  const temCorpo = opcoes.body !== undefined
  const res = await fetch(`${API_URL}${path}`, {
    method: opcoes.method ?? 'GET',
    headers: {
      ...(temCorpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: temCorpo ? JSON.stringify(opcoes.body) : undefined,
  })
  if (!res.ok) throw new ApiError(await mensagemDeErro(res), res.status)
  if (res.status === 204) return null
  return (await res.json()) as T
}