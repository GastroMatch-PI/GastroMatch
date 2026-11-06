import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { useLocalState } from '../hooks/useLocalState'
import { hash, type Conta, type PerfilPro } from '../lib/tipos'

type Ctx = {
  usuario: Conta | null
  perfis: PerfilPro[]
  meusPerfis: PerfilPro[]
  setPerfis: (f: (p: PerfilPro[]) => PerfilPro[]) => void
  entrar: (email: string, password: string) => Promise<void>
  cadastrar: (email: string, username: string, password: string) => Promise<void>
  sair: () => void
  atualizarConta: (dados: { username?: string; capa?: string }) => void
  trocarSenha: (atual: string, nova: string) => Promise<void>
}
const AuthCtx = createContext<Ctx | null>(null)

// Contas ficam só neste navegador (demonstração, sem servidor).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [contas, setContas] = useLocalState<Conta[]>('gm-contas', [])
  const [sessao, setSessao] = useLocalState<string | null>('gm-sessao', null)
  const [perfis, setPerfis] = useLocalState<PerfilPro[]>('gm-perfis', [])

  const usuario = contas.find((c) => c.id === sessao) ?? null

  const entrar = useCallback(
    async (email: string, password: string) => {
      const h = await hash(password)
      const c = contas.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.hash === h)
      if (!c) throw new Error('Email ou senha inválidos.')
      setSessao(c.id)
    },
    [contas, setSessao],
  )

  const cadastrar = useCallback(
    async (email: string, username: string, password: string) => {
      if (contas.some((c) => c.email.toLowerCase() === email.toLowerCase())) throw new Error('Email já cadastrado.')
      if (contas.some((c) => c.username.toLowerCase() === username.toLowerCase())) throw new Error('Username já cadastrado.')
      // A primeira conta criada neste navegador é a administradora (demonstração, sem servidor).
      const c: Conta = { id: String(Date.now()), email, username, hash: await hash(password), admin: contas.length === 0 }
      setContas((l) => [...l, c])
      setSessao(c.id)
    },
    [contas, setContas, setSessao],
  )

  const sair = useCallback(() => setSessao(null), [setSessao])

  const atualizarConta = useCallback(
    (dados: { username?: string; capa?: string }) => setContas((l) => l.map((c) => (c.id === sessao ? { ...c, ...dados } : c))),
    [sessao, setContas],
  )

  const trocarSenha = useCallback(
    async (atual: string, nova: string) => {
      const c = contas.find((x) => x.id === sessao)
      if (!c || c.hash !== (await hash(atual))) throw new Error('Não foi possível trocar a senha. Confira os dados.')
      const h = await hash(nova)
      setContas((l) => l.map((x) => (x.id === c.id ? { ...x, hash: h } : x)))
    },
    [contas, sessao, setContas],
  )

  const meusPerfis = perfis.filter((p) => p.userId === usuario?.id)

  return (
    <AuthCtx.Provider value={{ usuario, perfis, meusPerfis, setPerfis, entrar, cadastrar, sair, atualizarConta, trocarSenha }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('AuthProvider ausente')
  return c
}
