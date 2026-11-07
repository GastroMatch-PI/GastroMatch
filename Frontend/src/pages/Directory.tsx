import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarDiretorio, type PerfilDiretorio, type TipoPerfil } from '../api/Diretorio'
import { Aviso } from '../components/Campo'
import Photo from '../components/Photo'
import { EstadoVazio, Skeleton } from '../components/Ui'
import { ENUMS } from '../data/enums'
import { useSeo } from '../lib/seo'

const types = ['Todos', 'Chef Particular', 'Nutricionista', 'Restaurante'] as const
const papelKind: Record<TipoPerfil, (typeof types)[number]> = {
  CHEF: 'Chef Particular',
  NUTRICIONISTA: 'Nutricionista',
  RESTAURANTE: 'Restaurante',
}
const emoji: Record<TipoPerfil, string> = { CHEF: '👨‍🍳', NUTRICIONISTA: '🥗', RESTAURANTE: '🍽' }
const nomePlural: Record<TipoPerfil, string> = { CHEF: 'chefs', NUTRICIONISTA: 'nutricionistas', RESTAURANTE: 'restaurantes' }

// confirmar: rota da página pública do chef no App.tsx
const rotaChef = (id: number) => `/chef/${id}`

const rot = (m: Record<string, string>, k?: string) => (k ? m[k] ?? k : undefined)

function areaDe(p: PerfilDiretorio): string {
  if (p.tipo === 'CHEF') return rot(ENUMS.especializacao, p.especializacao) ?? 'Chef'
  if (p.tipo === 'NUTRICIONISTA') return p.crn ? `CRN ${p.crn}` : 'Nutricionista'
  return 'Restaurante'
}

export default function Directory() {
  useSeo({ titulo: 'Chefs, nutricionistas e restaurantes' })
  const [perfis, setPerfis] = useState<PerfilDiretorio[]>([])
  const [falhas, setFalhas] = useState<TipoPerfil[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [recarga, setRecarga] = useState(0)
  const [type, setType] = useState<(typeof types)[number]>('Todos')
  const [texto, setTexto] = useState('')
  const [place, setPlace] = useState('')

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')
    listarDiretorio()
      .then((r) => {
        if (!ativo) return
        if (r.falhas.length === 3) {
          setErro('Não foi possível carregar o diretório.')
          return
        }
        setPerfis(r.perfis)
        setFalhas(r.falhas)
      })
      .catch(() => {
        if (ativo) setErro('Não foi possível carregar o diretório.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => { ativo = false }
  }, [recarga])

  const list = useMemo(() => {
    const t = texto.trim().toLowerCase()
    const l = place.trim().toLowerCase()
    return perfis
      .filter((p) => type === 'Todos' || papelKind[p.tipo] === type)
      .filter((p) => !t || `${p.nome} ${areaDe(p)} ${p.bio ?? ''}`.toLowerCase().includes(t))
      .filter((p) => !l || (p.local ?? '').toLowerCase().includes(l))
  }, [perfis, type, texto, place])

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold">Chefs, Nutricionistas & Restaurantes</h1>
        <p className="max-w-2xl text-ink-soft">
          Perfis de profissionais cadastrados. Nutricionistas só aparecem após a verificação manual do CRN.
        </p>
      </header>

      <section className="card grid gap-3 p-5 md:grid-cols-3">
        <label className="text-xs font-semibold">
          Buscar por nome ou especialidade
          <input className="input mt-1" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </label>
        <label className="text-xs font-semibold">
          Cidade ou bairro
          <input className="input mt-1" value={place} onChange={(e) => setPlace(e.target.value)} />
        </label>
        <label className="text-xs font-semibold">
          Tipo
          <select className="input mt-1" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
      </section>

      {erro && (
        <div className="space-y-3">
          <Aviso tipo="erro">{erro}</Aviso>
          <button className="btn-ghost" onClick={() => setRecarga((x) => x + 1)}>Tentar de novo</button>
        </div>
      )}

      {falhas.length > 0 && !erro && (
        <Aviso tipo="info">
          Não foi possível carregar {falhas.map((f) => nomePlural[f]).join(' e ')} agora. Os demais perfis estão sendo exibidos.
        </Aviso>
      )}

      {carregando ? (
        <div className="grid gap-4 lg:grid-cols-2" aria-busy="true" role="status" aria-label="Carregando perfis">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72" />)}
        </div>
      ) : (
        !erro && (
          <>
            <p className="text-sm">Mostrando <b>{list.length}</b> {list.length === 1 ? 'perfil' : 'perfis'}</p>

            {list.length === 0 ? (
              <EstadoVazio
                titulo="Nenhum perfil encontrado"
                texto={perfis.length === 0 ? 'Ainda não há perfis profissionais cadastrados.' : 'Nenhum perfil com esses filtros.'}
              />
            ) : (
              <section className="grid gap-4 lg:grid-cols-2">
                {list.map((p, i) => (
                  <article key={p.chave} className="card overflow-hidden">
                    <Photo emoji={emoji[p.tipo]} seed={i % 5} className="h-44 w-full" />
                    <div className="space-y-3 p-5">
                      <div>
                        <h2 className="text-xl font-bold">
                          {p.nome} {p.local && <span className="text-sm font-normal text-ink-faint">• {p.local}</span>}
                        </h2>
                        <p className="text-xs font-semibold text-terra">{papelKind[p.tipo]} · {areaDe(p)}</p>
                      </div>
                      {p.bio && <p className="text-sm text-ink-soft">{p.bio}</p>}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {p.tipo === 'CHEF' && (
                          <Link className="btn-ghost !px-3 !py-1.5 text-xs" to={rotaChef(p.idApi)}>Ver perfil</Link>
                        )}
                        {p.instagram && (
                          <a className="btn-ghost !px-3 !py-1.5 text-xs" target="_blank" rel="noopener noreferrer" href={`https://instagram.com/${p.instagram.replace(/^@/, '')}`}>Instagram</a>
                        )}
                        {p.whatsapp && (
                          <a className="btn-ghost !px-3 !py-1.5 text-xs" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`}>WhatsApp</a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )
      )}
    </div>
  )
}