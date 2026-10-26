import { Clock, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Avatar from '../components/Avatar'
import { createStore, useStore } from '../lib/store'

const tabs = ['Perfil público', 'Construtor de receitas', 'Kits'] as const

const stats = [
  { label: 'Visualizações de receitas', value: '14.820', note: '+28% nos últimos 7 dias' },
  { label: 'Salvas em listas', value: '3.415', note: 'Alta retenção' },
  { label: 'Cliques nas redes sociais', value: '892', note: 'Instagram e WhatsApp' },
  { label: 'Selo de validação', value: 'Pendente', note: 'Conclua o cadastro para recebê-lo' },
]

const initialProfile = {
  name: 'Gabriel Fontana | Trattoria Moderna',
  area: 'Alta gastronomia',
  bio: 'Chef com 14 anos de experiência nos maiores centros europeus e paulistanos. Hoje trabalha com técnicas ancestrais de conservação, massas artesanais de grãos rústicos e menus sazonais de microprodutores da Serra da Mantiqueira.',
  instagram: 'chefgabrielfontana',
  whatsapp: '(11) 98765-4321',
  registro: 'CRN-3 48190-SP ou link do portfólio',
}

const profileStore = createStore('gm:v2:profile', initialProfile)

const areas = ['Alta gastronomia', 'Nutrição funcional', 'Panificação e fermentação', 'Confeitaria']

export default function Portal() {
  const [tab, setTab] = useState<(typeof tabs)[number]>(tabs[0])
  const [profile, setProfile] = useStore(profileStore)
  const [draft, setDraft] = useState(profile)
  const [saved, setSaved] = useState(false)
  const [file, setFile] = useState('diploma-validador.pdf · 2,4 MB')
  const fileRef = useRef<HTMLInputElement>(null)

  const set =
    (key: keyof typeof initialProfile) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setSaved(false)
      setDraft({ ...draft, [key]: e.target.value })
    }

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(`${f.name} · ${(f.size / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`)
  }

  return (
    <div className="py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl sm:text-4xl">Portal do profissional</h1>
        <p className="mt-3 text-base text-soft">
          Monte seu perfil, envie a comprovação profissional e acompanhe como suas receitas estão indo.
        </p>
      </header>

      <section className="mt-8 flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:gap-5">
        <Clock className="hidden h-6 w-6 shrink-0 text-gold sm:block" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base">Conta em análise</h2>
          <p className="text-sm text-soft">
            Nossa equipe confere as credenciais em até 48 horas. Enquanto isso, você já pode preencher o perfil e salvar
            como rascunho.
          </p>
        </div>
        <code className="shrink-0 rounded-md border border-line bg-white px-2.5 py-1 text-xs text-soft">
          Protocolo GM-88219
        </code>
      </section>

      <section
        aria-label="Resumo"
        className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-5">
            <p className="text-[13px] text-faint">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-1 text-[13px] text-soft">{s.note}</p>
          </div>
        ))}
      </section>

      <section className="card mt-8 p-5 sm:p-8">
        <div role="tablist" className="flex flex-wrap gap-x-1 border-b border-line">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm transition-colors ${
                tab === t ? 'border-brand font-medium text-ink' : 'border-transparent text-soft hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Perfil público' ? (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar name="Gabriel Fontana" size={64} />
                <div>
                  <p className="font-semibold">Chef Gabriel Fontana</p>
                  <p className="text-[13px] text-soft">Chef executivo, fermentação</p>
                </div>
              </div>
              <dl className="space-y-2 border-y border-line py-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-soft">Tipo de conta</dt>
                  <dd className="font-medium">Chef de cozinha</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-soft">Membro desde</dt>
                  <dd className="font-medium">Agosto de 2024</dd>
                </div>
              </dl>

              <div>
                <h3 className="text-base">Registro profissional</h3>
                <p className="mt-1 text-[13px] text-soft">
                  Informe o CRN (nutricionistas) ou um link que comprove sua experiência e premiações.
                </p>
                <input className="field mt-3" value={draft.registro} onChange={set('registro')} aria-label="Registro profissional" />
                <input ref={fileRef} type="file" hidden accept=".pdf,image/*" onChange={pickFile} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-3 flex w-full items-center gap-3 rounded-lg border border-dashed border-line px-4 py-3 text-left text-sm transition-colors hover:bg-surface"
                >
                  <Upload className="h-4 w-4 shrink-0 text-faint" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{file}</span>
                    <span className="block text-[13px] text-faint">Clique para trocar o arquivo (PDF ou imagem)</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block text-[13px] font-medium text-soft">
                  Nome de exibição
                  <input className="field mt-1.5" value={draft.name} onChange={set('name')} />
                </label>
                <label className="block text-[13px] font-medium text-soft">
                  Área de atuação
                  <select className="field mt-1.5" value={draft.area} onChange={set('area')}>
                    {areas.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-[13px] font-medium text-soft">
                Biografia
                <textarea
                  className="field mt-1.5 h-32 resize-y"
                  maxLength={500}
                  value={draft.bio}
                  onChange={set('bio')}
                />
                <span className="mt-1 block text-right text-xs text-faint">{draft.bio.length} / 500</span>
              </label>

              <div className="rounded-xl border border-line p-5">
                <h3 className="text-base">Canais de contato</h3>
                <p className="mt-1 text-[13px] text-soft">
                  Quem se interessar pelo seu trabalho vai falar com você por aqui, fora da plataforma.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block text-[13px] font-medium text-soft">
                    Instagram
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-faint">@</span>
                      <input className="field pl-8" value={draft.instagram} onChange={set('instagram')} />
                    </div>
                  </label>
                  <label className="block text-[13px] font-medium text-soft">
                    WhatsApp
                    <input className="field mt-1.5" value={draft.whatsapp} onChange={set('whatsapp')} />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {saved && <span className="text-sm text-leaf">Alterações salvas</span>}
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setDraft(profile)
                    setSaved(false)
                  }}
                >
                  Descartar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setProfile(draft)
                    setSaved(true)
                  }}
                >
                  Salvar perfil
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md py-16 text-center">
            <h3 className="text-lg">
              {tab === 'Construtor de receitas' ? 'Construtor de receitas' : 'Kits ilustrativos'}
            </h3>
            <p className="mt-2 text-sm text-soft">
              {tab === 'Construtor de receitas'
                ? 'Em breve você vai poder cadastrar receitas por etapas, com ingredientes, tempos e fotos.'
                : 'Em breve você vai poder montar a vitrine de kits que aparece no seu perfil.'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
