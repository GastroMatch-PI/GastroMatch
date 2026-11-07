import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarStatusPerfis, type PapelApi, type StatusApi, type StatusPerfil } from '../api/perfis'
import Protegida from '../components/Protegida'
import { EstadoVazio } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'

const nomes: Record<PapelApi, string> = { CHEF: 'Chef', NUTRICIONISTA: 'Nutricionista', RESTAURANTE: 'Restaurante' }

const info: Record<StatusApi, { Icon: typeof Clock; cor: string; titulo: string; texto: string }> = {
  PENDENTE: {
    Icon: Clock,
    cor: 'text-gold',
    titulo: 'Em análise',
    texto: 'Nossa equipe confere o registro manualmente. Enquanto isso, seu perfil não aparece no diretório.',
  },
  APROVADO: { Icon: CheckCircle2, cor: 'text-leaf', titulo: 'Aprovado', texto: 'Seu perfil está verificado e visível no diretório.' },
  REJEITADO: { Icon: XCircle, cor: 'text-alert', titulo: 'Rejeitado', texto: 'Seu perfil não foi aceito na verificação.' },
}

export default function Verificacao() {
  useSeo({ titulo: 'Status da verificação' })
  const { accessToken } = useAuth()
  const [perfis, setPerfis] = useState<StatusPerfil[] | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!accessToken) return
    let ativo = true
    buscarStatusPerfis(accessToken)
      .then((l) => { if (ativo) setPerfis(l) })
      .catch(() => { if (ativo) setErro('Não foi possível carregar o status dos seus perfis.') })
    return () => { ativo = false }
  }, [accessToken])

  return (
    <Protegida>
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-3xl font-extrabold">Status da verificação</h1>

        {erro && <p role="alert" className="card p-5 text-sm text-alert">{erro}</p>}
        {perfis === null && !erro && <p className="card p-5 text-sm text-ink-soft">Carregando...</p>}

        {perfis?.length === 0 && (
          <EstadoVazio titulo="Você ainda não enviou um perfil" acao={{ to: '/onboarding', rotulo: 'Criar perfil profissional' }} />
        )}

        {perfis?.map((p) => {
          // status fora do enum cai em "em análise" em vez de quebrar a tela
          const { Icon, cor, titulo, texto } = info[p.status] ?? info.PENDENTE
          return (
            <section key={p.papel} className="card space-y-3 p-5" aria-live="polite">
              <div className="flex items-center gap-3">
                <Icon className={cor} size={26} />
                <div>
                  <p className="text-xs font-semibold text-ink-faint">{nomes[p.papel]}</p>
                  <h2 className={`text-xl font-bold ${cor}`}>{p.status} · {titulo}</h2>
                </div>
              </div>
              <p className="text-sm text-ink-soft">{texto}</p>
              {p.status === 'REJEITADO' && (
                <p className="rounded-xl bg-alert-soft p-3 text-sm text-alert">
                  <b>Motivo:</b> {p.motivo ?? 'Não informado.'}
                </p>
              )}
            </section>
          )
        })}

        <p className="text-xs text-ink-faint">
          <Link className="underline" to="/conta">Voltar à conta</Link>
        </p>
      </div>
    </Protegida>
  )
}