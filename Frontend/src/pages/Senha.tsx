import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, CampoSenha } from '../components/Campo'
import { useToast } from '../components/Feedback'
import Protegida from '../components/Protegida'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'
import { useForm } from '../lib/useForm'
import { igualA, obrigatorio, tamanho } from '../lib/validar'

export default function Senha() {
  useSeo({ titulo: 'Trocar senha' })
  const { trocarSenha } = useAuth()
  const toast = useToast()
  const [erro, setErro] = useState('')
  const f = useForm(
    { atual: '', nova: '', conf: '' },
    { atual: [obrigatorio('Informe a senha atual')], nova: [obrigatorio('Informe a nova senha'), tamanho(8, 72, 'A senha deve ter de 8 a 72 caracteres')], conf: [obrigatorio('Confirme a nova senha'), igualA('nova', 'As senhas não conferem')] },
  )

  const enviar = f.enviar(async (v) => {
    setErro('')
    try {
      await trocarSenha(v.atual, v.nova)
      f.setV({ atual: '', nova: '', conf: '' })
      toast.sucesso('Senha alterada. Você continua conectado neste navegador.')
    } catch (e) {
      setErro((e as Error).message) // mensagem genérica: não revela detalhes
    }
  })

  return (
    <Protegida>
      <form onSubmit={enviar} noValidate className="card mx-auto max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold">Trocar senha</h1>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <CampoSenha nome="atual" label="Senha atual" value={f.v.atual} onChange={f.set('atual')} erro={f.erros.atual} autoComplete="current-password" />
        <CampoSenha nome="nova" label="Nova senha" value={f.v.nova} onChange={f.set('nova')} erro={f.erros.nova} mostrarForca onBlur={f.onBlur('nova')} />
        <CampoSenha nome="conf" label="Confirmar nova senha" value={f.v.conf} onChange={f.set('conf')} erro={f.erros.conf} onBlur={f.onBlur('conf')} />
        <button className="btn-primary w-full">Salvar nova senha</button>
        <p className="text-xs text-ink-faint">Neste navegador há uma única sessão, então nenhuma outra é encerrada. <Link className="underline" to="/perfil">Voltar ao perfil</Link></p>
      </form>
    </Protegida>
  )
}
