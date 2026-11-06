import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CardRestaurante from '../components/CardRestaurante'
import { EstadoVazio, Paginacao, SkeletonCardRestaurante } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'

const POR_PAGINA = 6

export default function Restaurantes() {
  useSeo({ titulo: 'Restaurantes', descricao: 'Restaurantes cadastrados no GastroMatch, com filtro por cidade, estado e bairro.' })
  const { perfis } = useAuth()
  const [params, setParams] = useSearchParams()
  const [carregando, setCarregando] = useState(true)
  useEffect(() => { const t = setTimeout(() => setCarregando(false), 300); return () => clearTimeout(t) }, [])

  const q = params.get('q') ?? ''
  const cidade = params.get('cidade') ?? ''
  const estado = params.get('estado') ?? ''
  const bairro = params.get('bairro') ?? ''
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)

  const todos = perfis.filter((p) => p.papel === 'RESTAURANTE' && p.status === 'APROVADO')
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v); else p.delete(k)
    if (k !== 'pagina') p.delete('pagina')
    setParams(p)
  }
  const norm = (s?: string) => (s ?? '').toLowerCase()
  const lista = useMemo(
    () => todos
      .filter((r) => !q || norm(r.nome).includes(norm(q)))
      .filter((r) => !cidade || norm(r.cidadeNome).includes(norm(cidade)))
      .filter((r) => !estado || norm(r.estado).includes(norm(estado)))
      .filter((r) => !bairro || norm(r.bairro).includes(norm(bairro))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [perfis, q, cidade, estado, bairro],
  )
  const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const atual = Math.min(pagina, total)
  const filtrando = !!(q || cidade || estado || bairro)

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">Restaurantes</h1>
        <p className="text-sm text-ink-soft" role="status" aria-live="polite">{lista.length} {lista.length === 1 ? 'restaurante' : 'restaurantes'}</p>
      </header>

      <form role="search" className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => e.preventDefault()}>
        <label className="text-xs font-semibold text-ink-soft">Nome<input className="input mt-1" value={q} onChange={(e) => set('q', e.target.value)} /></label>
        <label className="text-xs font-semibold text-ink-soft">Cidade<input className="input mt-1" value={cidade} onChange={(e) => set('cidade', e.target.value)} /></label>
        <label className="text-xs font-semibold text-ink-soft">Estado<input className="input mt-1" value={estado} onChange={(e) => set('estado', e.target.value)} /></label>
        <label className="text-xs font-semibold text-ink-soft">Bairro<input className="input mt-1" value={bairro} onChange={(e) => set('bairro', e.target.value)} /></label>
      </form>

      {carregando ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">{[0, 1, 2].map((i) => <SkeletonCardRestaurante key={i} />)}</div>
      ) : lista.length === 0 ? (
        <EstadoVazio
          titulo={filtrando ? 'Nenhum restaurante com esses filtros' : 'Ainda não há restaurantes cadastrados'}
          texto={filtrando ? 'Tente outra cidade, bairro ou nome.' : 'Seja o primeiro: crie o perfil do seu restaurante.'}
          acao={filtrando ? { onClick: () => setParams(new URLSearchParams()), rotulo: 'Limpar filtros' } : { to: '/onboarding', rotulo: 'Cadastrar restaurante' }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{lista.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA).map((r) => <CardRestaurante key={r.userId} restaurante={r} />)}</div>
      )}
      <Paginacao pagina={atual} total={total} onMudar={(p) => set('pagina', p === 1 ? '' : String(p))} />
    </div>
  )
}
