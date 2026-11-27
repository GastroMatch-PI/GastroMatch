// Gera docs/plano-projeto-integrador-ii.pdf a partir do Markdown.
//   node docs/gerar-pdf.mjs
// Usa o Chrome ou o Edge instalado (ou o caminho em NAVEGADOR). Sem dependências.
// Entende só o que o plano usa: títulos, parágrafos, listas, tabelas, código, negrito e links.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const FONTE = new URL('plano-projeto-integrador-ii.md', import.meta.url)
const SAIDA = fileURLToPath(new URL('plano-projeto-integrador-ii.pdf', import.meta.url))
const NO_GITHUB = 'https://github.com/GastroMatch-PI/GastroMatch/blob/main/docs/'

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const identificador = (t) => t.toLowerCase().replace(/[^\p{L}\p{N} \-_]/gu, '').replace(/ /g, '-')

function linha(texto) {
  const codigos = []
  return escapar(texto)
    .replace(/`([^`]+)`/g, (_, c) => `\u0000${codigos.push(c) - 1}\u0000`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, rotulo, alvo) =>
      `<a href="${alvo.startsWith('#') || /^https?:/.test(alvo) ? alvo : new URL(alvo, NO_GITHUB).href}">${rotulo}</a>`)
    .replace(/&lt;(https?:[^&\s]+)&gt;/g, '<a href="$1">$1</a>')
    .replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codigos[i]}</code>`)
}

function paraHtml(markdown) {
  const linhas = markdown.replace(/\r/g, '').split('\n')
  const saida = []
  const celulas = (l) => l.trim().slice(1, -1).split('|').map((c) => c.trim())
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]
    if (l.startsWith('```')) {
      const bloco = []
      while (++i < linhas.length && !linhas[i].startsWith('```')) bloco.push(linhas[i])
      saida.push(`<pre>${escapar(bloco.join('\n'))}</pre>`)
    } else if (/^#{1,4} /.test(l)) {
      const nivel = l.indexOf(' ')
      const titulo = l.slice(nivel + 1)
      saida.push(`<h${nivel} id="${identificador(titulo)}">${linha(titulo)}</h${nivel}>`)
    } else if (l.startsWith('|')) {
      const cabecalho = celulas(l)
      i++ // linha separadora
      const corpo = []
      while (linhas[i + 1]?.startsWith('|')) corpo.push(celulas(linhas[++i]))
      const tr = (cs, tag) => `<tr>${cs.map((c) => `<${tag}>${linha(c)}</${tag}>`).join('')}</tr>`
      saida.push(`<table><thead>${tr(cabecalho, 'th')}</thead><tbody>${corpo.map((c) => tr(c, 'td')).join('')}</tbody></table>`)
    } else if (/^(-|\d+\.) /.test(l)) {
      const tag = l.startsWith('-') ? 'ul' : 'ol'
      const marca = tag === 'ul' ? /^- / : /^\d+\. /
      const itens = [l.replace(marca, '')]
      while (marca.test(linhas[i + 1] ?? '')) itens.push(linhas[++i].replace(marca, ''))
      // lista numerada interrompida por uma tabela continua do número certo
      const inicio = tag === 'ol' ? ` start="${parseInt(l, 10)}"` : ''
      saida.push(`<${tag}${inicio}>${itens.map((x) => `<li>${linha(x)}</li>`).join('')}</${tag}>`)
    } else if (l.trim()) {
      saida.push(`<p>${linha(l)}</p>`)
    }
  }
  return saida.join('\n')
}

const ESTILO = `
  @page { size: A4; margin: 18mm 16mm; }
  body { font: 10.5pt/1.45 "Segoe UI", Arial, sans-serif; color: #1c1917; }
  h1 { font-size: 20pt; margin: 0 0 6pt; } h2 { font-size: 14pt; margin: 18pt 0 6pt; border-bottom: 1px solid #d6d3d1; }
  h3 { font-size: 11.5pt; margin: 12pt 0 4pt; } h1, h2, h3 { break-after: avoid; }
  table { border-collapse: collapse; width: 100%; margin: 6pt 0; font-size: 9.5pt; }
  th, td { border: 1px solid #d6d3d1; padding: 4pt 6pt; text-align: left; vertical-align: top; } th { background: #f5f5f4; }
  tr, pre { break-inside: avoid; }
  pre { background: #f5f5f4; padding: 8pt; font: 8.5pt/1.35 Consolas, monospace; white-space: pre-wrap; }
  code { font-family: Consolas, monospace; font-size: 9pt; overflow-wrap: anywhere; }
  a { color: #9a3412; }
`

const navegador = [
  process.env.NAVEGADOR,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((c) => c && existsSync(c))
if (!navegador) throw new Error('Chrome ou Edge não encontrado. Informe o caminho em NAVEGADOR.')

const pasta = mkdtempSync(join(tmpdir(), 'plano-'))
const pagina = join(pasta, 'plano.html')
writeFileSync(pagina, `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>GastroMatch: plano do Projeto Integrador II</title><style>${ESTILO}</style></head><body>${paraHtml(readFileSync(FONTE, 'utf8'))}</body></html>`)
rmSync(SAIDA, { force: true })
spawnSync(navegador, [
  '--headless=new', '--disable-gpu', `--user-data-dir=${join(pasta, 'perfil')}`,
  '--no-pdf-header-footer', `--print-to-pdf=${SAIDA}`, pathToFileURL(pagina).href,
], { timeout: 120_000 })
try { rmSync(pasta, { recursive: true, force: true }) } catch { /* o navegador ainda pode estar soltando arquivos */ }
if (!existsSync(SAIDA)) throw new Error('O navegador não gerou o PDF.')
console.log(`PDF gerado em ${SAIDA}`)
