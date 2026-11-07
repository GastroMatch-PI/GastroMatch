import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { buscarStatusPerfis, type PapelApi, type StatusApi, type StatusPerfil } from '../api/perfis'
import Protegida from '../components/Protegida'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'

const nomes: Record<PapelApi, string> = { CHEF: 'Chef', NUTRICIONISTA: 'Nutricionista', RESTAURANTE: 'Restaurante' }
const cor: Record<StatusApi, string> = { PENDENTE: 'bg-gold-soft text-gold', APROVADO: 'bg-leaf-soft text-leaf', REJEITADO: 'bg-alert-soft text-alert' }

export default function Conta() {
  useSeo({ titulo: 'Minha conta' })
  const { usuario, accessToken, sair } = useAuth()
  const nav = useNavigate()
  const [perfis, setPerfis] = useState<StatusPerfil[] | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!accessToken) return
    let ativo = true
    buscarStatusPerfis(accessToken)
      .then((l) => { if (ativo) setPerfis(l) })
      .catch(() => { if (ativo) setErro('Não foi possível carregar seus perfis profissionais.') })
    return () => { ativo = false }
  }, [accessToken])

  return (
    <Protegida>
      <div className="card mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Minha conta</h1>
        <p className="text-sm"><b>{usuario?.username}</b> · {usuario?.email}</p>
        <div className="space-y-2">
          <h2 className="text-sm font-bold">Perfis profissionais</h2>
          {erro && <p role="alert" className="text-xs text-alert">{erro}</p>}
          {perfis === null && !erro && <p className="text-xs text-ink-soft">Carregando...</p>}
          {perfis?.length === 0 && <p className="text-xs text-ink-soft">Nenhum perfil criado.</p>}
          {perfis?.map((p) => (
            <p key={p.papel} className="flex items-center gap-2 text-xs text-ink-soft">
              {nomes[p.papel]}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cor[p.status] ?? ''}`}>{p.status}</span>
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/onboarding" className="btn-ghost">Criar perfil profissional</Link>
          <Link to="/portal" className="btn-ghost">Editar vitrine</Link>
          <Link to="/publicar" className="btn-ghost">Publicar receita</Link>
          <Link to="/favoritos" className="btn-ghost">Favoritos</Link>
          <Link to="/verificacao" className="btn-ghost">Verificação</Link>
          <button className="btn-primary" onClick={() => { sair(); nav('/') }}>Sair</button>
        </div>
      </div>
    </Protegida>
  )
}