export type Conta = { id: string; email: string; username: string; hash: string; capa?: string; admin?: boolean }
export type Papel = 'CHEF' | 'NUTRICIONISTA' | 'RESTAURANTE'
export type Status = 'PENDENTE' | 'APROVADO' | 'REJEITADO'
export type PerfilPro = {
  userId: string
  papel: Papel
  nome: string
  bio: string
  status: Status
  especializacao?: string
  crn?: string
  cnpj?: string
  endereco?: string
  cidade?: string
  chefVinculado?: string // (legado) nome do chef
  chefIds?: string[] // restaurante: ids (userId) dos chefs vinculados
  restauranteDoChef?: string // chef: id (userId) do restaurante onde atua
  rua?: string
  numero?: string
  bairro?: string
  cidadeNome?: string
  estado?: string
  cep?: string
  capa?: string
  instagram?: string
  whatsapp?: string
  comprovante?: string
  motivo?: string // motivo da rejeição
  enviadoEm?: number
}
export type IngReceita = { cat?: string; name: string; qty: number; unit: string }
export type EtapaR = { title: string; text: string; seconds?: number; videoAt?: number; image?: string }
export type Dica = { id: number; etapa: number; tipo: 'DICA' | 'ERRO_COMUM'; titulo: string; texto: string; autor: string; autorId?: string }
export type Comentario = { id: number; autorId?: string; autor: string; texto: string; nota: number; quando: number | string; foto?: string; editado?: boolean }
export type Decisao = { id: number; quando: number; nome: string; papel: Papel; decisao: Status; motivo?: string; por: string }
export type Denuncia = { id: number; receita: string; comentario: number; motivo: string; autor: string; quando: string; resolvida: boolean }

export async function hash(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function enderecoCompleto(p: Pick<PerfilPro, 'rua' | 'numero' | 'bairro' | 'cidadeNome' | 'estado' | 'endereco' | 'cidade'>) {
  const linha1 = [p.rua, p.numero].filter(Boolean).join(', ')
  const linha2 = [p.bairro, [p.cidadeNome, p.estado].filter(Boolean).join(' - ')].filter(Boolean).join(' · ')
  return [linha1, linha2].filter(Boolean).join(' — ') || [p.endereco, p.cidade].filter(Boolean).join(' · ')
}
