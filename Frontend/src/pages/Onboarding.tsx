import { ChefHat, Salad, Store, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Opcoes } from '../components/Campo'
import { useToast } from '../components/Feedback'
import Protegida from '../components/Protegida'
import { UploadImagem } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import { mascaraCEP, mascaraCNPJ, mascaraCRN, mascaraTelefone, soDigitos } from '../lib/mascaras'
import { useSeo } from '../lib/seo'
import type { Papel, PerfilPro } from '../lib/tipos'
import { useForm } from '../lib/useForm'
import { obrigatorio, padrao, tamanho, type Esquema } from '../lib/validar'

const roles: { id: Papel; label: string; icon: typeof ChefHat }[] = [
  { id: 'CHEF', label: 'Chef', icon: ChefHat },
  { id: 'NUTRICIONISTA', label: 'Nutricionista', icon: Salad },
  { id: 'RESTAURANTE', label: 'Restaurante', icon: Store },
]

const esquemas: Record<Papel, Esquema> = {
  CHEF: { bio: [tamanho(0, 500)] },
  NUTRICIONISTA: { crn: [obrigatorio('Informe o CRN'), padrao(/^CRN-\d{1,2}\/\d{3,6}$/, 'Use o formato CRN-3/12345')], bio: [tamanho(0, 500)] },
  RESTAURANTE: {
    nome: [obrigatorio('Informe o nome do restaurante'), tamanho(1, 150)],
    chef: [obrigatorio('Escolha ao menos um chef vinculado')],
    cnpj: [obrigatorio('Informe o CNPJ'), padrao(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ incompleto')],
    cep: [padrao(/^\d{5}-\d{3}$/, 'CEP inválido (00000-000)')],
    numero: [padrao(/^[1-9]\d*$/, 'O número deve ser maior que zero')],
    bio: [tamanho(0, 500)],
  },
}

export default function Onboarding() {
  useSeo({ titulo: 'Criar perfil profissional' })
  const { usuario, perfis, meusPerfis, setPerfis } = useAuth()
  const toast = useToast()
  const [papel, setPapel] = useState<Papel>('CHEF')
  const [capa, setCapa] = useState<string | undefined>()
  const [comprovante, setComprovante] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const f = useForm(
    { bio: '', especializacao: '', crn: '', nome: '', chef: '', cnpj: '', cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', restaurante: '', telefone: '' },
    esquemas[papel],
  )

  const chefs = perfis.filter((p) => p.papel === 'CHEF' && p.status === 'APROVADO')
  const restaurantes = perfis.filter((p) => p.papel === 'RESTAURANTE' && p.status === 'APROVADO')

  const enviar = f.enviar((v) => {
    setErro(''); setOk('')
    if (!usuario) return
    if (meusPerfis.some((p) => p.papel === papel)) return setErro('Você já tem esse perfil.')
    if (papel === 'NUTRICIONISTA' && !comprovante) return setErro('Envie o comprovante da profissão (PDF ou imagem).')
    const base: PerfilPro = {
      userId: usuario.id, papel, nome: usuario.username, bio: v.bio,
      status: papel === 'NUTRICIONISTA' ? 'PENDENTE' : 'APROVADO', // só nutricionista passa por verificação manual
      enviadoEm: Date.now(),
    }
    if (papel === 'CHEF') Object.assign(base, { especializacao: v.especializacao, restauranteDoChef: v.restaurante || undefined })
    if (papel === 'NUTRICIONISTA') Object.assign(base, { crn: v.crn, comprovante })
    if (papel === 'RESTAURANTE')
      Object.assign(base, {
        nome: v.nome, cnpj: soDigitos(v.cnpj), cep: soDigitos(v.cep), rua: v.rua, numero: v.numero, bairro: v.bairro, cidadeNome: v.cidade, estado: v.estado,
        chefIds: [v.chef], capa, whatsapp: v.telefone ? soDigitos(v.telefone) : undefined,
      })
    setPerfis((l) => [...l, base])
    const msg = papel === 'NUTRICIONISTA' ? 'Perfil enviado. Status: pendente de verificação manual.' : 'Perfil criado.'
    setOk(msg)
    toast.sucesso(msg)
  })

  const trocar = (id: Papel) => { setPapel(id); setErro(''); setOk(''); f.setErros({}) }

  return (
    <Protegida>
      <form onSubmit={enviar} noValidate className="card mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Criar perfil profissional</h1>
        <div role="tablist" aria-label="Tipo de perfil" className="flex gap-1 rounded-full border border-line bg-cream p-1 text-xs font-semibold">
          {roles.map((r) => (
            <button type="button" role="tab" aria-selected={papel === r.id} key={r.id} onClick={() => trocar(r.id)}
              className={`flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-[11px] sm:gap-2 sm:px-3 sm:text-xs transition duration-200 ${papel === r.id ? 'bg-terra text-on-accent shadow-soft' : 'text-ink-soft hover:text-terra'}`}>
              <r.icon size={16} className="hidden min-[400px]:block" /> {r.label}
            </button>
          ))}
        </div>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {ok && <Aviso tipo="ok">{ok} <Link to="/verificacao" className="underline">Ver status</Link></Aviso>}

        {papel === 'RESTAURANTE' && (
          <>
            <Campo label="Nome do restaurante" erro={f.erros.nome}><input name="nome" className="input" maxLength={150} value={f.v.nome} onChange={f.onChange('nome')} onBlur={f.onBlur('nome')} /></Campo>
            <Campo label="Chef vinculado (obrigatório)" erro={f.erros.chef} dica={chefs.length === 0 ? 'Nenhum chef cadastrado ainda: crie primeiro um perfil de Chef.' : undefined}>
              <select name="chef" className="input" value={f.v.chef} onChange={f.onChange('chef')} onBlur={f.onBlur('chef')}>
                <option value="">Selecione</option>
                {chefs.map((c) => <option key={c.userId} value={c.userId}>{c.nome}</option>)}
              </select>
            </Campo>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="CNPJ" erro={f.erros.cnpj}><input name="cnpj" className="input" inputMode="numeric" autoComplete="off" value={f.v.cnpj} onChange={(e) => f.set('cnpj')(mascaraCNPJ(e.target.value))} onBlur={f.onBlur('cnpj')} placeholder="00.000.000/0000-00" /></Campo>
              <Campo label="CEP" erro={f.erros.cep}><input name="cep" className="input" inputMode="numeric" autoComplete="postal-code" value={f.v.cep} onChange={(e) => f.set('cep')(mascaraCEP(e.target.value))} onBlur={f.onBlur('cep')} placeholder="00000-000" /></Campo>
              <Campo label="Rua"><input name="rua" className="input" maxLength={150} value={f.v.rua} onChange={f.onChange('rua')} /></Campo>
              <Campo label="Número" erro={f.erros.numero}><input name="numero" className="input" inputMode="numeric" value={f.v.numero} onChange={(e) => f.set('numero')(soDigitos(e.target.value))} onBlur={f.onBlur('numero')} /></Campo>
              <Campo label="Bairro"><input name="bairro" className="input" maxLength={100} value={f.v.bairro} onChange={f.onChange('bairro')} /></Campo>
              <Campo label="Cidade"><input name="cidade" className="input" maxLength={100} value={f.v.cidade} onChange={f.onChange('cidade')} /></Campo>
              <Campo label="Estado"><input name="estado" className="input" maxLength={50} value={f.v.estado} onChange={f.onChange('estado')} /></Campo>
              <Campo label="Telefone / WhatsApp"><input name="telefone" className="input" inputMode="tel" autoComplete="tel" value={f.v.telefone} onChange={(e) => f.set('telefone')(mascaraTelefone(e.target.value))} placeholder="(11) 98765-4321" /></Campo>
            </div>
            <UploadImagem rotulo="Imagem de capa (opcional)" valor={capa} onChange={setCapa} max={1000} />
          </>
        )}
        {papel === 'NUTRICIONISTA' && (
          <>
            <Campo label="CRN" erro={f.erros.crn} dica="Formato CRN-3/12345">
              <input name="crn" className="input" inputMode="numeric" autoComplete="off" value={f.v.crn} onChange={(e) => f.set('crn')(mascaraCRN(e.target.value))} onBlur={f.onBlur('crn')} placeholder="CRN-3/12345" />
            </Campo>
            <div className="space-y-1 text-xs font-semibold text-ink-soft">
              Comprovante da profissão (PDF ou imagem)
              <input ref={fileRef} type="file" accept=".pdf,image/*" hidden onChange={(e) => { const a = e.target.files?.[0]; if (a) setComprovante(`${a.name} • ${(a.size / 1048576).toFixed(1)} MB`) }} />
              <button type="button" className="btn-ghost w-full" onClick={() => fileRef.current?.click()}><UploadCloud size={16} /> {comprovante || 'Selecionar arquivo'}</button>
              <span className="block font-normal text-ink-faint">Nesta demonstração, só o nome do arquivo é guardado.</span>
            </div>
          </>
        )}
        {papel === 'CHEF' && (
          <>
            <Campo label="Especialização">
              <select name="especializacao" className="input" value={f.v.especializacao} onChange={f.onChange('especializacao')}><option value="">Selecione</option><Opcoes mapa={ENUMS.especializacao} /></select>
            </Campo>
            <Campo label="Restaurante onde atua (opcional)">
              <select name="restaurante" className="input" value={f.v.restaurante} onChange={f.onChange('restaurante')}>
                <option value="">Nenhum</option>
                {restaurantes.map((r) => <option key={r.userId} value={r.userId}>{r.nome}</option>)}
              </select>
            </Campo>
          </>
        )}
        <Campo label="Bio (até 500)" erro={f.erros.bio} dica={`${f.v.bio.length} / 500`}>
          <textarea name="bio" className="input" rows={4} maxLength={500} value={f.v.bio} onChange={f.onChange('bio')} />
        </Campo>
        <button className="btn-primary w-full">Criar perfil</button>
      </form>
    </Protegida>
  )
}
