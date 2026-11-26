// Módulo único de validação de formulários. Mensagens em português.
export type Regra = (valor: string, todos: Record<string, string>) => string | null
export type Esquema = Record<string, Regra[]>

export const obrigatorio =
  (msg = 'Campo obrigatório'): Regra =>
  (v) => (v.trim() === '' ? msg : null)

export const email =
  (msg = 'E-mail inválido'): Regra =>
  (v) => (v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : msg)

export const tamanho =
  (min: number, max: number, msg?: string): Regra =>
  (v) => {
    if (v === '') return null
    if (v.length < min) return msg ?? `Use pelo menos ${min} caracteres`
    if (v.length > max) return msg ?? `Use no máximo ${max} caracteres`
    return null
  }

export const igualA =
  (campo: string, msg = 'Os valores não conferem'): Regra =>
  (v, todos) => (v === (todos[campo] ?? '') ? null : msg)

export const numero =
  (min?: number, msg?: string): Regra =>
  (v) => {
    if (v === '') return null
    const n = Number(v.replace(',', '.'))
    if (Number.isNaN(n)) return msg ?? 'Informe um número'
    if (min !== undefined && n < min) return msg ?? `O valor mínimo é ${min}`
    return null
  }

export const url =
  (msg = 'Informe um link http ou https válido'): Regra =>
  (v) => (v === '' || /^https?:\/\/\S+$/.test(v) ? null : msg)

export const youtube =
  (msg = 'Use um link do YouTube (youtube.com ou youtu.be)'): Regra =>
  (v) =>
    v === '' || /^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]{11}([?&#]\S*)?$/.test(v) ? null : msg

export const padrao =
  (re: RegExp, msg: string): Regra =>
  (v) => (v === '' || re.test(v) ? null : msg)

/** Primeiro erro de um campo (ou null). */
export function validarCampo(valor: string, regras: Regra[], todos: Record<string, string> = {}): string | null {
  for (const r of regras) {
    const e = r(valor, todos)
    if (e) return e
  }
  return null
}

/** Erros de todos os campos do esquema. */
export function validarTodos(valores: Record<string, string>, esquema: Esquema): Record<string, string> {
  const erros: Record<string, string> = {}
  for (const [campo, regras] of Object.entries(esquema)) {
    const e = validarCampo(valores[campo] ?? '', regras, valores)
    if (e) erros[campo] = e
  }
  return erros
}

/** Primeiro campo com erro, na ordem do esquema (para dar foco). */
export function primeiroErro(erros: Record<string, string>, esquema: Esquema): string | undefined {
  return Object.keys(esquema).find((c) => erros[c])
}

// Política de senha igual à do back end (B26): 10 a 72 caracteres e pelo menos 3 dos 4 tipos
// de caractere. A lista de senhas proibidas e a checagem contra e-mail/username só existem
// no back end (dependem da conta e de um arquivo de recursos); aqui só o essencial de tamanho
// e mistura, para orientar antes de enviar.
export const POLITICA_SENHA = { min: 10, max: 72, tiposExigidos: 3 }
function tiposDeCaractere(s: string) {
  const minuscula = /[a-z]/.test(s)
  const maiuscula = /[A-Z]/.test(s)
  const numero = /\d/.test(s)
  const simbolo = /[^A-Za-z0-9]/.test(s)
  return [minuscula, maiuscula, numero, simbolo].filter(Boolean).length
}
export function requisitosSenha(s: string) {
  return [
    { ok: s.length >= POLITICA_SENHA.min, texto: `Pelo menos ${POLITICA_SENHA.min} caracteres` },
    { ok: s.length <= POLITICA_SENHA.max, texto: `No máximo ${POLITICA_SENHA.max} caracteres` },
    {
      ok: tiposDeCaractere(s) >= POLITICA_SENHA.tiposExigidos,
      texto: 'Misture letra minúscula, maiúscula, número e símbolo (pelo menos 3 tipos)',
    },
  ]
}

/** Regra de formulário: primeiro requisito de requisitosSenha() que falhar. */
export const senhaForte =
  (): Regra =>
  (v) => {
    if (v === '') return null
    const falha = requisitosSenha(v).find((r) => !r.ok)
    return falha ? falha.texto : null
  }
/** Força de 0 a 4 (só orienta; a regra obrigatória é a política acima). */
export function forcaSenha(s: string): number {
  let n = 0
  if (s.length >= 8) n++
  if (s.length >= 12) n++
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) n++
  if (/\d/.test(s) && /[^A-Za-z0-9]/.test(s)) n++
  return n
}
