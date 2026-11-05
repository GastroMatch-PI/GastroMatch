import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { Aviso, Campo } from '../components/Campo'
import { useAuth } from '../context/Auth'

export default function Login() {
  const { entrar } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [busy, setBusy] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setBusy(true)
    try {
      await entrar(email, password)
      nav('/')
    } catch (x) {
      setErro(x instanceof ApiError ? (x.status === 401 ? 'Email ou senha inválidos.' : x.message) : 'Falha de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={enviar} className="card mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">Entrar</h1>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Campo label="Email">
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Campo>
      <Campo label="Senha">
        <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Campo>
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
      <p className="text-xs text-ink-soft">
        Sem conta? <Link to="/cadastro" className="font-semibold text-terra">Criar conta</Link>
      </p>
    </form>
  )
}
