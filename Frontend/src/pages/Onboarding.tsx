import { ChefHat, Salad, Store, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Campo, Opcoes } from '../components/Campo'
import Protegida from '../components/Protegida'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import {
  buscarPapeisDoUsuario,
  criarPerfilChef,
  criarPerfilNutricionista,
  criarRestaurante,
  listarChefs,
  type ChefOpcao,
  type PapelApi,
} from '../api/perfis'
import type { Papel } from '../lib/tipos'

const roles: { id: Papel; label: string; icon: typeof ChefHat }[] = [
  { id: 'CHEF', label: 'Chef', icon: ChefHat },
  { id: 'NUTRICIONISTA', label: 'Nutricionista', icon: Salad },
  { id: 'RESTAURANTE', label: 'Restaurante', icon: Store },
]

export default function Onboarding() {
  const { accessToken } = useAuth()
  const [papel, setPapel] = useState<Papel>('CHEF')
  const [f, setF] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [existentes, setExistentes] = useState<PapelApi[]>([])
  const [chefs, setChefs] = useState<ChefOpcao[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((atual) => ({ ...atual, [k]: e.target.value }))

  useEffect(() => {
    if (!accessToken) return
    buscarPapeisDoUsuario(accessToken)
      .then(setExistentes)
      .catch(() => setErro('Não foi possível carregar seus perfis.'))
    listarChefs().then(setChefs).catch(() => {})
  }, [accessToken])

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setOk('')
    if (!accessToken) return setErro('Sessão expirada. Entre novamente.')
    if (existentes.includes(papel)) return setErro('Você já tem esse perfil.')
    if (papel === 'CHEF' && !f.especializacao) return setErro('Selecione a especialização.')
    if (papel === 'RESTAURANTE' && !f.idChef) return setErro('Restaurante exige um chef responsável.')

    setEnviando(true)
    try {
      if (papel === 'CHEF') {
        await criarPerfilChef(accessToken, {
          especializacao: f.especializacao, // confirmar: nome do enum Java, ex.: "FRANCESA"
          bio: f.bio || undefined,
        })
        setOk('Perfil de chef criado.')
      } else if (papel === 'NUTRICIONISTA') {
        // O comprovante ainda não é enviado ao servidor (não existe upload no backend).
        await criarPerfilNutricionista(accessToken, {
          crn: f.crn,
          bio: f.bio || undefined,
        })
        setOk('Perfil enviado. Status: pendente de verificação manual do CRN.')
      } else {
        await criarRestaurante(accessToken, {
          nome: f.nome,
          cnpj: f.cnpj,
          idChef: Number(f.idChef),
          cep: f.cep || undefined,
          rua: f.rua || undefined,
          numero: f.numero ? Number(f.numero) : undefined,
          bairro: f.bairro || undefined,
          cidade: f.cidade || undefined,
          estado: f.estado || undefined,
        })
        setOk('Restaurante criado.')
      }
      setExistentes((l) => [...l, papel as PapelApi])
    } catch (x) {
      setErro((x as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Protegida>
      <form onSubmit={enviar} className="card mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Criar perfil profissional</h1>

        <div role="tablist" className="flex gap-1 rounded-full border border-line bg-cream p-1 text-xs font-semibold">
          {roles.map((r) => (
            <button
              type="button"
              key={r.id}
              onClick={() => { setPapel(r.id); setErro(''); setOk('') }}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 transition duration-200 ${papel === r.id ? 'bg-terra text-on-accent shadow-soft' : 'text-ink-soft hover:text-terra'}`}
            >
              <r.icon size={16} /> {r.label}
            </button>
          ))}
        </div>

        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        {ok && <Aviso tipo="ok">{ok} <Link to="/conta" className="underline">Minha conta</Link></Aviso>}

        {papel === 'RESTAURANTE' && (
          <>
            <Campo label="Nome do restaurante">
              <input className="input" required maxLength={150} onChange={set('nome')} />
            </Campo>
            <Campo label="Chef responsável (obrigatório)">
              <select className="input" required value={f.idChef ?? ''} onChange={set('idChef')}>
                <option value="">Selecione um chef</option>
                {chefs.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
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
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,image/*"
                hidden
                onChange={(e) => {
                  const a = e.target.files?.[0]
                  if (a) setF((atual) => ({ ...atual, comprovante: `${a.name} • ${(a.size / 1048576).toFixed(1)} MB` }))
                }}
              />
              <button type="button" className="btn-ghost w-full" onClick={() => fileRef.current?.click()}>
                <UploadCloud size={16} /> {f.comprovante ?? 'Selecionar arquivo'}
              </button>
              <span className="block font-normal text-ink-faint">
                O arquivo ainda não é enviado ao servidor. Esta etapa depende do upload no backend.
              </span>
            </div>
          </>
        )}

        {papel === 'CHEF' && (
          <Campo label="Especialização">
            <select className="input" required defaultValue="" onChange={set('especializacao')}>
              <option value="">Selecione</option>
              <Opcoes mapa={ENUMS.especializacao} />
            </select>
          </Campo>
        )}

        <Campo label="Bio (até 500)">
          <textarea className="input" rows={4} maxLength={500} onChange={set('bio')} />
        </Campo>

        <button className="btn-primary w-full" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Criar perfil'}
        </button>
      </form>
    </Protegida>
  )
}