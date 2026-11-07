import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Aviso, Campo, CampoSenha } from '../components/Campo'
import { errosDeCampo, mensagem } from '../lib/api'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'
import { useForm } from '../lib/useForm'
import { email, igualA, obrigatorio, padrao, tamanho } from '../lib/validar'

export default function Cadastro() {
  useSeo({ titulo: 'Criar conta' })
  const { cadastrar } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [erro, setErro] = useState('')
  const f = useForm(
    { email: '', username: '', password: '', conf: '' },
    {
      email: [obrigatorio('Informe o e-mail'), email(), tamanho(1, 255)],
      username: [obrigatorio('Informe o username'), tamanho(3, 50, 'Use de 3 a 50 caracteres'), padrao(/^[\w.-]+$/, 'Use só letras, números, ponto, hífen e _')],
      password: [obrigatorio('Informe a senha'), tamanho(8, 72, 'A senha deve ter de 8 a 72 caracteres')],
      conf: [obrigatorio('Confirme a senha'), igualA('password', 'As senhas não conferem')],
    },
  )

  const enviar = f.enviar(async (v) => {
    setErro('')
    try {
      await cadastrar(v.email, v.username, v.password)
      nav((loc.state as { from?: string } | null)?.from ?? '/', { replace: true })
    } catch (x) {
      f.setErros(errosDeCampo(x)) // erros de campo da API (400)
      setErro(mensagem(x)) // 409: e-mail ou username repetido
    }
  })

  return (
    <form onSubmit={enviar} noValidate className="card mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Campo label="E-mail" erro={f.erros.email}>
        <input name="email" className="input" type="email" maxLength={255} autoComplete="email" value={f.v.email} onChange={f.onChange('email')} onBlur={f.onBlur('email')} />
      </Campo>
      <Campo label="Username (3 a 50)" erro={f.erros.username}>
        <input name="username" className="input" maxLength={50} autoComplete="username" value={f.v.username} onChange={f.onChange('username')} onBlur={f.onBlur('username')} />
      </Campo>
      <CampoSenha nome="password" label="Senha (8 a 72)" value={f.v.password} onChange={f.set('password')} erro={f.erros.password} mostrarForca onBlur={f.onBlur('password')} />
      <CampoSenha nome="conf" label="Confirmar senha" value={f.v.conf} onChange={f.set('conf')} erro={f.erros.conf} onBlur={f.onBlur('conf')} />
      <button className="btn-primary w-full">Criar conta</button>
      <p className="text-xs text-ink-soft">
        Já tem conta? <Link to="/login" className="font-semibold text-terra">Entrar</Link>
      </p>
    </form>
  )
}
