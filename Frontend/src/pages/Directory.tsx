import { BadgeCheck, MapPin, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import Img from '../components/Img'
import { photoUrl, pros, reels } from '../data/data'

const kinds = ['Todos', 'Chef particular', 'Nutricionista', 'Restaurante'] as const
const specialties = ['Todas', ...new Set(pros.map((p) => p.specialty))]
const quick = ['Entrega de kits', 'Atendimento domiciliar', 'Menu degustação']

export default function Directory() {
  const [specialty, setSpecialty] = useState('Todas')
  const [kind, setKind] = useState<(typeof kinds)[number]>('Todos')
  const [where, setWhere] = useState('')
  const [active, setActive] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(null)

  const list = useMemo(() => {
    const place = where.trim().toLowerCase()
    return pros.filter(
      (p) =>
        (kind === 'Todos' || p.kind === kind) &&
        (specialty === 'Todas' || p.specialty === specialty) &&
        active.every((service) => p.services.includes(service)) &&
        (!place || `${p.place} são paulo sp`.toLowerCase().includes(place)),
    )
  }, [kind, specialty, where, active])

  const hasFilters = kind !== 'Todos' || specialty !== 'Todas' || where !== '' || active.length > 0
  const clear = () => {
    setKind('Todos')
    setSpecialty('Todas')
    setWhere('')
    setActive([])
  }
  const toggleService = (name: string) =>
    setActive((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))

  return (
    <div className="py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl sm:text-4xl">Chefs, nutricionistas e restaurantes</h1>
        <p className="mt-3 text-base text-soft">
          Encontre profissionais perto de você. Cada perfil passa por uma verificação manual antes de ser publicado.
        </p>
      </header>

      <section className="card mt-8 p-5 sm:p-6" aria-label="Filtros">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block text-[13px] font-medium text-soft">
            Especialidade
            <select className="field mt-1.5" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              {specialties.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] font-medium text-soft">
            Cidade ou bairro
            <input
              className="field mt-1.5"
              placeholder="Ex.: Pinheiros"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
            />
          </label>
          <label className="block text-[13px] font-medium text-soft">
            Tipo de profissional
            <select
              className="field mt-1.5"
              value={kind}
              onChange={(e) => setKind(e.target.value as (typeof kinds)[number])}
            >
              {kinds.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {quick.map((name) => {
            const on = active.includes(name)
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => toggleService(name)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  on ? 'border-brand bg-brand-tint text-brand' : 'border-line text-soft hover:border-ink/30 hover:text-ink'
                }`}
              >
                {name}
              </button>
            )
          })}
          {hasFilters && (
            <button type="button" onClick={clear} className="ml-1 text-sm text-brand hover:underline">
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <section aria-label="Profissionais">
          <p className="text-sm text-soft">
            {list.length} {list.length === 1 ? 'profissional encontrado' : 'profissionais encontrados'}
          </p>

          <div className="mt-4 space-y-6">
            {list.map((p) => (
              <article key={p.id} className="card overflow-hidden md:grid md:grid-cols-[240px_minmax(0,1fr)]">
                <Img src={photoUrl(p.cover, 640)} alt={p.name} className="h-52 w-full md:h-full" />

                <div className="flex flex-col p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div>
                      <h2 className="text-xl">{p.name}</h2>
                      <p className="text-sm text-brand">{p.headline}</p>
                    </div>
                    <p className="inline-flex items-center gap-1.5 text-sm text-soft">
                      <Star className="h-4 w-4 fill-gold text-gold" />
                      {p.rating}
                    </p>
                  </div>

                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-faint">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.place} · {p.distance}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-leaf">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {p.badge}
                    </span>
                  </p>

                  <p className="mt-4 text-sm text-soft">{p.bio}</p>

                  <ul className="mt-4 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <li key={t} className="rounded-full bg-surface px-3 py-1 text-[13px] text-soft">
                        {t}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 rounded-lg bg-surface p-4 text-sm">
                    <p className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{p.kit.title}</span>
                      <span className="font-medium text-brand">{p.kit.price}</span>
                    </p>
                    <p className="mt-0.5 text-[13px] text-soft">{p.kit.detail}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <span className="text-[13px] text-faint">{p.footer}</span>
                    <button
                      type="button"
                      aria-expanded={open === p.id}
                      onClick={() => setOpen(open === p.id ? null : p.id)}
                      className="btn btn-primary btn-sm"
                    >
                      {open === p.id ? 'Ocultar contato' : p.cta}
                    </button>
                  </div>

                  {open === p.id && (
                    <dl className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-line p-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-[13px] text-faint">Instagram</dt>
                        <dd className="font-medium">{p.contact.instagram}</dd>
                      </div>
                      <div>
                        <dt className="text-[13px] text-faint">WhatsApp</dt>
                        <dd className="font-medium">{p.contact.whatsapp}</dd>
                      </div>
                      <p className="text-[13px] text-faint sm:col-span-2">
                        O contato é feito direto com o profissional, fora da plataforma.
                      </p>
                    </dl>
                  )}
                </div>
              </article>
            ))}

            {list.length === 0 && (
              <p className="card p-8 text-center text-soft">Nenhum profissional com esses filtros.</p>
            )}
          </div>
        </section>

        <aside className="space-y-8">
          <section className="card overflow-hidden" aria-label="Mapa">
            <div className="p-5 pb-4">
              <h2 className="text-lg">Perto de você</h2>
              <p className="text-[13px] text-faint">Região de Pinheiros e Jardins, São Paulo</p>
            </div>
            <iframe
              title="Mapa da região"
              loading="lazy"
              className="h-60 w-full border-0"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-46.7200%2C-23.6000%2C-46.6400%2C-23.5400&layer=mapnik&marker=-23.5668%2C-46.6919"
            />
          </section>

          <section id="reels" aria-label="Vídeos da comunidade">
            <h2 className="text-lg">Vídeos da comunidade</h2>
            <p className="text-[13px] text-faint">Bastidores gravados por chefs e nutricionistas.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {reels.map((r) => (
                <figure key={r.id} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface">
                  <Img src={photoUrl(r.photo, 420)} alt={r.title} className="h-full w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <span className="block text-[11px] uppercase tracking-wide text-white/70">{r.topic}</span>
                    <span className="mt-0.5 block text-[13px] font-medium leading-snug">{r.title}</span>
                    <span className="mt-1 block text-[11px] text-white/70">
                      {r.by} · {r.views}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-4 text-sm text-soft">
              É cozinheiro ou nutricionista? Envie seu vídeo pelo <span className="font-medium text-brand">portal do profissional</span>.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
