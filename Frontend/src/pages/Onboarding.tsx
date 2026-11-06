import { ChefHat, Salad, Store, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Opcoes } from '../components/Campo'
import Protegida from '../components/Protegida'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import type { Papel, PerfilPro } from '../lib/tipos'

const roles: { id: Papel; label: string; icon: typeof ChefHat }[] = [
  { id: 'CHEF', label: 'Chef', icon: ChefHat },
  { id: 'NUTRICIONISTA', label: 'Nutricionista', icon: Salad },
  { id: 'RESTAURANTE', label: 'Restaurante', icon: Store },
]

export default function Onboarding() {
  const { usuario, meusPerfis, setPerfis } = useAuth()
  const [papel, setPapel] = useState<Papel>('CHEF')
  const [f, setF] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value })

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setOk('')
    if (!usuario) return
    if (meusPerfis.some((p) => p.papel === papel)) return setErro('Você já tem esse perfil.')
    if (papel === 'RESTAURANTE' && !f.chef?.trim()) return setErro('Informe o chef responsável: restaurante exige chef vinculado.')
    const p: PerfilPro = {
      userId: usuario.id,
      papel,
      nome: papel === 'RESTAURANTE' ? f.nome : usuario.username,
      bio: f.bio ?? '',
      // chef e restaurante publicam direto; nutricionista aguarda verificação manual do CRN
      status: papel === 'NUTRICIONISTA' ? 'PENDENTE' : 'APROVADO',
      especializacao: f.especializacao,
      crn: f.crn,
      cnpj: f.cnpj,
      endereco: [f.rua, f.numero].filter(Boolean).join(', '),
      cidade: [f.bairro, f.cidade, f.estado].filter(Boolean).join(' - '),
      chefVinculado: f.chef,
      comprovante: f.comprovante,
    }
    setPerfis((l) => [...l, p])
    setOk(papel === 'NUTRICIONISTA' ? 'Perfil enviado. Status: pendente de verificação manual do CRN.' : 'Perfil criado.')
  }

  return (
    <Protegida>
      <form onSubmit={enviar} className="card mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Criar perfil profissional</h1>
        <div role="tablist" className="flex gap-1 rounded-full border border-line bg-cream p-1 text-xs font-semibold">
          {roles.map((r) => (
            <button type="button" key={r.id} onClick={() => { setPapel(r.id); setErro(''); setOk('') }}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 transition duration-200 ${papel === r.id ? 'bg-terra text-on-accent shadow-soft' : 'text-ink-soft hover:text-terra'}`}>
              <r.icon size={16} /> {r.label}
            </button>
          ))}
        </div>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {ok && <Aviso tipo="ok">{ok} <Link to="/conta" className="underline">Minha conta</Link></Aviso>}

        {papel === 'RESTAURANTE' && (
          <>
            <Campo label="Nome do restaurante"><input className="input" required maxLength={150} onChange={set('nome')} /></Campo>
            <Campo label="Chef responsável (obrigatório)"><input className="input" required onChange={set('chef')} /></Campo>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="CNPJ"><input className="input" required maxLength={18} onChange={set('cnpj')} /></Campo>
              <Campo label="CEP"><input className="input" pattern="\d{5}-?\d{3}" placeholder="00000-000" onChange={set('cep')} /></Campo>
              <Campo label="Rua"><input className="input" maxLength={150} onChange={set('rua')} /></Campo>
              <Campo label="Número"><input className="input" type="number" min={1} onChange={set('numero')} /></Campo>
              <Campo label="Bairro"><input className="input" maxLength={100} onChange={set('bairro')} /></Campo>
              <Campo label="Cidade"><input className="input" maxLength={100} onChange={set('cidade')} /></Campo>
              <Campo label="Estado"><input className="input" maxLength={50} onChange={set('estado')} /></Campo>
            </div>
          </>
        )}
        {papel === 'NUTRICIONISTA' && (
          <>
            <Campo label="CRN"><input className="input" required maxLength={20} onChange={set('crn')} /></Campo>
            <div className="space-y-1 text-xs font-semibold text-ink-soft">
              Comprovante (PDF ou imagem)
              <input ref={fileRef} type="file" accept=".pdf,image/*" hidden
                onChange={(e) => { const a = e.target.files?.[0]; if (a) setF({ ...f, comprovante: `${a.name} • ${(a.size / 1048576).toFixed(1)} MB` }) }} />
              <button type="button" className="btn-ghost w-full" onClick={() => fileRef.current?.click()}>
                <UploadCloud size={16} /> {f.comprovante ?? 'Selecionar arquivo'}
              </button>
              <span className="block font-normal text-ink-faint">Apenas o nome do arquivo é guardado nesta demonstração.</span>
            </div>
          </>
        )}
        {papel === 'CHEF' && (
          <Campo label="Especialização">
            <select className="input" defaultValue="" onChange={set('especializacao')}>
              <option value="">Selecione</option>
              <Opcoes mapa={ENUMS.especializacao} />
            </select>
          </Campo>
        )}
        <Campo label="Bio (até 500)">
          <textarea className="input" rows={4} maxLength={500} onChange={set('bio')} />
        </Campo>
        <button className="btn-primary w-full">Criar perfil</button>
      </form>
    </Protegida>
  )
}
