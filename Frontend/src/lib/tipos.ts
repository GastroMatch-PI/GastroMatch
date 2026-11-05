export type Conta = { id: string; email: string; username: string; hash: string }
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
  chefVinculado?: string // restaurante exige chef
  restauranteDoChef?: string
  instagram?: string
  whatsapp?: string
  comprovante?: string
}
export type IngReceita = { cat?: string; name: string; qty: number; unit: string }
export type EtapaR = { title: string; text: string; seconds?: number; videoAt?: number; image?: string }
export type Dica = { id: number; tipo: 'DICA' | 'ERRO_COMUM'; titulo: string; texto: string; autor: string }
export type Comentario = { id: number; autor: string; texto: string; nota: number; quando: string }
export type Denuncia = { id: number; receita: string; comentario: number; motivo: string; autor: string; quando: string; resolvida: boolean }

export async function hash(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
