import { Link, useNavigate } from 'react-router-dom'
import Protegida from '../components/Protegida'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'

const nomes = { CHEF: 'Chef', NUTRICIONISTA: 'Nutricionista', RESTAURANTE: 'Restaurante' }
const cor = { PENDENTE: 'bg-gold-soft text-gold', APROVADO: 'bg-leaf-soft text-leaf', REJEITADO: 'bg-alert-soft text-alert' }

export default function Conta() {
  useSeo({ titulo: 'Minha conta' })
  const { usuario, meusPerfis, sair } = useAuth()
  const nav = useNavigate()
  return (
    <Protegida>
      <div className="card mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Minha conta</h1>
        <p className="text-sm"><b>{usuario?.username}</b> · {usuario?.email}</p>
        <div className="space-y-2">
          <h2 className="text-sm font-bold">Perfis profissionais</h2>
          {meusPerfis.length === 0 && <p className="text-xs text-ink-soft">Nenhum perfil criado.</p>}
          {meusPerfis.map((p) => (
            <p key={p.papel} className="flex items-center gap-2 text-xs text-ink-soft">
              {nomes[p.papel]}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cor[p.status]}`}>{p.status}</span>
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/onboarding" className="btn-ghost">Criar perfil profissional</Link>
          <Link to="/perfil" className="btn-ghost">Meu perfil</Link>
          <Link to="/portal" className="btn-ghost">Editar vitrine</Link>
          <Link to="/publicar" className="btn-ghost">Publicar receita</Link>
          <Link to="/favoritos" className="btn-ghost">Favoritos</Link>
          <button className="btn-primary" onClick={() => { sair(); nav('/') }}>Sair</button>
        </div>
      </div>
    </Protegida>
  )
}
