// Tipos das respostas da API (ver os DTOs em Backend/src/main/java/com/gastromatch/dto).
export type Pagina<T> = { conteudo: T[]; pagina: number; tamanho: number; totalElementos: number; totalPaginas: number }

export type Usuario = { id: number; email: string; username: string; capa?: string | null }
export type SessaoDto = { accessToken: string; refreshToken: string; tokenType: string; expiresIn: number; usuario: Usuario }

export type Dificuldade = 'FACIL' | 'MEDIO' | 'DIFICIL'
export type TipoRefeicao = 'CAFE_DA_MANHA' | 'ALMOCO' | 'JANTAR' | 'LANCHE' | 'SOBREMESA'
export type MetodoPreparo = 'FORNO' | 'AIR_FRYER' | 'GRELHA' | 'FOGAO'
export type Ocasiao = 'ANIVERSARIO' | 'CHURRASCO' | 'NATAL' | 'DIA_A_DIA'
export type PerfilAlimentar = 'VEGANO' | 'VEGETARIANO' | 'LOW_CARB' | 'SEM_GLUTEN' | 'SEM_LACTOSE'
export type Especializacao = 'CONFEITARIA' | 'PANIFICACAO' | 'CARNES' | 'MASSAS' | 'COZINHA_VEGETARIANA'
export type UnidadeMedida = 'G' | 'ML' | 'UNIDADE' | 'XICARA'
export type TipoDica = 'DICA' | 'ERRO_COMUM'

export type ChefResumo = { id: number; username: string; especializacao?: Especializacao | null }

export type ReceitaResumo = {
  id: number; nome: string; descricao?: string | null; imagem?: string | null
  tempoPreparo: number; nPorcoes: number
  dificuldade: Dificuldade; tipo: TipoRefeicao; metodoPreparo?: MetodoPreparo | null; ocasiao?: Ocasiao | null; perfil?: PerfilAlimentar | null
  chef: ChefResumo
}

export type Dica = { id: number; tipo: TipoDica; conteudo: string; idChef: number }
export type Etapa = { id: number; ordem: number; titulo: string; instrucao: string; timestampVideo?: number | null; imagem?: string | null; dicas: Dica[] }
export type IngredienteDaReceita = { idIngrediente: number; nome: string; quantidade: number; unidadeMedida: UnidadeMedida }
export type Valores = { calorias: number; gordura: number; proteina: number; carboidrato: number }
export type Nutricao = { total: Valores; porPorcao: Valores; completa: boolean; naoCalculados: string[] }

export type ReceitaDetalhe = Omit<ReceitaResumo, 'chef'> & {
  videoUrl?: string | null
  porcoes: number
  chef: ChefResumo
  ingredientes: IngredienteDaReceita[]
  nutricao: Nutricao
  etapas: Etapa[]
}

export type Ingrediente = { id: number; nome: string; porcaoBase: number; calorias: number; gordura: number; proteina: number; carboidrato: number }

export type Comentario = {
  id: number; idReceita: number; idUsuario: number; username: string; texto: string
  nota?: number | null; foto?: string | null; criadoEm: string; atualizadoEm?: string | null
}

// Perfis profissionais
export type ChefPerfil = { id: number; username: string; bio?: string | null; especializacao?: Especializacao | null; idRestaurante?: number | null; nomeRestaurante?: string | null }
export type ChefMe = { id: number; idProfissional: number; bio?: string | null; especializacao?: Especializacao | null; idRestaurante?: number | null }
export type NutricionistaResumo = { id: number; username: string; bio?: string | null; crn: string }
export type NutricionistaMe = { id: number; idProfissional: number; bio?: string | null; crn: string; statusVerificacao: string }
export type EnderecoRestaurante = {
  nome: string; bio?: string | null; numero?: number | null; rua?: string | null; cep?: string | null
  bairro?: string | null; cidade?: string | null; estado?: string | null; latitude?: number | null; longitude?: number | null
}
export type RestauranteResumo = EnderecoRestaurante & { id: number }
export type RestauranteDetalhe = RestauranteResumo & { chefs: ChefResumo[] }
export type RestauranteMe = RestauranteResumo & { idProfissional: number; cnpj: string }

export type PerfilProfissional =
  | { papel: 'CHEF'; dados: ChefMe }
  | { papel: 'NUTRICIONISTA'; dados: NutricionistaMe }
  | { papel: 'RESTAURANTE'; dados: RestauranteMe }

export function enderecoDe(r: EnderecoRestaurante): string {
  const l1 = [r.rua, r.numero].filter(Boolean).join(', ')
  const l2 = [r.bairro, [r.cidade, r.estado].filter(Boolean).join(' - ')].filter(Boolean).join(' · ')
  return [l1, l2].filter(Boolean).join(' — ')
}
