import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cadastroApi, loginApi, logoutApi, refreshApi, type AuthDto, type UsuarioDto } from '../api/auth'
import { ApiError, definirRenovadorDeSessao } from '../api/http'

const REFRESH_KEY = 'gm-refresh-token'

type Ctx = {
  usuario: UsuarioDto | null
  accessToken: string | null
  carregando: boolean
  entrar: (email: string, password: string) => Promise<void>
  cadastrar: (email: string, username: string, password: string) => Promise<void>
  sair: () => void
}

const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioDto | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const iniciado = useRef(false) // evita dupla chamada de refresh no StrictMode
  const tokenAtual = useRef<string | null>(null) // espelho do estado, para quem não lê o estado
  const renovando = useRef<Promise<string | null> | null>(null)

  const guardarSessao = useCallback((s: AuthDto) => {
    tokenAtual.current = s.accessToken
    setAccessToken(s.accessToken)
    setUsuario(s.usuario)
    localStorage.setItem(REFRESH_KEY, s.refreshToken) // o refresh é rotacionado a cada uso
  }, [])

  const limparSessao = useCallback(() => {
    tokenAtual.current = null
    localStorage.removeItem(REFRESH_KEY)
    setAccessToken(null)
    setUsuario(null)
  }, [])

  /**
   * Renova o access token com o refresh token. Chamadas simultâneas dividem a mesma renovação.
   * Devolve o token novo, ou null se não foi possível.
   */
  const renovar = useCallback(
    (tokenQueFalhou?: string): Promise<string | null> => {
      // outro pedido já renovou: usa o token novo, sem rotacionar o refresh de novo
      if (tokenQueFalhou && tokenAtual.current && tokenAtual.current !== tokenQueFalhou) {
        return Promise.resolve(tokenAtual.current)
      }
      if (renovando.current) return renovando.current

      const rt = localStorage.getItem(REFRESH_KEY)
      if (!rt) return Promise.resolve(null)

      const p = refreshApi(rt)
        .then((s) => {
          if (!s) {
            limparSessao()
            return null
          }
          guardarSessao(s)
          return s.accessToken
        })
        .catch((e) => {
  // Só encerra a sessão quando o backend informa que o refresh token é inválido.
  // Erros 500 e falhas de conexão são temporários e não devem apagar o login.
  if (e instanceof ApiError && e.status === 401) {
    limparSessao()
  }
  return null
})
        .finally(() => {
          renovando.current = null
        })
      renovando.current = p
      return p
    },
    [guardarSessao, limparSessao],
  )

  // Entrega o renovador ao cliente HTTP, que o usa quando um pedido autenticado recebe 401.
  useEffect(() => {
    definirRenovadorDeSessao(renovar)
    return () => definirRenovadorDeSessao(null)
  }, [renovar])

  // Restaura a sessão ao abrir o site
  useEffect(() => {
    if (iniciado.current) return
    iniciado.current = true

    if (!localStorage.getItem(REFRESH_KEY)) {
      setCarregando(false)
      return
    }
    renovar().finally(() => setCarregando(false))
  }, [renovar])

  const entrar = useCallback(
    async (email: string, password: string) => {
      const s = await loginApi(email, password)
      if (s) guardarSessao(s)
    },
    [guardarSessao],
  )

  const cadastrar = useCallback(
    async (email: string, username: string, password: string) => {
      await cadastroApi(email, username, password)
      await entrar(email, password) // o cadastro não devolve tokens, então entra em seguida
    },
    [entrar],
  )

  const sair = useCallback(() => {
    const rt = localStorage.getItem(REFRESH_KEY)
    if (rt) logoutApi(rt).catch(() => {}) // limpa localmente mesmo se a API falhar
    limparSessao()
  }, [limparSessao])

  const value = useMemo(
    () => ({ usuario, accessToken, carregando, entrar, cadastrar, sair }),
    [usuario, accessToken, carregando, entrar, cadastrar, sair],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('AuthProvider ausente')
  return c
}