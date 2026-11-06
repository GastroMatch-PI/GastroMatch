import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../components/Feedback'
import Protegida from '../components/Protegida'
import { EstadoVazio } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'
import type { Papel, Status } from '../lib/tipos'

const nomes: Record<Papel, string> = { CHEF: 'Chef', NUTRICIONISTA: 'Nutricionista', RESTAURANTE: 'Restaurante' }
const info: Record<Status, { Icon: typeof Clock; cor: string; titulo: string; texto: string }> = {
  PENDENTE: { Icon: Clock, cor: 'text-gold', titulo: 'Em análise', texto: 'Nossa equipe confere o comprovante manualmente. Enquanto isso, seu perfil não aparece no diretório e você não publica como profissional verificado.' },
  APROVADO: { Icon: CheckCircle2, cor: 'text-leaf', titulo: 'Aprovado', texto: 'Seu perfil está verificado e visível no diretório.' },
  REJEITADO: { Icon: XCircle, cor: 'text-alert', titulo: 'Rejeitado', texto: 'O comprovante não foi aceito. Veja o motivo abaixo e envie um novo arquivo.' },
}

export default function Verificacao() {
  useSeo({ titulo: 'Status da verificação' })
  const { usuario, meusPerfis, setPerfis } = useAuth()
  const toast = useToast()
  const file = useRef<HTMLInputElement>(null)

  const reenviar = (papel: Papel, f?: File) => {
    if (!f) return
    setPerfis((l) => l.map((p) => (p.userId === usuario?.id && p.papel === papel ? { ...p, status: 'PENDENTE', motivo: undefined, comprovante: `${f.name} • ${(f.size / 1048576).toFixed(1)} MB`, enviadoEm: Date.now() } : p)))
    toast.sucesso('Comprovante reenviado. Status: pendente.')
  }

  return (
    <Protegida>
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-3xl font-extrabold">Status da verificação</h1>
        {meusPerfis.length === 0 ? (
          <EstadoVazio titulo="Você ainda não enviou um perfil" acao={{ to: '/onboarding', rotulo: 'Criar perfil profissional' }} />
        ) : (
          meusPerfis.map((p) => {
            const { Icon, cor, titulo, texto } = info[p.status]
            return (
              <section key={p.papel} className="card space-y-3 p-5" aria-live="polite">
                <div className="flex items-center gap-3">
                  <Icon className={cor} size={26} />
                  <div><p className="text-xs font-semibold text-ink-faint">{nomes[p.papel]}</p><h2 className={`text-xl font-bold ${cor}`}>{p.status === 'PENDENTE' ? 'PENDENTE' : p.status} · {titulo}</h2></div>
                </div>
                <p className="text-sm text-ink-soft">{texto}</p>
                {p.status === 'REJEITADO' && <p className="rounded-xl bg-alert-soft p-3 text-sm text-alert"><b>Motivo:</b> {p.motivo ?? 'Não informado.'}</p>}
                {p.papel === 'NUTRICIONISTA' && p.status !== 'APROVADO' && <p className="rounded-xl bg-gold-soft p-3 text-xs text-gold">Algumas ações dependem da aprovação: seu perfil só aparece no diretório depois de aprovado.</p>}
                {p.comprovante && <p className="text-xs text-ink-faint">Comprovante: {p.comprovante}</p>}
                {p.papel === 'NUTRICIONISTA' && p.status === 'REJEITADO' && (
                  <>
                    <input ref={file} type="file" accept=".pdf,image/*" hidden onChange={(e) => { reenviar(p.papel, e.target.files?.[0]); e.target.value = '' }} />
                    <button className="btn-primary" onClick={() => file.current?.click()}>Reenviar comprovante</button>
                  </>
                )}
              </section>
            )
          })
        )}
        <p className="text-xs text-ink-faint">O status é atualizado nesta tela assim que a curadoria decide. <Link className="underline" to="/conta">Voltar à conta</Link></p>
      </div>
    </Protegida>
  )
}
