import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { calcularIndicadores, tratar, validar } from './indicadores.mjs'

const registro = (mudancas = {}) => ({
  id: 1, nome: 'Receita', tipo: 'ALMOCO', dificuldade: 'FACIL', perfil: 'VEGANO',
  tempoPreparo: 20, nPorcoes: 2, nutricaoCompleta: true, caloriasPorPorcao: 300,
  notaMedia: 4, notas: 2, ...mudancas,
})

describe('validar', () => {
  it('aceita um registro correto', () => assert.deepEqual(validar(registro()), []))

  it('aceita receita sem perfil e sem nota (dados ausentes, não inválidos)', () =>
    assert.deepEqual(validar(registro({ perfil: null, notas: 0, notaMedia: null })), []))

  it('diz o motivo de cada campo inválido', () => {
    const motivos = validar(registro({ nome: ' ', tempoPreparo: 0, tipo: 'CEIA', notaMedia: 6, caloriasPorPorcao: -1 }))
    assert.equal(motivos.length, 5)
    for (const campo of ['nome', 'tempoPreparo', 'tipo', 'notaMedia', 'caloriasPorPorcao']) {
      assert.ok(motivos.some((m) => m.startsWith(campo)), campo)
    }
  })

  it('recusa nota média sem nenhuma nota', () =>
    assert.equal(validar(registro({ notas: 0, notaMedia: 3 })).length, 1))
})

describe('tratar', () => {
  it('separa os rejeitados, com o motivo, e marca o id repetido', () => {
    const { validos, rejeitados } = tratar([registro(), registro(), registro({ id: 2, nPorcoes: 0 })])
    assert.equal(validos.length, 1)
    assert.deepEqual(rejeitados.map((r) => r.id), [1, 2])
    assert.match(rejeitados[0].motivos[0], /repetido/)
  })

  it('agrupa receita sem perfil como SEM_PERFIL', () =>
    assert.equal(tratar([registro({ perfil: null })]).validos[0].perfil, 'SEM_PERFIL'))
})

describe('calcularIndicadores', () => {
  const dados = [
    registro({ id: 1, perfil: 'VEGANO', nutricaoCompleta: true, notaMedia: 5, notas: 1 }),
    registro({ id: 2, perfil: 'VEGANO', nutricaoCompleta: false, notaMedia: 3, notas: 3 }),
    registro({ id: 3, perfil: 'LOW_CARB', nutricaoCompleta: true, notaMedia: null, notas: 0 }),
    registro({ id: 4, perfil: 'SEM_PERFIL', nutricaoCompleta: true, notaMedia: 4, notas: 1 }),
  ]
  const r = calcularIndicadores(dados)

  it('cobertura nutricional: completas sobre o total', () =>
    assert.deepEqual(r.coberturaNutricional, { completas: 3, total: 4, percentual: 75 }))

  it('oferta por perfil, da maior para a menor', () => {
    assert.equal(r.porPerfil[0].perfil, 'VEGANO')
    assert.equal(r.porPerfil[0].receitas, 2)
    assert.equal(r.porPerfil[0].oferta, 50)
  })

  it('avaliação por perfil pesa cada receita pela quantidade de notas', () =>
    assert.equal(r.porPerfil.find((p) => p.perfil === 'VEGANO').avaliacao, 3.5))

  it('perfil sem nenhuma nota fica sem avaliação, e não com zero', () =>
    assert.equal(r.porPerfil.find((p) => p.perfil === 'LOW_CARB').avaliacao, null))

  it('sem dados, não divide por zero', () =>
    assert.deepEqual(calcularIndicadores([]).coberturaNutricional, { completas: 0, total: 0, percentual: null }))
})
