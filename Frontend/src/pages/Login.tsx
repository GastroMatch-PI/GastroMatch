import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Aviso, Campo, CampoSenha } from '../components/Campo'
import { ApiError, mensagem } from '../lib/api'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'
import { useForm } from '../lib/useForm'
import { email, obrigatorio } from '../lib/validar'

export default function Login() {
  useSeo({ titulo: 'Entrar' })
  const { entrar } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [erro, setErro] = useState('')
  const f = useForm({ email: '', password: '' }, { email: [obrigatorio('Informe o e-mail'), email()], password: [obrigatorio('Informe a senha')] })
  const destino = (loc.state as { from?: string } | null)?.from ?? '/'

  const enviar = f.enviar(async (v) => {
    setErro('')
    try {
      await entrar(v.email, v.password)
      nav(destino, { replace: true }) // volta para a tela original
    } catch (e) {
      // 401: mensagem genérica de propósito (não diz se foi o e-mail ou a senha)
      setErro(e instanceof ApiError && e.status === 401 ? 'Credenciais inválidas' : mensagem(e))
    }
  })

  return (
    <form onSubmit={enviar} noValidate className="card mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">Entrar</h1>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Campo label="E-mail" erro={f.erros.email}>
        <input name="email" className="input" type="email" autoComplete="username" value={f.v.email} onChange={f.onChange('email')} onBlur={f.onBlur('email')} />
      </Campo>
      <CampoSenha nome="password" label="Senha" value={f.v.password} onChange={f.set('password')} erro={f.erros.password} autoComplete="current-password" />
      <button className="btn-primary w-full">Entrar</button>
      <p className="text-xs text-ink-soft">
        Sem conta? <Link to="/cadastro" state={loc.state} className="font-semibold text-terra">Criar conta</Link>
      </p>
    </form>
  )
}
