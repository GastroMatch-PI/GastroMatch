import { NavLink, Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Explorar Receitas' },
  { to: '/#geladeira', label: 'Na Geladeira' },
  { to: '/profissionais', label: 'Chefs & Restaurantes' },
  { to: '/#comunidade', label: 'Comunidade' },
  { to: '/#listas', label: 'Minhas Listas' },
]

export default function Header() {
  const { pathname } = useLocation()
  const pro = pathname.startsWith('/portal')
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-1.5 font-display text-xl font-extrabold text-terra">
          <span aria-hidden>🍴</span> GastroMatch
        </Link>
        {pro && (
          <span className="hidden rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-gold sm:inline">
            Modo Profissional
          </span>
        )}
        <input className="input hidden max-w-[220px] md:block" placeholder="Buscar prato, ingrediente..." />
        <nav className="ml-auto hidden items-center gap-5 text-sm font-medium text-ink-soft lg:flex">
          {links.map((l) =>
            l.to.includes('#') ? (
              <Link key={l.label} to={l.to} className="hover:text-terra">
                {l.label}
              </Link>
            ) : (
              <NavLink
                key={l.label}
                to={l.to}
                end
                className={({ isActive }) => (isActive ? 'border-b-2 border-terra text-terra' : 'hover:text-terra')}
              >
                {l.label}
              </NavLink>
            ),
          )}
        </nav>
        <Link to="/portal" className="btn-primary ml-auto lg:ml-0">
          🛡 Sou Profissional
        </Link>
      </div>
    </header>
  )
}
