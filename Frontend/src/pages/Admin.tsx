import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Modal, useToast } from '../components/Feedback'
import Protegida from '../components/Protegida'
import { EstadoVazio, Paginacao } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { useLocalState } from '../hooks/useLocalState'
import { dataRelativa } from '../lib/format'
import { mascaraCRN } from '../lib/mascaras'
import { useSeo } from '../lib/seo'
import type { Decisao, Denuncia, Papel, PerfilPro } from '../lib/tipos'

const POR_PAGINA = 5
const nomes: Record<Papel, string> = { CHEF: 'Chef', NUTRICIONISTA: 'Nutricionista', RESTAURANTE: 'Restaurante' }

// Curadoria de DEMONSTRAÇÃO: sem servidor, a primeira conta criada neste navegador é a administradora.
export default function Admin() {
  useSeo({ titulo: 'Curadoria' })
  const { usuario, perfis, setPerfis } = useAuth()
  const toast = useToast()
  const [denuncias, setDenuncias] = useLocalState<Denuncia[]>('gm-denuncias', [])
  const [historico, setHistorico] = useLocalState<Decisao[]>('gm-historico', [])
  const [tipo, setTipo] = useState<'' | Papel>('')
  const [ordem, setOrdem] = useState<'antigos' | 'recentes'>('antigos')
  const [pagina, setPagina] = useState(1)
  const [alvo, setAlvo] = useState<{ p: PerfilPro; acao: 'APROVADO' | 'REJEITADO' } | null>(null)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const [busy, setBusy] = useState(false)

  if (usuario && !usuario.admin) return <Navigate to="/acesso-negado" replace />

  const pendentes = perfis.filter((p) => p.status === 'PENDENTE' && (!tipo || p.papel === tipo)).sort((a, b) => (ordem === 'antigos' ? (a.enviadoEm ?? 0) - (b.enviadoEm ?? 0) : (b.enviadoEm ?? 0) - (a.enviadoEm ?? 0)))
  const total = Math.max(1, Math.ceil(pendentes.length / POR_PAGINA))
  const atual = Math.min(pagina, total)

  const decidir = () => {
    if (!alvo || busy) return
    if (alvo.acao === 'REJEITADO' && !motivo.trim()) return setErro('Informe o motivo da rejeição.')
    setBusy(true)
    const { p, acao } = alvo
    setPerfis((l) => l.map((x) => (x.userId === p.userId && x.papel === p.papel ? { ...x, status: acao, motivo: acao === 'REJEITADO' ? motivo.trim() : undefined } : x)))
    setHistorico((h) => [{ id: Date.now(), quando: Date.now(), nome: p.nome, papel: p.papel, decisao: acao, motivo: acao === 'REJEITADO' ? motivo.trim() : undefined, por: usuario?.username ?? 'admin' }, ...h])
    toast.sucesso(acao === 'APROVADO' ? 'Perfil aprovado.' : 'Perfil rejeitado.')
    setAlvo(null); setMotivo(''); setErro(''); setBusy(false)
  }

  return (
    <Protegida>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold">Curadoria</h1>
          <p className="text-xs text-ink-faint">Demonstração: ações manuais salvas só neste navegador.</p>
        </div>

        <section className="card space-y-4 p-5" aria-labelledby="fila-t">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="fila-t" className="text-lg font-bold">Fila de verificações ({pendentes.length})</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              <select aria-label="Filtrar por tipo" className="input !w-auto !rounded-full" value={tipo} onChange={(e) => { setTipo(e.target.value as '' | Papel); setPagina(1) }}>
                <option value="">Todos os tipos</option><option value="CHEF">Chef</option><option value="NUTRICIONISTA">Nutricionista</option><option value="RESTAURANTE">Restaurante</option>
              </select>
              <select aria-label="Ordenar por data" className="input !w-auto !rounded-full" value={ordem} onChange={(e) => setOrdem(e.target.value as 'antigos' | 'recentes')}>
                <option value="antigos">Mais antigos primeiro</option><option value="recentes">Mais recentes primeiro</option>
              </select>
            </div>
          </div>
          {pendentes.length === 0 ? <EstadoVazio titulo="Nenhuma verificação pendente" /> : (
            <ul className="space-y-3">
              {pendentes.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA).map((p) => (
                <li key={`${p.userId}-${p.papel}`} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-4 text-sm">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p><b>{p.nome}</b> · {nomes[p.papel]}</p>
                    {p.crn && <p className="text-xs text-ink-soft">CRN: {mascaraCRN(p.crn)}</p>}
                    {p.cnpj && <p className="text-xs text-ink-soft">CNPJ: {p.cnpj}</p>}
                    {p.bio && <p className="line-clamp-2 text-xs text-ink-soft">{p.bio}</p>}
                    <p className="text-xs text-ink-faint">{p.comprovante ?? 'Sem comprovante'} · enviado {p.enviadoEm ? dataRelativa(p.enviadoEm) : 'em data desconhecida'}</p>
                  </div>
                  <button className="btn-primary !py-2 text-xs" onClick={() => { setAlvo({ p, acao: 'APROVADO' }); setMotivo(''); setErro('') }}>Aprovar</button>
                  <button className="btn-ghost !py-2 text-xs" onClick={() => { setAlvo({ p, acao: 'REJEITADO' }); setMotivo(''); setErro('') }}>Rejeitar</button>
                </li>
              ))}
            </ul>
          )}
          <Paginacao pagina={atual} total={total} onMudar={setPagina} />
        </section>

        <section className="card space-y-3 p-5" aria-labelledby="hist-t">
          <h2 id="hist-t" className="text-lg font-bold">Histórico de decisões</h2>
          {historico.length === 0 ? <p className="text-sm text-ink-soft">Nenhuma decisão ainda.</p> : (
            <ul className="space-y-2 text-sm">
              {historico.slice(0, 15).map((h) => (
                <li key={h.id} className="rounded-xl bg-cream p-3">
                  <b>{h.nome}</b> ({nomes[h.papel]}) · <span className={h.decisao === 'APROVADO' ? 'text-leaf' : 'text-alert'}>{h.decisao}</span> por {h.por} · {dataRelativa(h.quando)}
                  {h.motivo && <p className="text-xs text-ink-soft">Motivo: {h.motivo}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card space-y-3 p-5" aria-labelledby="den-t">
          <h2 id="den-t" className="text-lg font-bold">Denúncias ({denuncias.filter((d) => !d.resolvida).length} abertas)</h2>
          {denuncias.length === 0 && <p className="text-sm text-ink-soft">Nenhuma denúncia.</p>}
          {denuncias.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-3 text-sm">
              <div className="min-w-0 flex-1"><b>{d.motivo}</b> · receita {d.receita}<p className="text-xs text-ink-faint">por {d.autor} · {d.quando}{d.resolvida ? ' · resolvida' : ''}</p></div>
              {!d.resolvida && <button className="btn-ghost !py-1.5 text-xs" onClick={() => setDenuncias((l) => l.map((x) => (x.id === d.id ? { ...x, resolvida: true } : x)))}>Marcar resolvida</button>}
            </div>
          ))}
        </section>

        <Modal titulo={alvo?.acao === 'APROVADO' ? `Aprovar ${alvo?.p.nome}?` : `Rejeitar ${alvo?.p.nome}?`} aberto={!!alvo} onFechar={() => setAlvo(null)}>
          {alvo?.acao === 'REJEITADO' && (
            <div className="space-y-1 text-xs font-semibold text-ink-soft">
              <label htmlFor="motivo">Motivo (obrigatório)</label>
              <textarea id="motivo" className="input" rows={3} value={motivo} onChange={(e) => { setMotivo(e.target.value); setErro('') }} aria-invalid={!!erro} />
              {erro && <p role="alert" className="font-normal text-alert">{erro}</p>}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setAlvo(null)}>Cancelar</button>
            <button className="btn-primary" disabled={busy} onClick={decidir}>{alvo?.acao === 'APROVADO' ? 'Aprovar' : 'Rejeitar'}</button>
          </div>
        </Modal>
      </div>
    </Protegida>
  )
}
