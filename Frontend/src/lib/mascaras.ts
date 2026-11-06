// Máscaras leves de entrada. O valor guardado/enviado é sempre só os dígitos.
export const soDigitos = (v: string) => v.replace(/\D/g, '')

export function mascaraCNPJ(v: string) {
  const d = soDigitos(v).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function mascaraCEP(v: string) {
  const d = soDigitos(v).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export function mascaraTelefone(v: string) {
  const d = soDigitos(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** CRN com região: CRN-3/12345 (região 1 a 10). */
export function mascaraCRN(v: string) {
  const d = soDigitos(v).slice(0, 8)
  if (!d) return ''
  const reg = d.startsWith('10') ? '10' : d.slice(0, 1)
  const resto = d.slice(reg.length)
  return resto ? `CRN-${reg}/${resto}` : `CRN-${reg}`
}

export const validaCNPJ = (v: string) => soDigitos(v).length === 14
export const validaCEP = (v: string) => soDigitos(v).length === 8
