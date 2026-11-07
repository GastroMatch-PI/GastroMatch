import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocalState } from '../hooks/useLocalState'
import { cadastroApi, loginApi, logoutApi, refreshApi, type AuthDto, type UsuarioDto } from '../api/auth'
import type { PerfilPro } from '../lib/tipos'

const REFRESH_KEY = 'gm-refresh-token'

type Ctx = {
  usuario: UsuarioDto | null
  accessToken: string | null
  carregando: boolean
  perfis: PerfilPro[]
  meusPerfis: PerfilPro[]
  setPerfis: (f: (p: PerfilPro[]) => PerfilPro[]) => void
  entrar: (email: string, password: string) => Promise<void>
  cadastrar: (email: string, username: string, password: string) => Promise<void>
  sair: () => void
}
const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Perfis profissionais continuam locais até a etapa de onboarding ser integrada
  const [perfis, setPerfis] = useLocalState<PerfilPro[]>('gm-perfis', [])

  const [usuario, setUsuario] = useState<UsuarioDto | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const iniciado = useRef(false) // evita dupla chamada de refresh no StrictMode

  const guardarSessao = useCallback((s: AuthDto) => {
    setAccessToken(s.accessToken)
    setUsuario(s.usuario)
    localStorage.setItem(REFRESH_KEY, s.refreshToken) // o refresh é rotacionado a cada uso
  }, [])

  const limparSessao = useCallback(() => {
    localStorage.removeItem(REFRESH_KEY)
    setAccessToken(null)
    setUsuario(null)
  }, [])

  // Restaura a sessão ao abrir o site e remove as contas de demonstração antigas
  useEffect(() => {
    localStorage.removeItem('gm-contas')
    localStorage.removeItem('gm-sessao')
    if (iniciado.current) return
    iniciado.current = true

    const rt = localStorage.getItem(REFRESH_KEY)
    if (!rt) {
      setCarregando(false)
      return
    }
    refreshApi(rt)
      .then((s) => {
        if (s) guardarSessao(s)
      })
      .catch(limparSessao)
      .finally(() => setCarregando(false))
  }, [guardarSessao, limparSessao])

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

  // Ponte temporária: PerfilPro.userId é string, usuario.id é number vindo da API
  const meusPerfis = useMemo(
    () => (usuario ? perfis.filter((p) => p.userId === String(usuario.id)) : []),
    [perfis, usuario],
  )

  const value = useMemo(
    () => ({ usuario, accessToken, carregando, perfis, meusPerfis, setPerfis, entrar, cadastrar, sair }),
    [usuario, accessToken, carregando, perfis, meusPerfis, setPerfis, entrar, cadastrar, sair],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('AuthProvider ausente')
  return c
}