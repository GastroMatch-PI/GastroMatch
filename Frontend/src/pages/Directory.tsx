import { useMemo, useState } from 'react'
import Photo from '../components/Photo'
import { useAuth } from '../context/Auth'
import { pros, type Pro } from '../data/data'
import { useSeo } from '../lib/seo'

const types = ['Todos', 'Chef Particular', 'Nutricionista', 'Restaurante'] as const
const papelKind = { CHEF: 'Chef Particular', NUTRICIONISTA: 'Nutricionista', RESTAURANTE: 'Restaurante' } as const
const emoji = { CHEF: '👨‍🍳', NUTRICIONISTA: '🥗', RESTAURANTE: '🍽' } as const

type Item = Pro & { instagram?: string; whatsapp?: string; demo: boolean }

export default function Directory() {
  useSeo({ titulo: 'Chefs, nutricionistas e restaurantes' })
  const { perfis, usuario } = useAuth()
  const [type, setType] = useState<(typeof types)[number]>('Todos')
  const [texto, setTexto] = useState('')
  const [place, setPlace] = useState('')
  const [kitAberto, setKitAberto] = useState<string | null>(null)

  const todos = useMemo<Item[]>(() => {
    const reais: Item[] = perfis
      .filter((p) => p.status === 'APROVADO') // nutricionista só aparece após aprovação manual
      .map((p, i) => ({
        id: `${p.userId}-${p.papel}`,
        name: p.nome,
        area: p.especializacao ?? (p.papel === 'NUTRICIONISTA' ? `CRN ${p.crn ?? ''}` : p.papel === 'RESTAURANTE' ? 'Restaurante' : 'Chef'),
        place: p.cidade || p.endereco || '',
        kind: papelKind[p.papel],
        badge: '',
        bio: p.bio,
        tags: [],
        kit: { label: '', title: '', price: '', detail: '' },
        rating: '',
        emoji: emoji[p.papel],
        seed: i % 5,
        footer: '',
        cta: '',
        instagram: p.instagram,
        whatsapp: p.whatsapp,
        demo: false,
      }))
    return [...reais, ...pros.map((p) => ({ ...p, demo: true }))]
  }, [perfis])

  const list = todos
    .filter((p) => type === 'Todos' || p.kind === type)
    .filter((p) => !texto.trim() || `${p.name} ${p.area} ${p.bio} ${p.tags.join(' ')}`.toLowerCase().includes(texto.trim().toLowerCase()))
    .filter((p) => !place.trim() || p.place.toLowerCase().includes(place.trim().toLowerCase()))

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold">Chefs, Nutricionistas & Restaurantes</h1>
        <p className="max-w-2xl text-ink-soft">
          Perfis de profissionais cadastrados. Nutricionistas só aparecem após a verificação manual do CRN. Perfis marcados
          como demonstração são exemplos.
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

      <p className="text-sm">Mostrando <b>{list.length}</b> perfis{usuario ? '' : ''}</p>

      <section className="grid gap-4 lg:grid-cols-2">
        {list.map((p) => (
          <article key={p.id} className="card overflow-hidden">
            <Photo emoji={p.emoji} seed={p.seed} className="h-44 w-full">
              {p.image && <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              {p.demo && <span className="absolute right-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-semibold text-gold">Demonstração</span>}
            </Photo>
            <div className="space-y-3 p-5">
              <div>
                <h2 className="text-xl font-bold">
                  {p.name} {p.place && <span className="text-sm font-normal text-ink-faint">• {p.place}</span>}
                </h2>
                <p className="text-xs font-semibold text-terra">{p.kind} · {p.area}</p>
              </div>
              {p.bio && <p className="text-sm text-ink-soft">{p.bio}</p>}
              {p.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t) => <span key={t} className="rounded-full bg-peach px-2.5 py-1 text-xs text-terra">{t}</span>)}
                </div>
              )}
              {p.kit.title && (
                <div className="rounded-xl bg-peach p-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold uppercase text-gold">{p.kit.label} · ilustrativo</p>
                    <button className="btn-ghost shrink-0 !px-3 !py-1.5 text-xs" onClick={() => setKitAberto(kitAberto === p.id ? null : p.id)}>
                      {kitAberto === p.id ? 'Fechar' : 'Visualizar Kit'}
                    </button>
                  </div>
                  {kitAberto === p.id && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold">{p.kit.title} — <span className="text-terra">{p.kit.price}</span></p>
                      <p className="text-ink-faint">{p.kit.detail}</p>
                      <p className="mt-1 text-[11px] text-ink-faint">Sem compra ou reserva na plataforma.</p>
                    </div>
                  )}
                </div>
              )}
              {(p.instagram || p.whatsapp) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {p.instagram && (
                    <a className="btn-ghost !px-3 !py-1.5 text-xs" target="_blank" rel="noopener noreferrer" href={`https://instagram.com/${p.instagram.replace(/^@/, '')}`}>Instagram</a>
                  )}
                  {p.whatsapp && (
                    <a className="btn-ghost !px-3 !py-1.5 text-xs" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`}>WhatsApp</a>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
      {list.length === 0 && <p className="card p-6 text-sm text-ink-soft">Nenhum perfil com esses filtros.</p>}
    </div>
  )
}
