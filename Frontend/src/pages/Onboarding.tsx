import { ChefHat, Salad, Store } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Aviso, Campo, Opcoes } from '../components/Campo'
import { useToast } from '../components/Feedback'
import Protegida from '../components/Protegida'
import { Carregando } from '../components/Ui'
import type { Pagina, RestauranteResumo } from '../lib/apiTipos'
import { useApi } from '../lib/useApi'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import { errosDeCampo, mensagem, post } from '../lib/api'
import { mascaraCEP, mascaraCNPJ, mascaraCRN } from '../lib/mascaras'
import { useSeo } from '../lib/seo'
import { useForm } from '../lib/useForm'
import { obrigatorio, padrao, tamanho, type Esquema } from '../lib/validar'

type Papel = 'CHEF' | 'NUTRICIONISTA' | 'RESTAURANTE'
const roles: { id: Papel; label: string; icon: typeof ChefHat }[] = [
  { id: 'CHEF', label: 'Chef', icon: ChefHat },
  { id: 'NUTRICIONISTA', label: 'Nutricionista', icon: Salad },
  { id: 'RESTAURANTE', label: 'Restaurante', icon: Store },
]
const rota: Record<Papel, string> = { CHEF: '/chefs', NUTRICIONISTA: '/nutricionistas', RESTAURANTE: '/restaurantes' }

