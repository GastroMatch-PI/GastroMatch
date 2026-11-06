import { Eye, EyeOff } from 'lucide-react'
import { Children, cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react'
import { forcaSenha, requisitosSenha } from '../lib/validar'

// Rótulo + campo + erro ligado por aria-describedby. Injeta id/aria no único filho.
export function Campo({ label, erro, children, dica }: { label: string; erro?: string; children: ReactNode; dica?: string }) {
  const id = useId()
  const erroId = `${id}-erro`
  const filho = Children.only(children) as ReactElement<Record<string, unknown>>
  const campo = isValidElement(filho)
    ? cloneElement(filho, {
        id,
        'aria-invalid': erro ? true : undefined,
        'aria-describedby': erro ? erroId : dica ? `${id}-dica` : undefined,
      })
    : filho
  return (
    <div className="space-y-1 text-xs font-semibold text-ink-soft">
      <label htmlFor={id} className="block">{label}</label>
      {campo}
      {dica && !erro && <span id={`${id}-dica`} className="block font-normal text-ink-faint">{dica}</span>}
      {erro && <span id={erroId} role="alert" className="block font-normal text-alert">{erro}</span>}
    </div>
  )
}

export function Aviso({ tipo, children }: { tipo: 'erro' | 'ok' | 'info'; children: ReactNode }) {
  const cor = tipo === 'erro' ? 'bg-alert-soft text-alert' : tipo === 'ok' ? 'bg-leaf-soft text-leaf' : 'bg-gold-soft text-gold'
  return <p role={tipo === 'erro' ? 'alert' : undefined} className={`rounded-xl px-3 py-2 text-xs font-medium ${cor}`}>{children}</p>
}

export function Opcoes({ mapa }: { mapa: Record<string, string> }) {
  return (
    <>
      {Object.entries(mapa).map(([k, v]) => (
        <option key={k} value={k}>{v}</option>
      ))}
    </>
  )
}

// Senha com botão mostrar/ocultar, requisitos em tempo real e indicador de força.
export function CampoSenha({
  label, value, onChange, erro, autoComplete = 'new-password', mostrarForca = false, onBlur, nome,
}: {
  nome?: string; label: string; value: string; onChange: (v: string) => void; erro?: string
  autoComplete?: 'new-password' | 'current-password'; mostrarForca?: boolean; onBlur?: () => void
}) {
  const [ver, setVer] = useState(false)
  const id = useId()
  const forca = forcaSenha(value)
  const rotulos = ['Muito fraca', 'Fraca', 'Média', 'Boa', 'Forte']
  return (
    <div className="space-y-2">
      <div className="space-y-1 text-xs font-semibold text-ink-soft">
        <label htmlFor={id} className="block">{label}</label>
        <div className="relative">
          <input
            id={id}
            name={nome ?? id}
            className="input !pr-12"
            type={ver ? 'text' : 'password'}
            value={value}
            autoComplete={autoComplete}
            maxLength={72}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? `${id}-erro` : undefined}
            onBlur={onBlur}
            onChange={(e) => onChange(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setVer(!ver)}
            aria-label={ver ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={ver}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-ink-soft hover:text-terra"
          >
            {ver ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {erro && <span id={`${id}-erro`} role="alert" className="block font-normal text-alert">{erro}</span>}
      </div>
      {mostrarForca && (
        <div className="space-y-1.5" aria-live="polite">
          <div className="flex gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${value && i < forca ? 'bg-terra' : 'bg-line'}`} />
            ))}
          </div>
          <p className="text-[11px] text-ink-faint">Força: {value ? rotulos[forca] : '—'}</p>
          <ul className="space-y-0.5 text-[11px]">
            {requisitosSenha(value).map((r) => (
              <li key={r.texto} className={r.ok ? 'text-leaf' : 'text-ink-faint'}>{r.ok ? '✓' : '•'} {r.texto}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
