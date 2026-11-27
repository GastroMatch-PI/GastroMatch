// Indicadores do GastroMatch: coleta na API, valida, trata, calcula e escreve o relatório.
//
//   node Data/indicadores/indicadores.mjs                      coleta da API publicada
//   API_URL=http://localhost:8080 node Data/indicadores/indicadores.mjs
//   node Data/indicadores/indicadores.mjs --amostra            recalcula com a amostra salva
//
// Não usa dependências: só Node 22 ou mais novo.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const TIPOS = ['CAFE_DA_MANHA', 'ALMOCO', 'JANTAR', 'LANCHE', 'SOBREMESA']
const DIFICULDADES = ['FACIL', 'MEDIO', 'DIFICIL']
const PERFIS = ['VEGANO', 'VEGETARIANO', 'LOW_CARB', 'SEM_GLUTEN', 'SEM_LACTOSE', 'SEM_PERFIL']

const RAIZ = new URL('../../', import.meta.url)
const AMOSTRA = new URL('Data/amostra/receitas.json', RAIZ)
const RELATORIO = new URL('docs/evidencias/indicadores.md', RAIZ)

/** Devolve a lista de motivos pelos quais o registro não pode entrar nos indicadores. */
export function validar(r) {
  const motivos = []
  const exigir = (ok, campo, regra) => { if (!ok) motivos.push(`${campo}: ${regra}`) }
  const inteiroPositivo = (v) => Number.isInteger(v) && v > 0

  exigir(inteiroPositivo(r.id), 'id', 'deve ser um inteiro positivo')
  exigir(typeof r.nome === 'string' && r.nome.trim() !== '', 'nome', 'é obrigatório')
  exigir(TIPOS.includes(r.tipo), 'tipo', 'fora da lista de refeições')
  exigir(DIFICULDADES.includes(r.dificuldade), 'dificuldade', 'fora da lista')
  exigir(r.perfil == null || PERFIS.includes(r.perfil), 'perfil', 'fora da lista de perfis')
  exigir(inteiroPositivo(r.tempoPreparo), 'tempoPreparo', 'deve ser maior que zero')
  exigir(inteiroPositivo(r.nPorcoes), 'nPorcoes', 'deve ser maior que zero')
  exigir(typeof r.nutricaoCompleta === 'boolean', 'nutricaoCompleta', 'deve ser verdadeiro ou falso')
  exigir(Number.isFinite(r.caloriasPorPorcao) && r.caloriasPorPorcao >= 0, 'caloriasPorPorcao', 'não pode ser negativo')
  exigir(Number.isInteger(r.notas) && r.notas >= 0, 'notas', 'deve ser um inteiro, zero ou mais')
  if (r.notas > 0) exigir(Number.isFinite(r.notaMedia) && r.notaMedia >= 0 && r.notaMedia <= 5, 'notaMedia', 'deve estar entre 0 e 5')
  else exigir(r.notaMedia == null, 'notaMedia', 'não pode existir sem nenhuma nota')
  return motivos
}

/** Separa válidos de rejeitados e preenche o dado ausente (perfil) sem inventar valor. */
export function tratar(registros) {
  const validos = []
  const rejeitados = []
  const vistos = new Set()
  for (const r of registros) {
    const motivos = validar(r)
    if (vistos.has(r.id)) motivos.unshift('id: repetido')
    vistos.add(r.id)
    if (motivos.length) rejeitados.push({ id: r.id, motivos })
    else validos.push({ ...r, perfil: r.perfil ?? 'SEM_PERFIL' })
  }
  return { validos, rejeitados }
}

const arredondar = (v, casas = 1) => Math.round(v * 10 ** casas) / 10 ** casas
const percentual = (parte, total) => (total ? arredondar((parte / total) * 100) : null)

export function calcularIndicadores(receitas) {
  const total = receitas.length
  const completas = receitas.filter((r) => r.nutricaoCompleta).length

  const grupos = new Map()
  for (const r of receitas) {
    const g = grupos.get(r.perfil) ?? { receitas: 0, notas: 0, soma: 0 }
    g.receitas += 1
    g.notas += r.notas
    g.soma += (r.notaMedia ?? 0) * r.notas
    grupos.set(r.perfil, g)
  }
  const porPerfil = [...grupos]
    .map(([perfil, g]) => ({
      perfil,
      receitas: g.receitas,
      oferta: percentual(g.receitas, total),
      notas: g.notas,
      avaliacao: g.notas ? arredondar(g.soma / g.notas, 2) : null,
    }))
    .sort((a, b) => b.receitas - a.receitas || a.perfil.localeCompare(b.perfil))

  return { coberturaNutricional: { completas, total, percentual: percentual(completas, total) }, porPerfil }
}

