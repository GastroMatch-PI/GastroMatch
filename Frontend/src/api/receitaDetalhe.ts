import { apiAutenticada } from './http'

// Modelo usado pela tela da receita.
// confirmar: nomes reais dos campos em ReceitaDetalheResponse (Java). O adaptador abaixo
// tolera variações comuns; em modo dev a resposta real é mostrada no console (console.debug).

export type DicaReceita = {
  id?: number
  tipo: 'DICA' | 'ERRO_COMUM' // confirmar: valores do enum de tipo da dica
  titulo: string
  texto: string
  autor?: string
}

export type EtapaReceita = {
  id?: number
  ordem: number
  titulo: string
  texto: string
  segundos?: number // confirmar: tempo da etapa
  videoAt?: number // confirmar: segundo do vídeo em que a etapa começa
  imagem?: string
  dicas: DicaReceita[]
}

export type IngredienteReceita = { nome: string; quantidade: number; unidade: string }

export type NutricaoReceita = { kcal?: number; proteinas?: number; carboidratos?: number; gorduras?: number }

export type ReceitaDetalhe = {
  id: number
  nome: string
  descricao?: string
  imagem?: string
  videoUrl?: string
  tempoPreparo?: number
  nPorcoes: number
  dificuldade?: string
  tipo?: string
  metodo?: string
  ocasiao?: string
  perfil?: string
  chef?: { id?: number; nome: string }
  ingredientes: IngredienteReceita[]
  etapas: EtapaReceita[]
  nutricao?: NutricaoReceita
}

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Primeiro valor existente entre as chaves candidatas. */
const pick = (o: Obj, ...chaves: string[]): unknown => {
  for (const k of chaves) if (o[k] !== undefined && o[k] !== null) return o[k]
  return undefined
}
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined)
const num = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN
  return Number.isFinite(n) ? n : undefined
}
const lista = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter(isObj) : [])

function adaptarDica(d: Obj): DicaReceita {
  const autor = pick(d, 'autor', 'chef', 'nomeChef', 'chefNome')
  return {
    id: num(pick(d, 'id', 'idDica')),
    tipo: str(pick(d, 'tipo')) === 'ERRO_COMUM' ? 'ERRO_COMUM' : 'DICA',
    titulo: str(pick(d, 'titulo')) ?? '',
    texto: str(pick(d, 'texto', 'descricao', 'conteudo')) ?? '',
    autor: isObj(autor) ? str(pick(autor, 'nome')) : str(autor),
  }
}

function adaptarEtapa(e: Obj, indice: number): EtapaReceita {
  const ordem = num(pick(e, 'ordem', 'numero', 'posicao')) ?? indice + 1
  const minutos = num(pick(e, 'tempoMinutos', 'minutos'))
  return {
    id: num(pick(e, 'id', 'idEtapa')),
    ordem,
    titulo: str(pick(e, 'titulo', 'nome')) ?? `Etapa ${ordem}`,
    texto: str(pick(e, 'descricao', 'texto', 'instrucao', 'instrucoes', 'modoPreparo')) ?? '',
    segundos: num(pick(e, 'tempoSegundos', 'segundos')) ?? (minutos !== undefined ? minutos * 60 : undefined),
    videoAt: num(pick(e, 'videoAt', 'tempoVideo', 'inicioVideo')),
    imagem: str(pick(e, 'imagem', 'imagemUrl')),
    dicas: lista(pick(e, 'dicas')).map(adaptarDica),
  }
}

function adaptarIngrediente(i: Obj): IngredienteReceita {
  const ing = pick(i, 'ingrediente')
  const nome = str(pick(i, 'nome', 'nomeIngrediente')) ?? (isObj(ing) ? str(pick(ing, 'nome')) : str(ing)) ?? 'Ingrediente'
  return {
    nome,
    quantidade: num(pick(i, 'quantidade', 'qtd', 'qtde')) ?? 0,
    unidade: str(pick(i, 'unidade', 'unidadeMedida')) ?? '',
  }
}

function adaptarNutricao(raw: Obj): NutricaoReceita | undefined {
  const bloco = pick(raw, 'nutricao', 'informacaoNutricional', 'informacoesNutricionais', 'nutricional')
  const f = isObj(bloco) ? bloco : raw
  const n: NutricaoReceita = {
    kcal: num(pick(f, 'kcal', 'calorias', 'energia', 'valorEnergetico')),
    proteinas: num(pick(f, 'proteinas', 'proteina')),
    carboidratos: num(pick(f, 'carboidratos', 'carboidrato')),
    gorduras: num(pick(f, 'gorduras', 'gordura', 'lipidios')),
  }
  return Object.values(n).some((v) => v !== undefined) ? n : undefined
}

function adaptarDetalhe(raw: Obj, idFallback: number): ReceitaDetalhe {
  const chefBruto = pick(raw, 'chef', 'autor')
  const chef = isObj(chefBruto)
    ? { id: num(pick(chefBruto, 'id')), nome: str(pick(chefBruto, 'nome')) ?? 'Chef' }
    : str(chefBruto)
      ? { nome: str(chefBruto) as string }
      : undefined

  return {
    id: num(pick(raw, 'id')) ?? idFallback,
    nome: str(pick(raw, 'nome', 'titulo')) ?? 'Receita',
    descricao: str(pick(raw, 'descricao')),
    imagem: str(pick(raw, 'imagem', 'imagemUrl')),
    videoUrl: str(pick(raw, 'videoUrl', 'video_url', 'video')),
    tempoPreparo: num(pick(raw, 'tempoPreparo', 'tempo_preparo', 'tempoTotal')),
    nPorcoes: num(pick(raw, 'nPorcoes', 'n_porcoes', 'porcoes')) ?? 1,
    dificuldade: str(pick(raw, 'dificuldade')),
    tipo: str(pick(raw, 'tipo')),
    metodo: str(pick(raw, 'metodo')),
    ocasiao: str(pick(raw, 'ocasiao')),
    perfil: str(pick(raw, 'perfil')),
    chef,
    ingredientes: lista(pick(raw, 'ingredientes', 'itens')).map(adaptarIngrediente),
    etapas: lista(pick(raw, 'etapas'))
      .map(adaptarEtapa)
      .sort((a, b) => a.ordem - b.ordem),
    nutricao: adaptarNutricao(raw),
  }
}

/** GET /receitas/{id}?porcoes=N (público). O backend recalcula quantidades e nutrição para N porções. */
export async function buscarReceita(id: string | number, porcoes?: number): Promise<ReceitaDetalhe> {
  const qs = porcoes ? `?porcoes=${porcoes}` : ''
  const bruto = await apiAutenticada<unknown>(`/receitas/${encodeURIComponent(String(id))}${qs}`, null)
  if (import.meta.env.DEV) console.debug('[GastroMatch] GET /receitas/{id}', bruto)
  if (!isObj(bruto)) throw new Error('Resposta inesperada do servidor.')
  return adaptarDetalhe(bruto, Number(id))
}

export type NovaDicaBody = { tipo: DicaReceita['tipo']; titulo: string; texto: string } // confirmar: DicaRequest

/** POST /receitas/{id}/etapas/{idEtapa}/dicas (exige login de chef; hoje o backend só aceita o dono). */
export async function criarDicaEtapa(token: string, receitaId: string | number, etapaId: number, body: NovaDicaBody) {
  await apiAutenticada(`/receitas/${receitaId}/etapas/${etapaId}/dicas`, token, { method: 'POST', body })
}