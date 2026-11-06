import { Link } from 'react-router-dom'
import { useAuth } from '../context/Auth'

export default function Footer() {
  const { usuario } = useAuth()
  return (
    <footer className="border-t border-line bg-peach/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-extrabold text-terra">
            GastroMatch
          </p>
          <p className="mt-2 text-xs text-ink-faint">© 2026 GastroMatch. Receitas, chefs e restaurantes.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-ink-soft">
          <Link to="/receitas" className="hover:text-terra">Receitas</Link>
          <Link to="/restaurantes" className="hover:text-terra">Restaurantes</Link>
          <Link to="/profissionais" className="hover:text-terra">Profissionais</Link>
          <Link to="/portal" className="hover:text-terra">Portal profissional</Link>
          {usuario?.admin && <Link to="/admin" className="hover:text-terra">Curadoria</Link>}
        </nav>
      </div>
    </footer>
  )
}
