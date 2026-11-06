import { Link } from 'react-router-dom'
import { Utensils } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-peach/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-extrabold text-terra">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-terra text-on-accent"><Utensils size={16} /></span>
            GastroMatch
          </p>
          <p className="mt-2 text-xs text-ink-faint">© 2026 GastroMatch. Receitas, chefs e restaurantes.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-ink-soft">
          <Link to="/profissionais" className="hover:text-terra">Diretório</Link>
          <Link to="/portal" className="hover:text-terra">Portal profissional</Link>
          <Link to="/admin" className="hover:text-terra">Curadoria</Link>
        </nav>
      </div>
    </footer>
  )
}
