import { useMemo, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { Skeleton } from './Ui'

// Sem sessão, nunca renderiza o conteúdo privado: redireciona para /login e lembra o destino.
// Enquanto o refresh inicial não termina (carregando), mostra um esqueleto em vez de redirecionar.
export default function Protegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()
  const loc = useLocation()
  const state = useMemo(() => ({ from: loc.pathname + loc.search }), [loc.pathname, loc.search])

  if (carregando) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-10" role="status" aria-busy="true" aria-label="Carregando sessão">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64" />
      </div>
    )
  }
  if (!usuario) return <Navigate to="/login" replace state={state} />
  return <>{children}</>
}