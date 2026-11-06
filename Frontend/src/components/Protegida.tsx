import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/Auth'

// Sem sessão, nunca renderiza o conteúdo privado: redireciona para /login.
export default function Protegida({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const loc = useLocation()
  if (!usuario) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <>{children}</>
}
