import { Link, useNavigate } from 'react-router-dom'
import Protegida from '../components/Protegida'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'

const nomes = { CHEF: 'Chef', NUTRICIONISTA: 'Nutricionista', RESTAURANTE: 'Restaurante' }

export default function Conta() {
  useSeo({ titulo: 'Minha conta' })
  const { usuario, perfil, sair } = useAuth()
  const nav = useNavigate()
  return (
    <Protegida>
      <div className="card mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Minha conta</h1>
        <p className="text-sm"><b>{usuario?.username}</b> · {usuario?.email}</p>
        <p className="text-xs text-ink-soft">Perfil profissional: {perfil ? nomes[perfil.papel] : 'nenhum'}</p>
        <div className="flex flex-wrap gap-2">
          <Link to={perfil ? '/portal' : '/onboarding'} className="btn-ghost">{perfil ? 'Editar perfil profissional' : 'Criar perfil profissional'}</Link>
          {perfil?.papel === 'CHEF' && <Link to="/publicar" className="btn-ghost">Publicar receita</Link>}
          <Link to="/favoritos" className="btn-ghost">Favoritos</Link>
          <button className="btn-primary" onClick={async () => { await sair(); nav('/') }}>Sair</button>
        </div>
      </div>
    </Protegida>
  )
}
