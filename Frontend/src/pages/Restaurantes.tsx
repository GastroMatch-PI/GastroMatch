import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CardRestaurante from '../components/CardRestaurante'
import { Carregando, ErroApi, EstadoVazio, Paginacao } from '../components/Ui'
import { qs } from '../lib/api'
import type { Pagina, RestauranteResumo } from '../lib/apiTipos'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'

const TAMANHO = 12
const CAMPOS = [['texto', 'Nome ou descrição'], ['cidade', 'Cidade'], ['estado', 'Estado'], ['bairro', 'Bairro']] as const

export default function Restaurantes() {
  useSeo({ titulo: 'Restaurantes', descricao: 'Restaurantes cadastrados no GastroMatch, com filtro por cidade, estado e bairro.' })
  const [params, setParams] = useSearchParams()
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)
  const [local, setLocal] = useState<Record<string, string>>(() => Object.fromEntries(CAMPOS.map(([k]) => [k, params.get(k) ?? ''])))

  // filtros com debounce: a URL (e a consulta) só muda depois de parar de digitar
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams(params)
      let mudou = false
      for (const [k] of CAMPOS) { const v = local[k].trim(); if ((p.get(k) ?? '') !== v) { mudou = true; if (v) p.set(k, v); else p.delete(k) } }
      if (mudou) { p.delete('pagina'); setParams(p) }
    }, 400)
    return () => clearTimeout(t)
  }, [local]) // eslint-disable-line react-hooks/exhaustive-deps

  const { dados, carregando, erro, lento, recarregar } = useApi<Pagina<RestauranteResumo>>(
    `/restaurantes${qs({ texto: params.get('texto'), cidade: params.get('cidade'), estado: params.get('estado'), bairro: params.get('bairro'), pagina: pagina - 1, tamanho: TAMANHO })}`,
  )
  const filtrando = CAMPOS.some(([k]) => params.get(k))

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">Restaurantes</h1>
        <p className="text-sm text-ink-soft" role="status" aria-live="polite">{dados ? `${dados.totalElementos} ${dados.totalElementos === 1 ? 'restaurante' : 'restaurantes'}` : ' '}</p>
      </header>

      <form role="search" className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => e.preventDefault()}>
        {CAMPOS.map(([k, rotulo]) => (
          <label key={k} className="text-xs font-semibold text-ink-soft">{rotulo}<input className="input mt-1" value={local[k]} onChange={(e) => setLocal({ ...local, [k]: e.target.value })} /></label>
        ))}
      </form>

      {erro ? <ErroApi erro={erro} onTentar={recarregar} />
        : !dados ? <Carregando lento={lento} texto="Carregando restaurantes" />
        : dados.conteudo.length === 0 ? (
          <EstadoVazio
            titulo={filtrando ? 'Nenhum restaurante com esses filtros' : 'Ainda não há restaurantes cadastrados'}
            texto={filtrando ? 'Tente outra cidade, bairro ou nome.' : 'Seja o primeiro: crie o perfil do seu restaurante.'}
            acao={filtrando ? { onClick: () => { setLocal({ texto: '', cidade: '', estado: '', bairro: '' }); setParams(new URLSearchParams()) }, rotulo: 'Limpar filtros' } : { to: '/onboarding', rotulo: 'Cadastrar restaurante' }}
          />
        ) : (
          <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${carregando ? 'opacity-60' : ''}`}>{dados.conteudo.map((r) => <CardRestaurante key={r.id} restaurante={r} />)}</div>
        )}
      <Paginacao pagina={pagina} total={dados?.totalPaginas ?? 1} onMudar={(p) => { const n = new URLSearchParams(params); if (p === 1) n.delete('pagina'); else n.set('pagina', String(p)); setParams(n) }} />
    </div>
  )
}
