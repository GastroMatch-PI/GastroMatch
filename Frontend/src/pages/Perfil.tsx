import { KeyRound, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Campo } from '../components/Campo'
import { useToast } from '../components/Feedback'
import { Avatar } from '../components/Photo'
import Protegida from '../components/Protegida'
import { UploadImagem } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { useSeo } from '../lib/seo'
import { useForm } from '../lib/useForm'
import { obrigatorio, padrao, tamanho } from '../lib/validar'

const nomes = { CHEF: 'Chef', NUTRICIONISTA: 'Nutricionista', RESTAURANTE: 'Restaurante' }
const cor = { PENDENTE: 'bg-gold-soft text-gold', APROVADO: 'bg-leaf-soft text-leaf', REJEITADO: 'bg-alert-soft text-alert' }

export default function Perfil() {
  useSeo({ titulo: 'Meu perfil' })
  const { usuario, meusPerfis, atualizarConta } = useAuth()
  const toast = useToast()
  const f = useForm({ username: usuario?.username ?? '' }, { username: [obrigatorio('Informe o username'), tamanho(3, 50, 'Use de 3 a 50 caracteres'), padrao(/^[\w.-]+$/, 'Use só letras, números, ponto, hífen e _')] })

  const salvar = f.enviar((v) => {
    atualizarConta({ username: v.username.trim() })
    toast.sucesso('Perfil atualizado.')
  })

  return (
    <Protegida>
      <div className="mx-auto max-w-xl space-y-5">
        <h1 className="text-3xl font-extrabold">Meu perfil</h1>
        <div className="card flex items-center gap-4 p-5">
          {usuario?.capa ? <img src={usuario.capa} alt="Sua foto" className="h-16 w-16 rounded-full object-cover" /> : <Avatar className="h-16 w-16" />}
          <div className="min-w-0"><p className="truncate font-display text-xl font-bold">{usuario?.username}</p><p className="truncate text-sm text-ink-soft">{usuario?.email}</p></div>
        </div>

        <form onSubmit={salvar} noValidate className="card space-y-4 p-5">
          <h2 className="text-lg font-bold">Editar dados</h2>
          <Campo label="Username" erro={f.erros.username}>
            <input name="username" className="input" value={f.v.username} onChange={f.onChange('username')} onBlur={f.onBlur('username')} autoComplete="username" />
          </Campo>
          <UploadImagem rotulo="Foto de perfil" valor={usuario?.capa} redondo max={256} onChange={(v) => { atualizarConta({ capa: v }); toast.sucesso(v ? 'Foto atualizada.' : 'Foto removida.') }} />
          <button className="btn-primary">Salvar</button>
        </form>

        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Perfis profissionais</h2>
          {meusPerfis.length === 0 && <p className="text-sm text-ink-soft">Nenhum perfil. <Link to="/onboarding" className="font-semibold text-terra">Criar perfil profissional</Link></p>}
          {meusPerfis.map((p) => (
            <p key={p.papel} className="flex items-center gap-2 text-sm">{nomes[p.papel]} <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cor[p.status]}`}>{p.status}</span></p>
          ))}
          <p className="text-xs text-ink-faint">E-mail: sem verificação nesta demonstração (não há envio de e-mails).</p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Link to="/senha" className="btn-ghost"><KeyRound size={16} /> Trocar senha</Link>
          <Link to="/verificacao" className="btn-ghost"><ShieldCheck size={16} /> Status da verificação</Link>
        </div>
      </div>
    </Protegida>
  )
}
