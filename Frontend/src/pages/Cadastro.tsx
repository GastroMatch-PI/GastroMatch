import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { Aviso, Campo } from '../components/Campo'
import { useAuth } from '../context/Auth'

export default function Cadastro() {
  const { cadastrar } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', username: '', password: '' })
  const [erro, setErro] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setErros({})
    setBusy(true)
    try {
      await cadastrar(f.email, f.username, f.password)
      nav('/')
    } catch (x) {
      if (x instanceof ApiError) {
        setErros(x.erros ?? {})
        setErro(x.status === 409 ? 'Email ou username já cadastrado.' : x.message)
      } else setErro('Falha de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={enviar} className="card mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Campo label="Email" erro={erros.email}>
        <input className="input" type="email" required value={f.email} onChange={set('email')} />
      </Campo>
      <Campo label="Username (3 a 50)" erro={erros.username}>
        <input className="input" required minLength={3} maxLength={50} value={f.username} onChange={set('username')} />
      </Campo>
      <Campo label="Senha (8 a 72)" erro={erros.password}>
        <input className="input" type="password" required minLength={8} maxLength={72} value={f.password} onChange={set('password')} />
      </Campo>
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Criando...' : 'Criar conta'}</button>
      <p className="text-xs text-ink-soft">
        Já tem conta? <Link to="/login" className="font-semibold text-terra">Entrar</Link>
      </p>
    </form>
  )
}
