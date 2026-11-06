import { useMemo, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/Auth'

// Sem sessão, nunca renderiza o conteúdo privado: redireciona para /login e lembra o destino.
export default function Protegida({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const loc = useLocation()
  const state = useMemo(() => ({ from: loc.pathname + loc.search }), [loc.pathname, loc.search])
  if (!usuario) return <Navigate to="/login" replace state={state} />
  return <>{children}</>
}
