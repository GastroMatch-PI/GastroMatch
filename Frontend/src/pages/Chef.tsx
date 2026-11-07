import { BadgeCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../components/Photo'
import { Carregando, ErroApi } from '../components/Ui'
import { ENUMS } from '../data/enums'
import type { ChefPerfil } from '../lib/apiTipos'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'

export default function Chef() {
  const { id = '' } = useParams()
  const { dados: c, erro, lento, recarregar } = useApi<ChefPerfil>(/^\d+$/.test(id) ? `/chefs/${id}` : null)
  useSeo({ titulo: c ? `Chef ${c.username}` : 'Chef', descricao: c?.bio ?? undefined })

  if (!/^\d+$/.test(id)) return <ErroApi erro={{ message: 'Chef inválido.', status: 404 }} />
  if (erro) return <ErroApi erro={erro} onTentar={recarregar} />
  if (!c) return <Carregando lento={lento} texto="Carregando chef" />

  // só dados públicos: a API não devolve e-mail nem dados da conta
  return (
    <div className="space-y-8">
      <header className="card flex flex-wrap items-center gap-5 p-6">
        <Avatar className="h-20 w-20" />
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="flex flex-wrap items-center gap-2 text-3xl font-extrabold">Chef {c.username} <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2.5 py-1 text-xs font-semibold text-leaf"><BadgeCheck size={13} /> Chef</span></h1>
          {c.especializacao && <p className="text-sm font-semibold text-terra">{ENUMS.especializacao[c.especializacao]}</p>}
          {c.bio && <p className="max-w-2xl text-sm text-ink-soft">{c.bio}</p>}
        </div>
      </header>

      {c.idRestaurante && (
        <section className="space-y-2" aria-labelledby="atua-t">
          <h2 id="atua-t" className="text-xl font-bold">Onde atua</h2>
          <Link to={`/restaurante/${c.idRestaurante}`} className="btn-ghost">{c.nomeRestaurante}</Link>
        </section>
      )}
      <p className="text-xs text-ink-faint">Compartilhe esta página: <Link className="underline" to={`/chef/${c.id}`}>{location.origin}/chef/{c.id}</Link></p>
    </div>
  )
}
