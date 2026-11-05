import { useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'

const links = [
  { to: '/', label: 'Explorar Receitas' },
  { to: '/#geladeira', label: 'Na Geladeira' },
  { to: '/profissionais', label: 'Chefs & Restaurantes' },
  { to: '/#comunidade', label: 'Comunidade' },
  { to: '/favoritos', label: 'Favoritos' },
]

export default function Header() {
  const { pathname } = useLocation()
  const { usuario } = useAuth()
  const nav = useNavigate()
  const [q, setQ] = useState('')
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
        <form className="hidden md:block" onSubmit={(e) => { e.preventDefault(); nav(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/') }}>
          <input className="input max-w-[220px]" placeholder="Buscar prato, ingrediente..." value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
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
        {usuario ? (
          <Link to="/conta" className="btn-ghost">👤 {usuario.username}</Link>
        ) : (
          <Link to="/login" className="btn-ghost">Entrar</Link>
        )}
        <Link to="/portal" className="btn-primary ml-auto lg:ml-0">
          🛡 Sou Profissional
        </Link>
      </div>
    </header>
  )
}
