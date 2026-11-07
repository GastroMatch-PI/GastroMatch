import { ArrowUpRight, Clock, Heart, Users } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import { mensagem, urlImagem } from '../lib/api'
import type { ReceitaResumo } from '../lib/apiTipos'
import { useToast } from './Feedback'
import Photo from './Photo'

export default function RecipeCard({ receita: r, featured = false }: { receita: ReceitaResumo; featured?: boolean }) {
  const { usuario, favoritos, alternarFavorito } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const toast = useToast()
  const salvo = favoritos.has(r.id)
  const img = urlImagem(r.imagem)

  const favoritar = async () => {
    if (!usuario) return nav('/login', { state: { from: loc.pathname + loc.search } })
    try {
      await alternarFavorito(r.id)
      toast.sucesso(salvo ? 'Removida dos favoritos.' : 'Adicionada aos favoritos.')
    } catch (e) {
      toast.erro(mensagem(e)) // o coração já voltou ao estado anterior
    }
  }

  return (
    <article
      className={`group relative isolate overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-soft transition duration-500 hover:-translate-y-1.5 hover:border-terra/50 hover:shadow-lift ${featured ? 'aspect-[4/5] sm:aspect-auto sm:h-full sm:min-h-[28rem]' : 'aspect-[4/5]'}`}
    >
      <div className="absolute inset-0 -z-10">
        <Photo emoji="🍽️" seed={r.id} className="h-full w-full">
          {img && <img src={img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110" />}
        </Photo>
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-transparent" aria-hidden />
      <Link to={`/receita/${r.id}`} aria-label={r.nome} className="absolute inset-0 z-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
          <Clock size={13} /> {r.tempoPreparo} min
        </span>
        <button
          onClick={favoritar}
          aria-pressed={salvo}
          aria-label={salvo ? 'Remover dos favoritos' : 'Favoritar receita'}
          className="pointer-events-auto relative z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition duration-300 hover:scale-110 hover:bg-black/75"
        >
          <Heart size={18} className={salvo ? 'fill-terra text-terra' : ''} />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-3 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-terra">Chef {r.chef.username}</p>
        <h3 className={`font-display font-bold leading-[1.1] text-white ${featured ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>{r.nome}</h3>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/85">
            <span className="rounded-full border border-white/25 px-2.5 py-1">{ENUMS.dificuldade[r.dificuldade]}</span>
            <span className="inline-flex items-center gap-1"><Users size={13} /> {r.nPorcoes} porções</span>
          </div>
          <span className="flex h-10 w-10 shrink-0 translate-y-2 items-center justify-center rounded-full bg-terra text-on-accent opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100" aria-hidden>
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </article>
  )
}
