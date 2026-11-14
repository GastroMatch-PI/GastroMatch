import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, del, get, guardarSessao, lerRefreshToken, post, put, registrarOuvinteSessao, renovarSessao } from '../lib/api'
import type { ChefMe, NutricionistaMe, Pagina, PerfilProfissional, ReceitaResumo, RestauranteMe, SessaoDto, Usuario } from '../lib/apiTipos'

type Ctx = {
  usuario: Usuario | null
  carregando: boolean // restaurando a sessão ao abrir o site
  perfil: PerfilProfissional | null // a conta tem no máximo UM perfil profissional
  carregandoPerfil: boolean
  recarregarPerfil: () => Promise<void>
  favoritos: Set<number>
  alternarFavorito: (idReceita: number) => Promise<void>
  entrar: (email: string, password: string) => Promise<void>
  cadastrar: (email: string, username: string, password: string) => Promise<void>
  sair: () => Promise<void>
}
const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(() => lerRefreshToken() !== null)
  const [perfil, setPerfil] = useState<PerfilProfissional | null>(null)
  const [carregandoPerfil, setCarregandoPerfil] = useState(false)
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set())

  // A API avisa quando a sessão muda (renovação ou refresh vencido)
  useEffect(() => {
    registrarOuvinteSessao((s) => setUsuario(s?.usuario ?? null))
    return () => registrarOuvinteSessao(null)
  }, [])

  // Restaura a sessão ao abrir o site (e limpa as contas de demonstração antigas do navegador)
  useEffect(() => {
    ;['gm-contas', 'gm-sessao', 'gm-perfis'].forEach((k) => { try { localStorage.removeItem(k) } catch { /* ok */ } })
    if (!lerRefreshToken()) return
    renovarSessao().finally(() => setCarregando(false))
  }, [])

  const recarregarPerfil = useCallback(async () => {
    setCarregandoPerfil(true)
    // Uma rota por papel; a que não for da conta responde 404 (esperado).
    const [chef, nutri, rest] = await Promise.allSettled([get<ChefMe>('/chefs/me'), get<NutricionistaMe>('/nutricionistas/me'), get<RestauranteMe>('/restaurantes/me')])
    if (chef.status === 'fulfilled') setPerfil({ papel: 'CHEF', dados: chef.value })
    else if (nutri.status === 'fulfilled') setPerfil({ papel: 'NUTRICIONISTA', dados: nutri.value })
    else if (rest.status === 'fulfilled') setPerfil({ papel: 'RESTAURANTE', dados: rest.value })
    else setPerfil(null)
    setCarregandoPerfil(false)
  }, [])

  const carregarFavoritos = useCallback(async () => {
    const ids = new Set<number>()
    for (let p = 0; p < 20; p++) {
      const pg = await get<Pagina<ReceitaResumo>>(`/usuarios/me/favoritos?pagina=${p}&tamanho=50`)
      pg.conteudo.forEach((r) => ids.add(r.id))
      if (p + 1 >= pg.totalPaginas) break
    }
    setFavoritos(ids)
  }, [])

  // Ao logar/deslogar: carrega o perfil profissional e os favoritos da conta
  const idUsuario = usuario?.id
  useEffect(() => {
    if (idUsuario === undefined) { setPerfil(null); setFavoritos(new Set()); return }
    void recarregarPerfil()
    carregarFavoritos().catch(() => undefined)
  }, [idUsuario, recarregarPerfil, carregarFavoritos])

  const guardar = useCallback((s: SessaoDto) => {
    guardarSessao(s)
    setUsuario(s.usuario)
  }, [])

  const entrar = useCallback(async (email: string, password: string) => {
    guardar(await api<SessaoDto>('/auth/login', { method: 'POST', body: { email, password }, auth: false }))
  }, [guardar])

  const cadastrar = useCallback(async (email: string, username: string, password: string) => {
    await api('/auth/cadastro', { method: 'POST', body: { email, username, password }, auth: false })
    await entrar(email, password) // o cadastro não devolve token: entra em seguida
  }, [entrar])

  const sair = useCallback(async () => {
    const rt = lerRefreshToken()
    try { if (rt) await post('/auth/logout', { refreshToken: rt }) } catch { /* encerra localmente mesmo se a API falhar */ }
    guardarSessao(null)
    setUsuario(null)
  }, [])

  // Atualização otimista: o coração muda na hora e volta atrás se a API falhar.
  const alternarFavorito = useCallback(async (id: number) => {
    const tinha = favoritos.has(id)
    const aplicar = (tem: boolean) => setFavoritos((s) => { const n = new Set(s); if (tem) n.add(id); else n.delete(id); return n })
    aplicar(!tinha)
    try {
      if (tinha) await del(`/receitas/${id}/favorito`)
      else await put(`/receitas/${id}/favorito`)
    } catch (e) {
      aplicar(tinha)
      throw e
    }
  }, [favoritos])

  const value = useMemo(
    () => ({ usuario, carregando, perfil, carregandoPerfil, recarregarPerfil, favoritos, alternarFavorito, entrar, cadastrar, sair }),
    [usuario, carregando, perfil, carregandoPerfil, recarregarPerfil, favoritos, alternarFavorito, entrar, cadastrar, sair],
  )
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('AuthProvider ausente')
  return c
}
