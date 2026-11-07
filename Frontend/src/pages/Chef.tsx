import { BadgeCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../api/http'
import { buscarChefPublico, type ChefPerfilDto } from '../api/perfis'
import { Avatar } from '../components/Photo'
import { EstadoVazio } from '../components/Ui'
import { ENUMS } from '../data/enums'
import { useSeo } from '../lib/seo'

type Estado = 'carregando' | 'ok' | 'nao-encontrado' | 'erro'

export default function Chef() {
  const { id = '' } = useParams()
  const [chef, setChef] = useState<ChefPerfilDto | null>(null)
  const [estado, setEstado] = useState<Estado>('carregando')
  useSeo({ titulo: chef ? `Chef ${chef.nome}` : 'Chef', descricao: chef?.bio ?? undefined })

  useEffect(() => {
    let ativo = true
    setEstado('carregando')
    buscarChefPublico(id)
      .then((c) => {
        if (!ativo) return
        setChef(c)
        setEstado(c ? 'ok' : 'nao-encontrado')
      })
      .catch((e) => {
        if (!ativo) return
        setChef(null)
        setEstado(e instanceof ApiError && e.status === 404 ? 'nao-encontrado' : 'erro')
      })
    return () => {
      ativo = false
    }
  }, [id])

  if (estado === 'carregando')
    return <p className="card p-10 text-center text-sm text-ink-soft">Carregando perfil...</p>

  if (estado === 'nao-encontrado')
    return (
      <EstadoVazio
        titulo="Chef não encontrado"
        texto="O link pode estar errado ou o perfil não existe."
        acao={{ to: '/profissionais', rotulo: 'Ver profissionais' }}
      />
    )

  if (estado === 'erro' || !chef)
    return (
      <EstadoVazio
        titulo="Não foi possível carregar o perfil"
        texto="Tente novamente em instantes."
        acao={{ to: '/', rotulo: 'Voltar ao início' }}
      />
    )

  const especializacao = chef.especializacao
    ? (ENUMS.especializacao as Record<string, string>)[chef.especializacao] ?? chef.especializacao
    : null

  return (
    <div className="space-y-8">
      <header className="card flex flex-wrap items-center gap-5 p-6">
        <Avatar className="h-20 w-20" />
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="flex flex-wrap items-center gap-2 text-3xl font-extrabold">
            Chef {chef.nome}
            <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2.5 py-1 text-xs font-semibold text-leaf">
              <BadgeCheck size={13} /> Verificado
            </span>
          </h1>
          {especializacao && <p className="text-sm font-semibold text-terra">{especializacao}</p>}
          {chef.bio && <p className="max-w-2xl text-sm text-ink-soft">{chef.bio}</p>}
        </div>
      </header>
    </div>
  )
}