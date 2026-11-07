import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { buscarStatusPerfis, type StatusPerfil } from '../api/perfis'
import { Aviso } from '../components/Campo'
import Protegida from '../components/Protegida'
import { EstadoVazio } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'

// confirmar: a lista de receitas do chef e as estatísticas dependem do filtro chefId em GET /receitas
// (e dos endpoints de favoritos e comentários). Até lá o painel só confirma o acesso e leva para a publicação.
export default function Painel() {
  useSeo({ titulo: 'Painel do chef' })
  const { accessToken } = useAuth()
  const [perfis, setPerfis] = useState<StatusPerfil[] | null>(null)
  const [erro, setErro] = useState('')
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    if (!accessToken) return
    let ativo = true
    setErro('')
    buscarStatusPerfis(accessToken)
      .then((lista) => { if (ativo) setPerfis(lista) })
      .catch(() => { if (ativo) setErro('Não foi possível carregar seu perfil de chef.') })
    return () => { ativo = false }
  }, [accessToken, recarga])

  const chef = perfis?.find((p) => p.papel === 'CHEF')

  return (
    <Protegida>
      {erro && (
        <div className="space-y-3">
          <Aviso tipo="erro">{erro}</Aviso>
          <button className="btn-ghost" onClick={() => setRecarga((x) => x + 1)}>Tentar de novo</button>
        </div>
      )}

      {perfis === null && !erro && <p className="card p-10 text-center text-sm text-ink-soft">Carregando...</p>}

      {perfis && !chef && (
        <EstadoVazio
          titulo="Só chefs aprovados acessam o painel"
          texto="Crie seu perfil de chef para gerenciar receitas."
          acao={{ to: '/onboarding', rotulo: 'Criar perfil de chef' }}
        />
      )}

      {chef && chef.status !== 'APROVADO' && (
        <EstadoVazio
          titulo={chef.status === 'PENDENTE' ? 'Seu perfil de chef está em análise' : 'Seu perfil de chef não foi aprovado'}
          texto="O painel fica disponível depois da aprovação do perfil."
          acao={{ to: '/verificacao', rotulo: 'Ver status da verificação' }}
        />
      )}

      {chef && chef.status === 'APROVADO' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-extrabold">Painel do chef</h1>
            <Link to="/publicar" className="btn-primary"><Plus size={16} /> Nova receita</Link>
          </div>
          <EstadoVazio
            titulo="Suas receitas aparecem aqui em breve"
            texto="A lista com edição, exclusão e estatísticas ainda não está disponível. Você já pode publicar novas receitas."
            acao={{ to: '/publicar', rotulo: 'Criar receita' }}
          />
        </div>
      )}
    </Protegida>
  )
}