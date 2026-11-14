import { ChefHat, Salad } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/Photo'
import { Carregando, ErroApi, EstadoVazio, Paginacao } from '../components/Ui'
import { ENUMS } from '../data/enums'
import { qs } from '../lib/api'
import type { ChefPerfil, NutricionistaResumo, Pagina } from '../lib/apiTipos'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'

const TAMANHO = 12

function Chefs({ esp }: { esp: string }) {
  const [pagina, setPagina] = useState(1)
  const { dados, carregando, erro, lento, recarregar } = useApi<Pagina<ChefPerfil>>(`/chefs${qs({ especializacao: esp, pagina: pagina - 1, tamanho: TAMANHO })}`)
  if (erro) return <ErroApi erro={erro} onTentar={recarregar} />
  if (!dados) return <Carregando lento={lento} texto="Carregando chefs" />
  if (dados.conteudo.length === 0) return <EstadoVazio titulo="Nenhum chef encontrado" texto="Tente outra especialização." />
  return (
    <>
      <div className={`grid gap-4 lg:grid-cols-2 transition-opacity ${carregando ? 'opacity-60' : ''}`}>
        {dados.conteudo.map((c) => (
          <article key={c.id} className="card card-hover flex gap-4 p-5">
            <Avatar className="h-14 w-14" />
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-lg font-bold"><Link to={`/chef/${c.id}`} className="hover:text-terra">Chef {c.username}</Link></h2>
              {c.especializacao && <p className="text-xs font-semibold text-terra">{ENUMS.especializacao[c.especializacao]}</p>}
              {c.bio && <p className="line-clamp-3 text-sm text-ink-soft">{c.bio}</p>}
              {c.idRestaurante && <Link to={`/restaurante/${c.idRestaurante}`} className="inline-block text-xs text-ink-faint underline">{c.nomeRestaurante}</Link>}
            </div>
          </article>
        ))}
      </div>
      <Paginacao pagina={pagina} total={dados.totalPaginas} onMudar={setPagina} />
    </>
  )
}

function Nutricionistas() {
  const [pagina, setPagina] = useState(1)
  const { dados, carregando, erro, lento, recarregar } = useApi<Pagina<NutricionistaResumo>>(`/nutricionistas${qs({ pagina: pagina - 1, tamanho: TAMANHO })}`)
  if (erro) return <ErroApi erro={erro} onTentar={recarregar} />
  if (!dados) return <Carregando lento={lento} texto="Carregando nutricionistas" />
  if (dados.conteudo.length === 0) return <EstadoVazio titulo="Nenhuma nutricionista cadastrada" acao={{ to: '/onboarding', rotulo: 'Criar perfil' }} />
  return (
    <>
      <div className={`grid gap-4 lg:grid-cols-2 transition-opacity ${carregando ? 'opacity-60' : ''}`}>
        {dados.conteudo.map((n) => (
          <article key={n.id} className="card card-hover flex gap-4 p-5">
            <Avatar className="h-14 w-14" />
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-lg font-bold">{n.username}</h2>
              <p className="text-xs font-semibold text-terra">Nutricionista · {n.crn}</p>
              {n.bio && <p className="line-clamp-3 text-sm text-ink-soft">{n.bio}</p>}
            </div>
          </article>
        ))}
      </div>
      <Paginacao pagina={pagina} total={dados.totalPaginas} onMudar={setPagina} />
    </>
  )
}

export default function Directory() {
  useSeo({ titulo: 'Chefs e nutricionistas', descricao: 'Chefs e nutricionistas cadastrados no GastroMatch.' })
  const [params, setParams] = useSearchParams()
  const aba = params.get('aba') === 'nutricionistas' ? 'nutricionistas' : 'chefs'
  const esp = params.get('especializacao') ?? ''

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight sm:text-7xl">Profissionais</h1>
        <p className="max-w-2xl text-sm text-ink-soft">Chefs e nutricionistas cadastrados. Restaurantes ficam na <Link to="/restaurantes" className="font-semibold text-terra">lista de restaurantes</Link>.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Tipo de profissional" className="inline-flex rounded-full border border-line bg-cream p-1 text-sm font-semibold">
          {([['chefs', 'Chefs', ChefHat], ['nutricionistas', 'Nutricionistas', Salad]] as const).map(([k, rotulo, Icon]) => (
            <button key={k} role="tab" aria-selected={aba === k} onClick={() => setParams(k === 'chefs' ? {} : { aba: k })} className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 transition ${aba === k ? 'bg-terra text-on-accent shadow-soft' : 'text-ink-soft hover:text-terra'}`}><Icon size={15} /> {rotulo}</button>
          ))}
        </div>
        {aba === 'chefs' && (
          <select aria-label="Especialização" className="input !w-auto !rounded-full" value={esp} onChange={(e) => setParams(e.target.value ? { especializacao: e.target.value } : {})}>
            <option value="">Todas as especializações</option>
            {Object.entries(ENUMS.especializacao).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
      </div>

      {aba === 'chefs' ? <Chefs key={esp} esp={esp} /> : <Nutricionistas />}
    </div>
  )
}
