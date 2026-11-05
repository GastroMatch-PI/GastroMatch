import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import Protegida from '../components/Protegida'
import { useAuth } from '../context/Auth'

type Perfil = { status?: string } | null

const nomes: Record<string, string> = { chefs: 'Chef', nutricionistas: 'Nutricionista', restaurantes: 'Restaurante' }

export default function Conta() {
  const { usuario, sair } = useAuth()
  const nav = useNavigate()
  const [perfis, setPerfis] = useState<Record<string, Perfil>>({})

  useEffect(() => {
    for (const r of Object.keys(nomes)) {
      api<Perfil>(`/${r}/me`)
        .then((d) => setPerfis((p) => ({ ...p, [r]: d })))
        .catch(() => undefined)
    }
  }, [])

  const ativos = Object.entries(perfis).filter(([, v]) => v)

  return (
    <Protegida>
      <div className="card mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Minha conta</h1>
        <p className="text-sm">
          <b>{usuario?.username}</b> · {usuario?.email}
        </p>
        <div className="space-y-1">
          <h2 className="text-sm font-bold">Perfis profissionais</h2>
          {ativos.length === 0 && <p className="text-xs text-ink-soft">Nenhum perfil criado.</p>}
          {ativos.map(([k, v]) => (
            <p key={k} className="text-xs text-ink-soft">
              {nomes[k]}
              {v?.status ? ` · ${v.status}` : ''}
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/onboarding" className="btn-ghost">Criar perfil profissional</Link>
          <Link to="/publicar" className="btn-ghost">Publicar receita</Link>
          <Link to="/favoritos" className="btn-ghost">Favoritos</Link>
          <button className="btn-primary" onClick={async () => { await sair(); nav('/') }}>Sair</button>
        </div>
      </div>
    </Protegida>
  )
}
