import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-peach">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm md:flex-row md:justify-between">
        <div>
          <p className="font-display text-lg font-extrabold text-terra">🍴 GastroMatch</p>
          <p className="mt-1 max-w-sm text-ink-soft">
            © 2024 GastroMatch. Alta gastronomia, culinária consciente e validação profissional.
          </p>
        </div>
        <nav className="flex flex-wrap items-start gap-x-5 gap-y-2 text-xs font-medium text-ink-soft">
          <span>Termos de Uso</span>
          <span>Privacidade</span>
          <Link to="/portal" className="text-terra">Portal Profissional</Link>
          <span>Diretrizes Nutricionais</span>
          <span>Imprensa</span>
          <span>Suporte</span>
        </nav>
      </div>
    </footer>
  )
}
