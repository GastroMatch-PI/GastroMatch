import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { lerSessao, post, salvarSessao, type Sessao, type Usuario } from '../api/client'

type Ctx = {
  usuario: Usuario | null
  entrar: (email: string, password: string) => Promise<void>
  cadastrar: (email: string, username: string, password: string) => Promise<void>
  sair: () => Promise<void>
}
const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => lerSessao()?.usuario ?? null)

  const guardar = (d: Sessao) => {
    salvarSessao({ accessToken: d.accessToken, refreshToken: d.refreshToken, usuario: d.usuario })
    setUsuario(d.usuario)
  }
  const entrar = useCallback(async (email: string, password: string) => {
    guardar(await post<Sessao>('/auth/login', { email, password }))
  }, [])
  const cadastrar = useCallback(async (email: string, username: string, password: string) => {
    await post('/auth/cadastro', { email, username, password })
    guardar(await post<Sessao>('/auth/login', { email, password }))
  }, [])
  const sair = useCallback(async () => {
    const s = lerSessao()
    try {
      if (s) await post('/auth/logout', { refreshToken: s.refreshToken })
    } catch {
      /* ignora */
    }
    salvarSessao(null)
    setUsuario(null)
  }, [])

  return <AuthCtx.Provider value={{ usuario, entrar, cadastrar, sair }}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('AuthProvider ausente')
  return c
}
