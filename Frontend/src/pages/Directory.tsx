import { useMemo, useState } from 'react'
import Photo from '../components/Photo'
import { pros, reels } from '../data/data'

const specialties = ['Alta Gastronomia Contemporânea', 'Nutrição Funcional', 'Massas Artesanais', 'Todas']
const types = ['Todos', 'Chef Particular', 'Nutricionista', 'Restaurante'] as const
const quick = ['Pronta Entrega / Caixa Surpresa', 'Atendimento Domiciliar', 'Menu Degustação']

export default function Directory() {
  const [specialty, setSpecialty] = useState('Todas')
  const [type, setType] = useState<(typeof types)[number]>('Todos')
  const [place, setPlace] = useState('São Paulo, SP - Pinheiros & Jardins')
  const [active, setActive] = useState<string[]>([])
  const [contacted, setContacted] = useState<string[]>([])

  const list = useMemo(
    () =>
      pros
        .filter((p) => type === 'Todos' || p.kind === type)
        .filter((p) => specialty === 'Todas' || p.tags.some((t) => specialty.includes(t.split(' ')[0])) || p.area.includes(specialty.split(' ')[0])),
    [type, specialty],
  )

  const toggleQuick = (q: string) => setActive((a) => (a.includes(q) ? a.filter((x) => x !== q) : [...a, q]))

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="inline-block rounded-full bg-leaf-soft px-3 py-1 text-xs font-semibold text-leaf">
          ✔ Rede Gastronômica Validada
        </span>
        <h1 className="text-4xl font-extrabold">Chefs, Nutricionistas & Restaurantes Locais</h1>
        <p className="max-w-2xl text-ink-soft">
          Conecte-se com especialistas e estabelecimentos da culinária autoral. Perfis com credenciais auditadas pela
          curadoria GastroMatch.
        </p>
      </header>

      <section className="card space-y-3 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="text-xs font-semibold">
            Especialidade Culinária
            <select className="input mt-1" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              {specialties.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Localização (Cidade ou Bairro)
            <input className="input mt-1" value={place} onChange={(e) => setPlace(e.target.value)} />
          </label>
          <label className="text-xs font-semibold">
            Tipo de Profissional
            <select className="input mt-1" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <button className="btn-primary self-end">☰ Filtrar</button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-ink-faint">Filtros Ativos:</span>
          {specialty !== 'Todas' && <span className="rounded-full bg-gold-soft px-2.5 py-1 text-gold">{specialty}</span>}
          {quick.map((q) => (
            <button
              key={q}
              onClick={() => toggleQuick(q)}
              className={`rounded-full border px-2.5 py-1 ${active.includes(q) ? 'border-terra bg-peach text-terra' : 'border-line bg-white'}`}
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p>
              Mostrando <b>{list.length} especialistas</b> certificados na sua região
            </p>
            <span className="text-xs text-ink-faint">Ordenar por: Relevância & Selo ▾</span>
          </div>
          {list.map((p) => (
            <article key={p.id} className="card overflow-hidden">
              <Photo emoji={p.emoji} seed={p.seed} className="h-40 w-full">
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold">
                  ★ {p.rating}
                </span>
                <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-leaf">
                  ✔ {p.badge}
                </span>
              </Photo>
              <div className="space-y-3 p-5">
                <div>
                  <h2 className="text-xl font-bold">
                    {p.name} <span className="text-sm font-normal text-ink-faint">• {p.place}</span>
                  </h2>
                  <p className="text-xs font-semibold text-terra">{p.area}</p>
                </div>
                <p className="text-sm text-ink-soft">{p.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-full bg-peach px-2.5 py-1 text-xs text-terra">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-peach p-3">
                  <div className="text-xs">
                    <p className="font-bold uppercase text-gold">{p.kit.label}</p>
                    <p className="text-sm font-semibold">
                      {p.kit.title} — <span className="text-terra">{p.kit.price}</span>
                    </p>
                    <p className="text-ink-faint">{p.kit.detail}</p>
                  </div>
                  <button className="btn-ghost shrink-0 !px-3 !py-1.5 text-xs">Visualizar Kit</button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-faint">
                  <span>{p.footer}</span>
                  <div className="flex gap-2">
                    <button className="btn-ghost !px-3 !py-1.5 text-xs">↗ Ver Redes & Contato</button>
                    <button
                      className={`!px-3 !py-1.5 text-xs ${p.kind === 'Restaurante' ? 'btn-primary' : 'btn-primary !bg-leaf'}`}
                      onClick={() => setContacted((c) => [...new Set([...c, p.id])])}
                    >
                      {contacted.includes(p.id) ? '✓ Solicitado' : p.cta}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {list.length === 0 && <p className="card p-6 text-sm text-ink-soft">Nenhum especialista com esses filtros.</p>}
        </section>

        <aside className="space-y-4">
          <div className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">🗺 Mini Mapa Gastronômico</h3>
              <span className="rounded bg-peach px-2 py-0.5 text-[10px] text-terra">São Paulo Centro-Oeste</span>
            </div>
            <div
              className="relative h-56 overflow-hidden rounded-lg border border-line bg-[#eef1e4]"
              style={{
                backgroundImage:
                  'linear-gradient(#d8dcc8 1px, transparent 1px), linear-gradient(90deg, #d8dcc8 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            >
              <div className="absolute -left-4 top-24 h-8 w-[120%] -rotate-12 bg-sky-200/80" />
              {[
                ['🍴', 'left-[42%] top-[22%]', 'bg-terra'],
                ['🥗', 'left-[68%] top-[48%]', 'bg-leaf'],
                ['🥡', 'left-[22%] top-[60%]', 'bg-gold'],
              ].map(([e, pos, bg]) => (
                <span key={pos} className={`absolute ${pos} flex h-8 w-8 items-center justify-center rounded-full ${bg} text-sm shadow`}>
                  {e}
                </span>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-ink-faint">◎ Raio de busca: 5 km</span>
              <span className="font-semibold text-terra">Expandir Mapa</span>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">▶ Reels da Comunidade</h3>
              <span className="text-xs font-semibold text-terra">Ver todos</span>
            </div>
            <p className="mb-3 text-[11px] text-ink-faint">Bastidores técnicos gravados por especialistas</p>
            <div className="grid grid-cols-2 gap-2">
              {reels.map((r) => (
                <Photo key={r.title} emoji={r.emoji} seed={r.seed} className="aspect-[3/4] rounded-xl">
                  <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                    👁 {r.views}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
                    <p className="text-[9px] font-bold uppercase text-gold-soft">{r.topic}</p>
                    <p className="text-[11px] font-semibold leading-tight">{r.title}</p>
                    <p className="text-[9px] opacity-80">{r.by}</p>
                  </div>
                </Photo>
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-peach p-2 text-[11px]">
              É cozinheiro ou nutricionista? <b className="text-terra">Submeter Vídeo →</b>
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
