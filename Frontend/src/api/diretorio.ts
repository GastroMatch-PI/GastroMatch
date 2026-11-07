import { listarTodasAsPaginas } from './receitas'

export type TipoPerfil = 'CHEF' | 'NUTRICIONISTA' | 'RESTAURANTE'

// Perfil já adaptado para a tela do diretório.
// confirmar: nomes reais dos campos em ChefPerfilResponse, NutricionistaResumoResponse e o DTO de restaurante.
// O adaptador tolera variações comuns; campos ausentes simplesmente não aparecem.
export type PerfilDiretorio = {
  chave: string // único na lista: "CHEF-3"
  idApi: number
  tipo: TipoPerfil
  nome: string
  especializacao?: string
  crn?: string
  bio?: string
  local?: string
  instagram?: string
  whatsapp?: string
}

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const pick = (o: Obj, ...chaves: string[]): unknown => {
  for (const k of chaves) if (o[k] !== undefined && o[k] !== null) return o[k]
  return undefined
}
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
const num = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN
  return Number.isFinite(n) ? n : undefined
}

function adaptar(o: Obj, tipo: TipoPerfil): PerfilDiretorio | null {
  // Defesa extra: nutricionista só aparece depois de aprovada (se o DTO trouxer o status).
  const status = str(pick(o, 'status'))
  if (status && status !== 'APROVADO') return null

  const id = num(pick(o, 'id'))
  const nome = str(pick(o, 'nome'))
  if (id === undefined || !nome) return null

  const bairro = str(pick(o, 'bairro'))
  const cidade = str(pick(o, 'cidade'))
  const estado = str(pick(o, 'estado'))
  const cidadeUf = [cidade, estado].filter(Boolean).join('/')
  const local = [bairro, cidadeUf].filter(Boolean).join(' · ') || undefined

  return {
    chave: `${tipo}-${id}`,
    idApi: id,
    tipo,
    nome,
    especializacao: str(pick(o, 'especializacao')),
    crn: str(pick(o, 'crn')),
    bio: str(pick(o, 'bio', 'descricao')),
    local,
    instagram: str(pick(o, 'instagram')),
    whatsapp: str(pick(o, 'whatsapp')),
  }
}

/** Todas as páginas de uma listagem pública (50 por vez). */
async function buscarLista(path: string): Promise<Obj[]> {
  return (await listarTodasAsPaginas<unknown>(path)).filter(isObj)
}

/** Lê os três diretórios (público). Se um deles falhar, os outros continuam e o tipo vai em `falhas`. */
export async function listarDiretorio(): Promise<{ perfis: PerfilDiretorio[]; falhas: TipoPerfil[] }> {
  const fontes: { tipo: TipoPerfil; path: string }[] = [
    { tipo: 'CHEF', path: '/chefs' },
    { tipo: 'NUTRICIONISTA', path: '/nutricionistas' },
    { tipo: 'RESTAURANTE', path: '/restaurantes' },
  ]
  const resultados = await Promise.allSettled(fontes.map((f) => buscarLista(f.path)))

  const perfis: PerfilDiretorio[] = []
  const falhas: TipoPerfil[] = []
  resultados.forEach((r, i) => {
    const { tipo } = fontes[i]
    if (r.status === 'rejected') {
      falhas.push(tipo)
      return
    }
    for (const o of r.value) {
      const p = adaptar(o, tipo)
      if (p) perfis.push(p)
    }
  })
  perfis.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  return { perfis, falhas }
}