import { Menu, Search, X } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo'

const links = [
  { to: '/', label: 'Receitas', active: (p: string) => p === '/' || p.startsWith('/receita') },
  { to: '/#geladeira', label: 'Na geladeira', active: () => false },
  { to: '/profissionais', label: 'Chefs e restaurantes', active: (p: string) => p.startsWith('/profissionais') },
  { to: '/profissionais#reels', label: 'Comunidade', active: () => false },
  { to: '/#listas', label: 'Minhas listas', active: () => false },
]

function SearchBox({ className = '', onDone }: { className?: string; onDone?: () => void }) {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const q = term.trim()
    navigate({ pathname: '/', search: q ? `?q=${encodeURIComponent(q)}` : '', hash: '#receitas' })
    onDone?.()
  }

  return (
    <form onSubmit={submit} role="search" className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar receitas"
        aria-label="Buscar receitas ou ingredientes"
        className="field py-2 pl-9"
      />
    </form>
  )
}

export default function Header() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="wrap flex h-16 items-center gap-8">
        <Logo />

        <nav aria-label="Principal" className="hidden items-center gap-7 lg:flex">
          {links.map((l) => {
            const active = l.active(pathname)
            return (
              <Link
                key={l.label}
                to={l.to}
                className={`relative inline-flex h-16 items-center whitespace-nowrap text-sm transition-colors ${
                  active
                    ? 'font-medium text-ink after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand'
                    : 'text-soft hover:text-ink'
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <SearchBox className="hidden w-64 xl:block" />
          <Link to="/portal" className="btn btn-outline btn-sm hidden sm:inline-flex">
            Sou profissional
          </Link>
          <button
            type="button"
            className="btn btn-outline btn-sm px-2.5 lg:hidden"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white lg:hidden">
          <div className="wrap py-4">
            <SearchBox className="mb-3" onDone={() => setOpen(false)} />
            <nav aria-label="Menu" className="flex flex-col">
              {[...links, { to: '/portal', label: 'Sou profissional', active: () => false }].map((l) => (
                <Link
                  key={l.label}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[15px] text-soft hover:bg-surface hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
