import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/Auth'

export default function Protegida({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  if (usuario) return <>{children}</>
  return (
    <div className="card mx-auto max-w-md space-y-3 p-6 text-center">
      <h1 className="text-xl font-bold">Faça login para continuar</h1>
      <Link to="/login" className="btn-primary">Entrar</Link>
    </div>
  )
}
