import { useMemo, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { Carregando } from './Ui'

// Sem sessão, nunca renderiza o conteúdo privado: redireciona para /login e lembra o destino.
export default function Protegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()
  const loc = useLocation()
  const state = useMemo(() => ({ from: loc.pathname + loc.search }), [loc.pathname, loc.search])
  if (carregando) return <Carregando texto="Restaurando sua sessão" />
  if (!usuario) return <Navigate to="/login" replace state={state} />
  return <>{children}</>
}