const esquemas: Record<Papel, Esquema> = {
  CHEF: { bio: [tamanho(0, 500)] },
  NUTRICIONISTA: { crn: [obrigatorio('Informe o CRN'), tamanho(1, 20)], bio: [tamanho(0, 500)] },
  RESTAURANTE: {
    nome: [obrigatorio('Informe o nome do restaurante'), tamanho(1, 150)],
    cnpj: [obrigatorio('Informe o CNPJ'), padrao(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ incompleto')],
    cep: [padrao(/^\d{5}-\d{3}$/, 'CEP inválido (00000-000)')],
    numero: [padrao(/^[1-9]\d*$/, 'O número deve ser maior que zero')],
    bio: [tamanho(0, 500)],
  },
}

export default function Onboarding() {
  useSeo({ titulo: 'Criar perfil profissional' })
  const { perfil, carregandoPerfil, recarregarPerfil } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [papel, setPapel] = useState<Papel>('CHEF')
  const [erro, setErro] = useState('')
  const restaurantes = useApi<Pagina<RestauranteResumo>>('/restaurantes?tamanho=50')
  const f = useForm(
    { bio: '', especializacao: '', restaurante: '', crn: '', nome: '', cnpj: '', cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '' },
    esquemas[papel],
  )

  const enviar = f.enviar(async (v) => {
    setErro('')
    const corpo =
      papel === 'CHEF' ? { bio: v.bio, especializacao: v.especializacao || undefined, idRestaurante: v.restaurante ? Number(v.restaurante) : undefined }
      : papel === 'NUTRICIONISTA' ? { bio: v.bio, crn: v.crn }
      : { nome: v.nome.trim(), bio: v.bio, cnpj: v.cnpj, numero: v.numero ? Number(v.numero) : undefined, rua: v.rua, cep: v.cep || undefined, bairro: v.bairro, cidade: v.cidade, estado: v.estado }
    try {
      await post(rota[papel], corpo)
      await recarregarPerfil()
      toast.sucesso('Perfil criado.')
      nav('/portal')
    } catch (e) {
      f.setErros(errosDeCampo(e))
      setErro(mensagem(e))
    }
  })

  return (
    <Protegida>
      {carregandoPerfil ? (
        <Carregando texto="Verificando seu perfil" />
      ) : perfil ? (
        <div className="card mx-auto max-w-md space-y-3 p-6 text-center">
          <h1 className="text-xl font-bold">Sua conta já tem um perfil profissional</h1>
          <p className="text-sm text-ink-soft">Cada conta pode ter só um perfil: chef, nutricionista ou restaurante.</p>
          <Link to="/portal" className="btn-primary">Ver meu perfil</Link>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="card mx-auto max-w-xl space-y-4 p-6">
          <h1 className="text-2xl font-bold">Criar perfil profissional</h1>
          <Aviso tipo="info">Cada conta tem no máximo um perfil. O perfil já nasce ativo, sem aprovação.</Aviso>
          <div role="tablist" aria-label="Tipo de perfil" className="flex gap-1 rounded-full border border-line bg-cream p-1 text-xs font-semibold">
            {roles.map((r) => (
              <button type="button" role="tab" aria-selected={papel === r.id} key={r.id} onClick={() => { setPapel(r.id); setErro(''); f.setErros({}) }}
                className={`flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-[11px] transition duration-200 sm:gap-2 sm:px-3 sm:text-xs ${papel === r.id ? 'bg-terra text-on-accent shadow-soft' : 'text-ink-soft hover:text-terra'}`}>
                <r.icon size={16} className="hidden min-[400px]:block" /> {r.label}
              </button>
            ))}
          </div>
          {erro && <Aviso tipo="erro">{erro}</Aviso>}

          {papel === 'RESTAURANTE' && (
            <>
              <Campo label="Nome do restaurante" erro={f.erros.nome}><input name="nome" className="input" maxLength={150} value={f.v.nome} onChange={f.onChange('nome')} onBlur={f.onBlur('nome')} /></Campo>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="CNPJ" erro={f.erros.cnpj}><input name="cnpj" className="input" inputMode="numeric" autoComplete="off" value={f.v.cnpj} onChange={(e) => f.set('cnpj')(mascaraCNPJ(e.target.value))} onBlur={f.onBlur('cnpj')} placeholder="00.000.000/0000-00" /></Campo>
                <Campo label="CEP" erro={f.erros.cep}><input name="cep" className="input" inputMode="numeric" autoComplete="postal-code" value={f.v.cep} onChange={(e) => f.set('cep')(mascaraCEP(e.target.value))} onBlur={f.onBlur('cep')} placeholder="00000-000" /></Campo>
                <Campo label="Rua" erro={f.erros.rua}><input name="rua" className="input" maxLength={150} value={f.v.rua} onChange={f.onChange('rua')} /></Campo>
                <Campo label="Número" erro={f.erros.numero}><input name="numero" className="input" inputMode="numeric" value={f.v.numero} onChange={(e) => f.set('numero')(e.target.value.replace(/\D/g, ''))} onBlur={f.onBlur('numero')} /></Campo>
                <Campo label="Bairro" erro={f.erros.bairro}><input name="bairro" className="input" maxLength={100} value={f.v.bairro} onChange={f.onChange('bairro')} /></Campo>
                <Campo label="Cidade" erro={f.erros.cidade}><input name="cidade" className="input" maxLength={100} value={f.v.cidade} onChange={f.onChange('cidade')} /></Campo>
                <Campo label="Estado" erro={f.erros.estado}><input name="estado" className="input" maxLength={50} value={f.v.estado} onChange={f.onChange('estado')} /></Campo>
              </div>
            </>
          )}
          {papel === 'NUTRICIONISTA' && (
            <Campo label="CRN" erro={f.erros.crn} dica="Formato CRN-3/12345">
              <input name="crn" className="input" inputMode="numeric" autoComplete="off" maxLength={20} value={f.v.crn} onChange={(e) => f.set('crn')(mascaraCRN(e.target.value))} onBlur={f.onBlur('crn')} placeholder="CRN-3/12345" />
            </Campo>
          )}
          {papel === 'CHEF' && (
            <>
              <Campo label="Especialização" erro={f.erros.especializacao}>
                <select name="especializacao" className="input" value={f.v.especializacao} onChange={f.onChange('especializacao')}><option value="">Selecione</option><Opcoes mapa={ENUMS.especializacao} /></select>
              </Campo>
              <Campo label="Restaurante onde trabalha (opcional)" erro={f.erros.idRestaurante}>
                <select name="restaurante" className="input" value={f.v.restaurante} onChange={f.onChange('restaurante')}>
                  <option value="">Nenhum</option>
                  {(restaurantes.dados?.conteudo ?? []).map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </Campo>
            </>
          )}
          <Campo label="Bio (até 500)" erro={f.erros.bio} dica={`${f.v.bio.length} / 500`}>
            <textarea name="bio" className="input" rows={4} maxLength={500} value={f.v.bio} onChange={f.onChange('bio')} />
          </Campo>
          <button className="btn-primary w-full">Criar perfil</button>
        </form>
      )}
    </Protegida>
  )
}
