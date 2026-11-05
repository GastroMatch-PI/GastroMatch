import { useState } from 'react'
import { ApiError, ENUMS, post } from '../api/client'
import { Aviso, Campo, Opcoes } from '../components/Campo'
import Protegida from '../components/Protegida'

type Role = 'chefs' | 'nutricionistas' | 'restaurantes'
const roles: { id: Role; label: string }[] = [
  { id: 'chefs', label: '👨‍🍳 Chef' },
  { id: 'nutricionistas', label: '🥗 Nutricionista' },
  { id: 'restaurantes', label: '🍽 Restaurante' },
]

export default function Onboarding() {
  const [role, setRole] = useState<Role>('chefs')
  const [f, setF] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value })

  const corpo = () => {
    if (role === 'chefs') return { bio: f.bio, especializacao: f.especializacao || null }
    if (role === 'nutricionistas') return { bio: f.bio, crn: f.crn }
    return {
      nome: f.nome, bio: f.bio, cnpj: f.cnpj,
      numero: f.numero ? Number(f.numero) : null, rua: f.rua, cep: f.cep,
      bairro: f.bairro, cidade: f.cidade, estado: f.estado,
    }
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setErros({}); setOk(''); setBusy(true)
    try {
      await post(`/${role}`, corpo())
      setOk(role === 'nutricionistas'
        ? 'Perfil criado. Aguarde a verificação manual do CRN.'
        : 'Perfil criado com sucesso.')
    } catch (x) {
      if (x instanceof ApiError) { setErros(x.erros ?? {}); setErro(x.message) } else setErro('Falha de conexão.')
    } finally { setBusy(false) }
  }

  return (
    <Protegida>
      <form onSubmit={enviar} className="card mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Criar perfil profissional</h1>
        <div role="tablist" className="flex gap-1 rounded-xl border border-line bg-cream p-1 text-xs font-semibold">
          {roles.map((r) => (
            <button type="button" key={r.id} onClick={() => { setRole(r.id); setErro(''); setOk('') }}
              className={`flex-1 rounded-lg px-3 py-2 ${role === r.id ? 'bg-white text-terra shadow-sm' : 'text-ink-soft'}`}>
              {r.label}
            </button>
          ))}
        </div>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {ok && <Aviso tipo="ok">{ok}</Aviso>}

        {role === 'restaurantes' && (
          <>
            <Campo label="Nome do restaurante" erro={erros.nome}>
              <input className="input" required maxLength={150} onChange={set('nome')} />
            </Campo>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="CNPJ" erro={erros.cnpj}><input className="input" required maxLength={18} onChange={set('cnpj')} /></Campo>
              <Campo label="CEP" erro={erros.cep}><input className="input" placeholder="00000-000" onChange={set('cep')} /></Campo>
              <Campo label="Rua"><input className="input" onChange={set('rua')} /></Campo>
              <Campo label="Número" erro={erros.numero}><input className="input" type="number" min={1} onChange={set('numero')} /></Campo>
              <Campo label="Bairro"><input className="input" onChange={set('bairro')} /></Campo>
              <Campo label="Cidade"><input className="input" onChange={set('cidade')} /></Campo>
              <Campo label="Estado"><input className="input" onChange={set('estado')} /></Campo>
            </div>
          </>
        )}
        {role === 'nutricionistas' && (
          <Campo label="CRN" erro={erros.crn}>
            <input className="input" required maxLength={20} onChange={set('crn')} />
          </Campo>
        )}
        {role === 'chefs' && (
          <Campo label="Especialização">
            <select className="input" defaultValue="" onChange={set('especializacao')}>
              <option value="">Selecione</option>
              <Opcoes mapa={ENUMS.especializacao} />
            </select>
          </Campo>
        )}
        <Campo label="Bio (até 500)" erro={erros.bio}>
          <textarea className="input" rows={4} maxLength={500} onChange={set('bio')} />
        </Campo>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Enviando...' : 'Criar perfil'}</button>
      </form>
    </Protegida>
  )
}
