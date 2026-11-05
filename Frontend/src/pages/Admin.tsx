import { useAuth } from '../context/Auth'
import Protegida from '../components/Protegida'
import { useLocalState } from '../hooks/useLocalState'
import type { Denuncia, Status } from '../lib/tipos'

// Painel de curadoria de DEMONSTRAÇÃO: sem servidor, qualquer conta logada neste navegador acessa.
export default function Admin() {
  const { perfis, setPerfis } = useAuth()
  const [denuncias, setDenuncias] = useLocalState<Denuncia[]>('gm-denuncias', [])
  const nutris = perfis.filter((p) => p.papel === 'NUTRICIONISTA')
  const mudar = (userId: string, status: Status) =>
    setPerfis((l) => l.map((p) => (p.userId === userId && p.papel === 'NUTRICIONISTA' ? { ...p, status } : p)))

  return (
    <Protegida>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Curadoria</h1>
          <p className="text-xs text-ink-faint">Demonstração: ações manuais salvas só neste navegador.</p>
        </div>
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Nutricionistas ({nutris.length})</h2>
          {nutris.length === 0 && <p className="text-sm text-ink-soft">Nenhum cadastro.</p>}
          {nutris.map((p) => (
            <div key={p.userId} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3 text-sm">
              <div className="min-w-0 flex-1">
                <b>{p.nome}</b> · CRN {p.crn}
                <p className="text-xs text-ink-faint">{p.comprovante ?? 'Sem comprovante'} · {p.status}</p>
              </div>
              <button className="btn-primary !py-1.5 text-xs" onClick={() => mudar(p.userId, 'APROVADO')}>Aprovar</button>
              <button className="btn-ghost !py-1.5 text-xs" onClick={() => mudar(p.userId, 'REJEITADO')}>Reprovar</button>
            </div>
          ))}
        </section>
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Denúncias ({denuncias.filter((d) => !d.resolvida).length} abertas)</h2>
          {denuncias.length === 0 && <p className="text-sm text-ink-soft">Nenhuma denúncia.</p>}
          {denuncias.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3 text-sm">
              <div className="min-w-0 flex-1">
                <b>{d.motivo}</b> · receita {d.receita}
                <p className="text-xs text-ink-faint">por {d.autor} · {d.quando}{d.resolvida ? ' · resolvida' : ''}</p>
              </div>
              {!d.resolvida && (
                <button className="btn-ghost !py-1.5 text-xs" onClick={() => setDenuncias((l) => l.map((x) => (x.id === d.id ? { ...x, resolvida: true } : x)))}>
                  Marcar resolvida
                </button>
              )}
            </div>
          ))}
        </section>
      </div>
    </Protegida>
  )
}
