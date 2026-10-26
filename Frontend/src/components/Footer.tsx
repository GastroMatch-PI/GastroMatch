import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="wrap flex flex-col gap-8 py-12 md:flex-row md:justify-between">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-soft">Receitas, chefs e nutricionistas em um só lugar.</p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-col gap-2 text-sm text-soft">
          <Link to="/" className="hover:text-ink">Receitas</Link>
          <Link to="/profissionais" className="hover:text-ink">Chefs e restaurantes</Link>
          <Link to="/portal" className="hover:text-ink">Portal do profissional</Link>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-1 py-5 text-[13px] text-faint sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} GastroMatch</span>
          <span>Fotos: Unsplash</span>
        </div>
      </div>
    </footer>
  )
}
