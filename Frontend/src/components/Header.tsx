import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BadgeCheck, ChefHat, Heart, Home, LogIn, LogOut, Menu, PlusCircle, Refrigerator, Search, ShieldCheck, UserPlus, UserRound, Users, Utensils, X,
} from 'lucide-react'
import { useAuth } from '../context/Auth'

const main = [
  { to: '/', label: 'Explorar receitas', icon: Home, end: true },
  { to: '/#geladeira', label: 'Na geladeira', icon: Refrigerator },
  { to: '/profissionais', label: 'Chefs & restaurantes', icon: Users },
  { to: '/favoritos', label: 'Favoritos', icon: Heart },
]

export default function Header() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const { usuario, sair } = useAuth()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', esc)
      btnRef.current?.focus()
    }
  }, [open])

  const buscar = (e: React.FormEvent) => {
    e.preventDefault()
    nav(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/')
  }

  const item = 'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-ink-soft transition duration-200 hover:bg-peach hover:text-terra'

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            ref={btnRef}
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open}
            aria-controls="menu-lateral"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink shadow-soft transition duration-200 hover:bg-peach hover:text-terra"
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-terra">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-terra text-white"><Utensils size={18} /></span>
            <span className="hidden min-[380px]:inline">GastroMatch</span>
          </Link>

          <form onSubmit={buscar} role="search" className="relative ml-auto hidden w-full max-w-xs md:block">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input !rounded-full !pl-10"
              placeholder="Buscar prato, ingrediente..."
              aria-label="Buscar receitas"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {usuario ? (
              <Link to="/conta" className="btn-ghost !px-4 !py-2">
                <UserRound size={16} />
                <span className="hidden max-w-[7rem] truncate sm:inline">{usuario.username}</span>
              </Link>
            ) : (
              <Link to="/login" className="btn-ghost !px-4 !py-2">Entrar</Link>
            )}
            <Link to="/portal" className="btn-primary hidden !px-4 !py-2 md:inline-flex">
              <ChefHat size={16} /> Sou profissional
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        id="menu-lateral"
        aria-label="Menu principal"
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col gap-6 overflow-y-auto bg-cream p-5 shadow-lift transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-display text-lg font-extrabold text-terra">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-terra text-white"><Utensils size={18} /></span>
            GastroMatch
          </span>
          <button ref={closeRef} onClick={() => setOpen(false)} aria-label="Fechar menu" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line bg-white hover:bg-peach">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { buscar(e); setOpen(false) }} role="search" className="relative md:hidden">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input className="input !rounded-full !pl-10" placeholder="Buscar receitas" aria-label="Buscar receitas" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>

        <nav className="space-y-1" aria-label="Navegação">
          {main.map((l) =>
            l.to.includes('#') ? (
              <Link key={l.label} to={l.to} className={item} onClick={() => setOpen(false)}>
                <l.icon size={18} /> {l.label}
              </Link>
            ) : (
              <NavLink key={l.label} to={l.to} end={l.end} className={({ isActive }) => `${item} ${isActive ? '!bg-peach !text-terra' : ''}`}>
                <l.icon size={18} /> {l.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="space-y-1 border-t border-line pt-4">
          <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Profissionais</p>
          <NavLink to="/portal" className={item}><ChefHat size={18} /> Portal profissional</NavLink>
          <NavLink to="/publicar" className={item}><PlusCircle size={18} /> Publicar receita</NavLink>
          <NavLink to="/onboarding" className={item}><BadgeCheck size={18} /> Criar perfil</NavLink>
          <NavLink to="/admin" className={item}><ShieldCheck size={18} /> Curadoria</NavLink>
        </div>

        <div className="mt-auto space-y-2 border-t border-line pt-4">
          {usuario ? (
            <>
              <Link to="/conta" className={item}><UserRound size={18} /> {usuario.username}</Link>
              <button className={`${item} w-full cursor-pointer`} onClick={() => { sair(); setOpen(false); nav('/') }}>
                <LogOut size={18} /> Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-primary w-full"><LogIn size={16} /> Entrar</Link>
              <Link to="/cadastro" className="btn-ghost w-full"><UserPlus size={16} /> Criar conta</Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
