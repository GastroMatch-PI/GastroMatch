import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Aviso, Campo } from '../components/Campo'
import { useAuth } from '../context/Auth'

export default function Cadastro() {
  const { cadastrar } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', username: '', password: '' })
  const [erro, setErro] = useState('')
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    try {
      await cadastrar(f.email, f.username, f.password)
      nav('/')
    } catch (x) {
      setErro((x as Error).message)
    }
  }

  return (
    <form onSubmit={enviar} className="card mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <Aviso tipo="info">Demonstração: a conta fica salva só neste navegador.</Aviso>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Campo label="Email">
        <input className="input" type="email" required maxLength={255} value={f.email} onChange={set('email')} />
      </Campo>
      <Campo label="Username (3 a 50)">
        <input className="input" required minLength={3} maxLength={50} value={f.username} onChange={set('username')} />
      </Campo>
      <Campo label="Senha (8 a 72)">
        <input className="input" type="password" required minLength={8} maxLength={72} value={f.password} onChange={set('password')} />
      </Campo>
      <button className="btn-primary w-full">Criar conta</button>
      <p className="text-xs text-ink-soft">
        Já tem conta? <Link to="/login" className="font-semibold text-terra">Entrar</Link>
      </p>
    </form>
  )
}
