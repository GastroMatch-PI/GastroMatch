import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Photo'
import Protegida from '../components/Protegida'
import { useAuth } from '../context/Auth'
import { pros } from '../data/data'
import { useRecipes } from '../lib/useRecipes'
import type { Papel } from '../lib/tipos'
import { useSeo } from '../lib/seo'

const tabs = ['Perfil Público', 'Minhas Receitas', 'Kits Ilustrativos'] as const
const nomes: Record<Papel, string> = { CHEF: 'Chef', NUTRICIONISTA: 'Nutricionista', RESTAURANTE: 'Restaurante' }
const statusTxt = {
  PENDENTE: 'Em análise: verificação manual pendente. Seu perfil não aparece no diretório até a aprovação.',
  APROVADO: 'Perfil aprovado e visível no diretório.',
  REJEITADO: 'Perfil reprovado na verificação.',
}

export default function Portal() {
  useSeo({ titulo: 'Portal profissional' })
  const { usuario, meusPerfis, setPerfis } = useAuth()
  const receitas = useRecipes()
  const [tab, setTab] = useState<(typeof tabs)[number]>(tabs[0])
  const [papel, setPapel] = useState<Papel | ''>('')
  const perfil = meusPerfis.find((p) => p.papel === (papel || meusPerfis[0]?.papel))
  const [draft, setDraft] = useState({ nome: '', bio: '', instagram: '', whatsapp: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (perfil) setDraft({ nome: perfil.nome, bio: perfil.bio, instagram: perfil.instagram ?? '', whatsapp: perfil.whatsapp ?? '' })
  }, [perfil?.papel, perfil?.userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaved(false)
    setDraft({ ...draft, [k]: e.target.value })
  }

  const minhas = receitas.filter((r) => r.owner === usuario?.id)

  return (
    <Protegida>
      {!perfil ? (
        <div className="card mx-auto max-w-md space-y-3 p-6 text-center">
          <h1 className="text-xl font-bold">Você ainda não tem perfil profissional</h1>
          <Link to="/onboarding" className="btn-primary">Criar perfil</Link>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-peach p-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-bold">
                {nomes[perfil.papel]} · {perfil.status}
              </h1>
              <p className="text-xs text-ink-soft">{statusTxt[perfil.status]}</p>
            </div>
            {meusPerfis.length > 1 && (
              <select className="input !w-auto" value={perfil.papel} onChange={(e) => setPapel(e.target.value as Papel)}>
                {meusPerfis.map((p) => <option key={p.papel} value={p.papel}>{nomes[p.papel]}</option>)}
              </select>
            )}
          </section>

          <section className="card space-y-5 p-5 md:p-6">
            <div role="tablist" className="flex flex-wrap gap-1 rounded-full border border-line bg-cream p-1 text-xs font-semibold">
              {tabs.map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                  className={`cursor-pointer rounded-full px-4 py-2 transition duration-200 ${tab === t ? 'bg-terra text-on-accent shadow-soft' : 'text-ink-soft hover:text-terra'}`}>
                  {t}
                </button>
              ))}
            </div>

            {tab === 'Perfil Público' && (
              <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                <div className="rounded-xl border border-line bg-peach p-4 text-center">
                  <Avatar className="mx-auto h-20 w-20" />
                  <p className="mt-2 font-display text-lg font-bold">{draft.nome}</p>
                  <p className="text-[11px] font-semibold text-terra">{nomes[perfil.papel]}</p>
                  {perfil.crn && <p className="mt-2 text-[11px] text-ink-soft">CRN {perfil.crn}</p>}
                  {perfil.comprovante && <p className="mt-1 text-[11px] text-ink-faint">{perfil.comprovante}</p>}
                </div>
                <div className="space-y-4">
                  <label className="block text-[11px] font-semibold">
                    Nome de exibição
                    <input className="input mt-1" value={draft.nome} onChange={set('nome')} />
                  </label>
                  <label className="block text-[11px] font-semibold">
                    Biografia
                    <textarea className="input mt-1 h-24 resize-y" maxLength={500} value={draft.bio} onChange={set('bio')} />
                  </label>
                  <p className="text-right text-[10px] text-ink-faint">{draft.bio.length} / 500</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-[11px] font-semibold">
                      Instagram
                      <input className="input mt-1" placeholder="usuario" value={draft.instagram} onChange={set('instagram')} />
                    </label>
                    <label className="text-[11px] font-semibold">
                      WhatsApp
                      <input className="input mt-1" placeholder="(11) 98765-4321" value={draft.whatsapp} onChange={set('whatsapp')} />
                    </label>
                  </div>
                  <p className="text-[11px] text-ink-faint">Os contatos viram links externos no diretório. Não há mensagens nem agendamento na plataforma.</p>
                  <div className="flex items-center justify-end gap-3">
                    {saved && <span className="text-xs font-semibold text-leaf">Salvo</span>}
                    <button className="btn-primary" onClick={() => {
                      setPerfis((l) => l.map((p) => (p.userId === perfil.userId && p.papel === perfil.papel ? { ...p, ...draft } : p)))
                      setSaved(true)
                    }}>Salvar perfil</button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'Minhas Receitas' && (
              <div className="space-y-3">
                {perfil.papel === 'CHEF' ? (
                  <Link to="/publicar" className="btn-primary">+ Publicar nova receita</Link>
                ) : (
                  <p className="text-sm text-ink-soft">Apenas chefs publicam receitas.</p>
                )}
                {minhas.length === 0 && <p className="text-sm text-ink-soft">Nenhuma receita publicada.</p>}
                <ul className="divide-y divide-line">
                  {minhas.map((r) => (
                    <li key={r.id} className="py-2 text-sm"><Link className="font-semibold hover:text-terra" to={`/receita/${r.id}`}>{r.title}</Link></li>
                  ))}
                </ul>
              </div>
            )}

            {tab === 'Kits Ilustrativos' && (
              <div className="space-y-3">
                <p className="text-xs text-ink-soft">Kits são só ilustrativos: não há compra, reserva nem pagamento.</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {pros.map((p) => (
                    <div key={p.id} className="rounded-xl border border-line bg-peach/60 p-4 text-xs">
                      <p className="font-bold uppercase text-gold">{p.kit.label}</p>
                      <p className="mt-1 text-sm font-semibold">{p.kit.title}</p>
                      <p className="text-terra">{p.kit.price}</p>
                      <p className="text-ink-faint">{p.kit.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </Protegida>
  )
}