async function buscar(url) {
  // A primeira chamada pode demorar: o plano grátis do Render "dorme".
  const resposta = await fetch(url, { signal: AbortSignal.timeout(240_000) })
  if (!resposta.ok) throw new Error(`${url} respondeu ${resposta.status}`)
  return resposta.json()
}

/** Ingestão: guarda só o que os indicadores usam. Nenhum dado de pessoa é coletado. */
async function coletar(api) {
  const resumos = []
  for (let pagina = 0, paginas = 1; pagina < paginas; pagina++) {
    const p = await buscar(`${api}/receitas?pagina=${pagina}&tamanho=50`)
    resumos.push(...p.conteudo)
    paginas = p.totalPaginas
  }
  const registros = []
  for (const r of resumos) {
    const detalhe = await buscar(`${api}/receitas/${r.id}`)
    const { avaliacao } = await buscar(`${api}/receitas/${r.id}/comentarios?tamanho=1`)
    registros.push({
      id: r.id, nome: r.nome, tipo: r.tipo, dificuldade: r.dificuldade, perfil: r.perfil,
      tempoPreparo: r.tempoPreparo, nPorcoes: r.nPorcoes,
      nutricaoCompleta: detalhe.nutricao.completa,
      caloriasPorPorcao: detalhe.nutricao.porPorcao.calorias,
      notaMedia: avaliacao.media, notas: avaliacao.quantidade,
    })
  }
  return { origem: api, coletadoEm: new Date().toISOString(), registros }
}

function relatorio({ origem, coletadoEm, registros }, { validos, rejeitados }, ind) {
  const c = ind.coberturaNutricional
  const ou = (v, sufixo = '') => (v == null ? 'sem dados' : `${String(v).replace('.', ',')}${sufixo}`)
  return `# Indicadores do GastroMatch

> Arquivo gerado por \`Data/indicadores/indicadores.mjs\`. Não edite à mão.

- **Origem:** API do GastroMatch em ${origem}
- **Coleta:** ${coletadoEm}
- **Registros:** ${registros.length} recebidos, ${validos.length} válidos, ${rejeitados.length} rejeitados

## 1. Cobertura nutricional: ${ou(c.percentual, '%')}

${c.completas} de ${c.total} receitas têm a tabela nutricional completa.

## 2 e 3. Oferta e avaliação por perfil alimentar

| Perfil | Receitas | Oferta | Notas | Avaliação média (0 a 5) |
|---|---|---|---|---|
${ind.porPerfil.map((p) => `| ${p.perfil} | ${p.receitas} | ${ou(p.oferta, '%')} | ${p.notas} | ${ou(p.avaliacao)} |`).join('\n')}

## Registros rejeitados

${rejeitados.length ? rejeitados.map((r) => `- Receita ${r.id}: ${r.motivos.join('; ')}`).join('\n') : 'Nenhum registro rejeitado nesta coleta.'}

Fórmulas e interpretação: [plano do projeto](../plano-projeto-integrador-ii.md#8-indicadores).
`
}

async function principal() {
  const usarAmostra = process.argv.includes('--amostra')
  const coleta = usarAmostra
    ? JSON.parse(await readFile(AMOSTRA, 'utf8'))
    : await coletar((process.env.API_URL ?? 'https://gastromatch-7tu6.onrender.com').replace(/\/$/, ''))
  const tratados = tratar(coleta.registros)
  const indicadores = calcularIndicadores(tratados.validos)

  await mkdir(new URL('.', RELATORIO), { recursive: true })
  await writeFile(RELATORIO, relatorio(coleta, tratados, indicadores))
  if (!usarAmostra) {
    await mkdir(new URL('.', AMOSTRA), { recursive: true })
    await writeFile(AMOSTRA, JSON.stringify(coleta, null, 2) + '\n')
  }
  for (const r of tratados.rejeitados) console.warn(`rejeitada: receita ${r.id} (${r.motivos.join('; ')})`)
  console.log(`${tratados.validos.length} receitas válidas, ${tratados.rejeitados.length} rejeitadas. Relatório em ${fileURLToPath(RELATORIO)}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((erro) => {
    console.error(`Falha ao calcular os indicadores: ${erro.message}`)
    process.exit(1)
  })
}
