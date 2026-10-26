import { useRef, useState } from 'react'
import { Avatar } from '../components/Photo'
import { useLocalState } from '../hooks/useLocalState'

const tabs = ['Perfil Público & Vitrine', 'Construtor de Receitas', 'Kits Ilustrativos (Caixa Surpresa)'] as const

const stats = [
  { label: 'Visualizações de Receitas', value: '14.820', note: '↗ +28% nos últimos 7 dias' },
  { label: 'Salvas em Listas Locais', value: '3.415', note: '↗ Alta taxa de retenção gastronômica' },
  { label: 'Cliques para Redes Sociais', value: '892', note: 'Instagram & WhatsApp institucional' },
]

const defaultProfile = {
  name: 'Gabriel Fontana | Trattoria Moderna',
  area: 'Alta Gastronomia Contemporânea',
  bio: 'Chef com 14 anos de experiência nos maiores centros europeus e paulistanos. Atualmente focado em técnicas ancestrais de conservação, massas artesanais de grãos rústicos e menu sazonais focados em microprodutores da Serra da Mantiqueira.',
  instagram: 'chefgabrielfontana',
  whatsapp: '(11) 98765-4321',
  registro: 'CRN-3 / 48190-SP (ou Portfólio de Restaurante)',
}

export default function Portal() {
  const [tab, setTab] = useState<(typeof tabs)[number]>(tabs[0])
  const [profile, setProfile] = useLocalState('gm-profile', defaultProfile)
  const [draft, setDraft] = useState(profile)
  const [saved, setSaved] = useState(false)
  const [file, setFile] = useState('diploma_ou_curriculo_validador.pdf • 2.4 MB')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setSaved(false)
    setDraft({ ...draft, [k]: e.target.value })
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-peach p-4">
        <span className="text-3xl" aria-hidden>⌛</span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-bold">
            Status da Conta: Em Análise para Verificação Manual{' '}
            <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] text-gold">Verificação Pendente</span>
          </h1>
          <p className="text-xs text-ink-soft">
            Nossa equipe de curadoria analisa suas credenciais em até 48h. Enquanto isso, seu perfil e vitrines podem ser
            estruturados e salvos em modo rascunho de alta resolução.
          </p>
        </div>
        <span className="text-xs font-semibold text-terra">Saiba como funciona</span>
        <code className="rounded border border-line bg-white px-2 py-1 text-[10px]">Protocolo #GM-88219</code>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-semibold text-ink-soft">{s.label}</p>
            <p className="mt-3 font-display text-3xl font-extrabold">{s.value}</p>
            <p className="text-[11px] text-leaf">{s.note}</p>
          </div>
        ))}
        <div className="card p-4">
          <p className="flex justify-between text-xs font-semibold text-ink-soft">
            Selo de Validação <span className="text-leaf">✔</span>
          </p>
          <p className="mt-3 font-display text-lg font-bold text-leaf">Especialista Ativo</p>
          <p className="text-[11px] text-ink-faint">Conclua o onboarding para desbloquear o selo oficial em destaque.</p>
        </div>
      </section>

      <section className="card space-y-5 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Painel de Onboarding Profissional</h2>
            <p className="max-w-md text-xs text-ink-soft">
              Configure sua autoridade culinária, crie receitas com precisão técnica e exponha suas caixas de experiências.
            </p>
          </div>
          <div role="tablist" className="flex flex-wrap gap-1 rounded-xl border border-line bg-cream p-1 text-xs font-semibold">
            {tabs.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-2 ${tab === t ? 'bg-white text-terra shadow-sm' : 'text-ink-soft'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <hr className="border-line" />

        {tab === tabs[0] ? (
          <div className="grid gap-5 md:grid-cols-[260px_1fr]">
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-peach p-4 text-center">
                <Avatar emoji="👨‍🍳" className="mx-auto h-20 w-20 text-4xl" />
                <p className="mt-2 font-display text-lg font-bold">Chef Gabriel Fontana</p>
                <p className="text-[11px] font-semibold text-terra">Chef Executivo & Especialista em Fermentação</p>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between"><dt className="text-ink-soft">Tipo de Conta:</dt><dd className="font-semibold">Chef de Cozinha</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-soft">Membro desde:</dt><dd className="font-semibold">Agosto 2024</dd></div>
                </dl>
              </div>
              <div className="rounded-xl border border-line p-4">
                <p className="text-xs font-bold text-terra">✔ Registro Profissional / Portfólio</p>
                <p className="mb-2 text-[11px] text-ink-soft">
                  Insira o CRN (para Nutricionistas) ou link/comprovatório de premiação e experiência.
                </p>
                <input className="input" value={draft.registro} onChange={set('registro')} />
                <p className="mb-1 mt-3 text-[11px] font-semibold">Documento Comprobatório (PDF ou Imagem):</p>
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  accept=".pdf,image/*"
                  onChange={(e) => e.target.files?.[0] && setFile(`${e.target.files[0].name} • ${(e.target.files[0].size / 1048576).toFixed(1)} MB`)}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-lg border border-dashed border-terra/50 bg-peach/60 p-3 text-center text-[11px] text-terra"
                >
                  ☁<br />
                  <b>{file}</b>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-[11px] font-semibold">
                  Nome de Exibição Público
                  <input className="input mt-1" value={draft.name} onChange={set('name')} />
                </label>
                <label className="text-[11px] font-semibold">
                  Área de Atuação Primária
                  <select className="input mt-1" value={draft.area} onChange={set('area')}>
                    <option>Alta Gastronomia Contemporânea</option>
                    <option>Nutrição Funcional</option>
                    <option>Panificação & Fermentação</option>
                  </select>
                </label>
              </div>
              <label className="block text-[11px] font-semibold">
                Biografia Profissional Editorial
                <textarea className="input mt-1 h-24 resize-y" maxLength={500} value={draft.bio} onChange={set('bio')} />
              </label>
              <p className="text-right text-[10px] text-ink-faint">{draft.bio.length} / 500 caracteres recomendados</p>

              <div className="rounded-xl border border-line bg-peach/60 p-4">
                <h3 className="font-display text-lg font-bold">🔗 Canais Oficiais de Contato Externo</h3>
                <p className="mb-3 text-[11px] text-ink-soft">
                  Direcione seguidores e clientes interessados em consultorias, reservas e encomendas diretas.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-[11px] font-semibold">
                    Instagram Institucional
                    <input className="input mt-1" value={draft.instagram} onChange={set('instagram')} />
                  </label>
                  <label className="text-[11px] font-semibold">
                    WhatsApp Institucional / Comercial
                    <input className="input mt-1" value={draft.whatsapp} onChange={set('whatsapp')} />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                {saved && <span className="text-xs font-semibold text-leaf">✓ Alterações salvas</span>}
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setDraft(profile)
                    setSaved(false)
                  }}
                >
                  Descartar
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setProfile(draft)
                    setSaved(true)
                  }}
                >
                  Salvar Alterações do Perfil
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-xl bg-peach p-8 text-center text-sm text-ink-soft">
            “{tab}” — esta aba não está desenhada no projeto do Stitch; o conteúdo entra aqui quando o layout existir.
          </p>
        )}
      </section>
    </div>
  )
}
