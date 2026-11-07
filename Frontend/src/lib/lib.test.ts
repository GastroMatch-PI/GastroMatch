import { describe, expect, it } from 'vitest'
import { comCarregamento } from './carregamento'
import { dataRelativa, fmtNum, paginasVisiveis } from './format'
import { mascaraCEP, mascaraCNPJ, mascaraCRN, mascaraTelefone, soDigitos } from './mascaras'
import { email, forcaSenha, igualA, numero, obrigatorio, primeiroErro, requisitosSenha, tamanho, url, validarCampo, validarTodos, youtube } from './validar'

describe('validar', () => {
  it('obrigatório, e-mail, tamanho e igualdade', () => {
    expect(obrigatorio()('  ', {})).toBe('Campo obrigatório')
    expect(obrigatorio()('a', {})).toBeNull()
    expect(email()('a@b', {})).toBe('E-mail inválido')
    expect(email()('a@b.com', {})).toBeNull()
    expect(tamanho(8, 72)('1234567', {})).toMatch(/pelo menos 8/)
    expect(tamanho(1, 3)('abcd', {})).toMatch(/no máximo 3/)
    expect(igualA('s')('x', { s: 'y' })).toBe('Os valores não conferem')
    expect(igualA('s')('y', { s: 'y' })).toBeNull()
  })
  it('número, url e youtube', () => {
    expect(numero(1)('0', {})).toMatch(/mínimo/)
    expect(numero()('abc', {})).toBe('Informe um número')
    expect(numero(1)('2,5', {})).toBeNull()
    expect(url()('ftp://x', {})).not.toBeNull()
    expect(url()('https://x.com/a.jpg', {})).toBeNull()
    expect(youtube()('https://youtu.be/abcdefghijk', {})).toBeNull()
    expect(youtube()('https://youtube.com.golpe.com/watch?v=abcdefghijk', {})).not.toBeNull()
  })
  it('esquema completo', () => {
    const esquema = { nome: [obrigatorio()], mail: [obrigatorio(), email()] }
    const erros = validarTodos({ nome: '', mail: 'x' }, esquema)
    expect(erros).toEqual({ nome: 'Campo obrigatório', mail: 'E-mail inválido' })
    expect(primeiroErro(erros, esquema)).toBe('nome')
    expect(validarCampo('', [obrigatorio('x')])).toBe('x')
  })
  it('senha', () => {
    expect(requisitosSenha('abc').some((r) => !r.ok)).toBe(true)
    expect(requisitosSenha('abcdefgh').every((r) => r.ok)).toBe(false)
    expect(requisitosSenha('Abacaxi#2025').every((r) => r.ok)).toBe(true)
    expect(forcaSenha('abc')).toBe(0)
    expect(forcaSenha('Abcdefgh1234!')).toBe(4)
  })
})

describe('máscaras', () => {
  it('CNPJ aceita colar com pontuação e devolve só dígitos', () => {
    expect(mascaraCNPJ('12.345.678/0001-95')).toBe('12.345.678/0001-95')
    expect(mascaraCNPJ('12345678000195')).toBe('12.345.678/0001-95')
    expect(soDigitos(mascaraCNPJ('12.345.678/0001-95'))).toBe('12345678000195')
  })
  it('CEP, telefone e CRN', () => {
    expect(mascaraCEP('18010000')).toBe('18010-000')
    expect(mascaraCEP('180')).toBe('180')
    expect(mascaraTelefone('11987654321')).toBe('(11) 98765-4321')
    expect(mascaraTelefone('1133334444')).toBe('(11) 3333-4444')
    expect(mascaraCRN('348190')).toBe('CRN-3/48190')
    expect(mascaraCRN('1012345')).toBe('CRN-10/12345')
    expect(mascaraCRN('')).toBe('')
  })
})

describe('formatadores', () => {
  it('data relativa', () => {
    const agora = Date.parse('2026-11-05T12:00:00Z')
    expect(dataRelativa(agora - 5_000, agora)).toBe('agora')
    expect(dataRelativa(agora - 5 * 60_000, agora)).toBe('há 5 min')
    expect(dataRelativa(agora - 3 * 3_600_000, agora)).toBe('há 3 h')
    expect(dataRelativa(agora - 86_400_000, agora)).toBe('há 1 dia')
  })
  it('número e paginação com 1, 3 e 50 páginas', () => {
    expect(fmtNum(1.5)).toBe('1,5')
    expect(paginasVisiveis(1, 1)).toEqual([1])
    expect(paginasVisiveis(2, 3)).toEqual([1, 2, 3])
    expect(paginasVisiveis(25, 50)).toEqual([1, '…', 24, 25, 26, '…', 50])
    expect(paginasVisiveis(1, 50)).toEqual([1, 2, '…', 50])
  })
})

describe('comCarregamento', () => {
  it('marca aria-busy e desabilita os controles durante a promessa, e restaura no fim', async () => {
    document.body.innerHTML = '<div id="x"><button id="b">ok</button><button id="d" disabled>off</button></div>'
    const el = document.getElementById('x')!
    let fim!: (v: number) => void
    const p = comCarregamento(new Promise<number>((r) => { fim = r }), el)
    expect(el.getAttribute('aria-busy')).toBe('true')
    expect((document.getElementById('b') as HTMLButtonElement).disabled).toBe(true)
    fim(7)
    expect(await p).toBe(7)
    expect(el.hasAttribute('aria-busy')).toBe(false)
    expect((document.getElementById('b') as HTMLButtonElement).disabled).toBe(false)
    expect((document.getElementById('d') as HTMLButtonElement).disabled).toBe(true)
  })
  it('sem elemento, apenas devolve a promessa', async () => {
    expect(await comCarregamento(Promise.resolve(1), null)).toBe(1)
  })
})
