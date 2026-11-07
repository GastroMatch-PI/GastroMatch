import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adaptarRestaurante, listarRestaurantes, type RestauranteResumoDto } from '../api/restaurantes'
import CardRestaurante from '../components/CardRestaurante'
import { EstadoVazio, Paginacao, SkeletonCardRestaurante } from '../components/Ui'
import { useSeo } from '../lib/seo'

const POR_PAGINA = 6

export default function Restaurantes() {
  useSeo({ titulo: 'Restaurantes', descricao: 'Restaurantes cadastrados no GastroMatch, com filtro por cidade, estado e bairro.' })
  const [params, setParams] = useSearchParams()
  const [itens, setItens] = useState<RestauranteResumoDto[]>([])
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const q = params.get('q') ?? ''
  const cidade = params.get('cidade') ?? ''
  const estado = params.get('estado') ?? ''
  const bairro = params.get('bairro') ?? ''
  const pagina = Math.max(1, Number(params.get('pagina')) || 1)
  const filtrando = !!(q || cidade || estado || bairro)
  const chave = JSON.stringify({ q, cidade, estado, bairro, pagina })

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')
    const t = setTimeout(() => {
      listarRestaurantes({
        texto: q.trim() || undefined,
        cidade: cidade.trim() || undefined,
        estado: estado.trim() || undefined,
        bairro: bairro.trim() || undefined,
        pagina: pagina - 1,
        tamanho: POR_PAGINA,
      })
        .then((p) => {
          if (!ativo) return
          setItens(p.itens)
          setTotalPaginas(Math.max(1, p.totalPaginas))
        })
        .catch((e) => {
          if (ativo) setErro((e as Error).message)
        })
        .finally(() => {
          if (ativo) setCarregando(false)
        })
    }, 300)
    return () => {
      ativo = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  const restaurantes = useMemo(() => itens.map(adaptarRestaurante), [itens])
  const atual = Math.min(pagina, totalPaginas)

  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    if (k !== 'pagina') p.delete('pagina')
    setParams(p)
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">Restaurantes</h1>
        <p className="text-sm text-ink-soft" role="status" aria-live="polite">
          Página {atual} de {totalPaginas}
        </p>
      </header>

      <form role="search" className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => e.preventDefault()}>
        <label className="text-xs font-semibold text-ink-soft">Nome<input className="input mt-1" value={q} onChange={(e) => set('q', e.target.value)} /></label>
        <label className="text-xs font-semibold text-ink-soft">Cidade<input className="input mt-1" value={cidade} onChange={(e) => set('cidade', e.target.value)} /></label>
        <label className="text-xs font-semibold text-ink-soft">Estado<input className="input mt-1" value={estado} onChange={(e) => set('estado', e.target.value)} /></label>
        <label className="text-xs font-semibold text-ink-soft">Bairro<input className="input mt-1" value={bairro} onChange={(e) => set('bairro', e.target.value)} /></label>
      </form>

      {erro && <p role="alert" className="card p-6 text-sm text-alert">{erro}</p>}

      {carregando ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => <SkeletonCardRestaurante key={i} />)}
        </div>
      ) : restaurantes.length === 0 && !erro ? (
        <EstadoVazio
          titulo={filtrando ? 'Nenhum restaurante com esses filtros' : 'Ainda não há restaurantes cadastrados'}
          texto={filtrando ? 'Tente outra cidade, bairro ou nome.' : 'Seja o primeiro: crie o perfil do seu restaurante.'}
          acao={filtrando ? { onClick: () => setParams(new URLSearchParams()), rotulo: 'Limpar filtros' } : { to: '/onboarding', rotulo: 'Cadastrar restaurante' }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurantes.map((r) => <CardRestaurante key={r.userId} restaurante={r} />)}
        </div>
      )}

      <Paginacao pagina={atual} total={totalPaginas} onMudar={(p) => set('pagina', p === 1 ? '' : String(p))} />
    </div>
  )
}