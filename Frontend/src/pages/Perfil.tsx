import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Opcoes } from '../components/Campo'
import { Avatar } from '../components/Photo'
import Protegida from '../components/Protegida'
import { EstadoVazio } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import {
  atualizarPerfilChef,
  buscarChefMe,
  buscarStatusPerfis,
  type ChefPerfilDto,
  type PapelApi,
  type StatusPerfil,
} from '../api/perfis'
import { useSeo } from '../lib/seo'

const nomes: Record<PapelApi, string> = {
  CHEF: 'Chef',
  NUTRICIONISTA: 'Nutricionista',
  RESTAURANTE: 'Restaurante',
}

const statusTxt: Record<string, string> = {
  PENDENTE: 'Em análise: verificação manual pendente. Seu perfil não aparece no diretório até a aprovação.',
  APROVADO: 'Perfil aprovado e visível no diretório.',
  REJEITADO: 'Perfil reprovado na verificação.',
}

export default function Portal() {
  useSeo({ titulo: 'Meu painel' })

  const { accessToken } = useAuth()
  const [perfis, setPerfis] = useState<StatusPerfil[] | null>(null)
  const [papel, setPapel] = useState<PapelApi | null>(null)
  const [chef, setChef] = useState<ChefPerfilDto | null>(null)
  const [draft, setDraft] = useState({ bio: '', especializacao: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    if (!accessToken) return

    buscarStatusPerfis(accessToken)
      .then((lista) => {
        setPerfis(lista)
        setPapel(lista[0]?.papel ?? null)
      })
      .catch(() => setErro('Não foi possível carregar seus perfis.'))
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !perfis?.some((p) => p.papel === 'CHEF')) return

    buscarChefMe(accessToken)
      .then((c) => {
        if (!c) return
        setChef(c)
        setDraft({
          bio: c.bio ?? '',
          especializacao: c.especializacao ?? '',
        })
      })
      .catch(() => setErro('Não foi possível carregar o perfil de chef.'))
  }, [accessToken, perfis])

  const atual = perfis?.find((p) => p.papel === papel)

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return

    setSalvando(true)
    setErro('')
    setSalvo(false)

    try {
      const c = await atualizarPerfilChef(accessToken, {
        especializacao: draft.especializacao,
        bio: draft.bio || undefined,
      })

      if (c) setChef(c)
      setSalvo(true)
    } catch (x) {
      setErro((x as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Protegida>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {perfis === null && !erro && (
        <p className="card p-10 text-center text-sm text-ink-soft">
          Carregando...
        </p>
      )}

      {perfis?.length === 0 && (
        <EstadoVazio
          titulo="Você ainda não tem perfil profissional"
          acao={{ to: '/onboarding', rotulo: 'Criar perfil' }}
        />
      )}

      {atual && (
        <div className="space-y-6">
          <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-peach p-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-bold">
                {nomes[atual.papel]} · {atual.status}
              </h1>
              <p className="text-xs text-ink-soft">{statusTxt[atual.status]}</p>
            </div>

            {perfis && perfis.length > 1 && (
              <select
                className="input !w-auto"
                value={atual.papel}
                onChange={(e) => setPapel(e.target.value as PapelApi)}
              >
                {perfis.map((p) => (
                  <option key={p.papel} value={p.papel}>
                    {nomes[p.papel]}
                  </option>
                ))}
              </select>
            )}
          </section>

          <section className="card space-y-5 p-5 md:p-6">
            {atual.papel === 'CHEF' && chef && (
              <form onSubmit={salvar} className="grid gap-5 md:grid-cols-[220px_1fr]">
                <div className="rounded-xl border border-line bg-peach p-4 text-center">
                  <Avatar className="mx-auto h-20 w-20" />
                  <p className="mt-2 font-display text-lg font-bold">{chef.nome}</p>
                  <p className="text-[11px] font-semibold text-terra">Chef</p>
                </div>

                <div className="space-y-4">
                  <Campo label="Especialização">
                    <select
                      className="input"
                      required
                      value={draft.especializacao}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, especializacao: e.target.value }))
                      }
                    >
                      <option value="">Selecione</option>
                      <Opcoes mapa={ENUMS.especializacao} />
                    </select>
                  </Campo>

                  <Campo label="Biografia" dica={`${draft.bio.length} / 500`}>
                    <textarea
                      className="input h-24 resize-y"
                      maxLength={500}
                      value={draft.bio}
                      onChange={(e) => {
                        setSalvo(false)
                        setDraft((d) => ({ ...d, bio: e.target.value }))
                      }}
                    />
                  </Campo>

                  <div className="flex items-center justify-end gap-3">
                    {salvo && (
                      <span className="text-xs font-semibold text-leaf">Salvo</span>
                    )}
                    <button className="btn-primary" disabled={salvando}>
                      {salvando ? 'Salvando...' : 'Salvar perfil'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {atual.papel !== 'CHEF' && (
              <p className="text-sm text-ink-soft">
                A edição do perfil de {nomes[atual.papel].toLowerCase()} ainda não está disponível pela API.
              </p>
            )}

            {atual.papel === 'CHEF' && !chef && (
              <p className="text-sm text-ink-soft">Carregando perfil de chef...</p>
            )}
          </section>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ink-faint">
        <Link to="/conta" className="underline">Voltar à conta</Link>
      </p>
    </Protegida>
  )
}