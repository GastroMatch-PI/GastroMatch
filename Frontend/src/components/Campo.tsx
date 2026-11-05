import type { ReactNode } from 'react'

export function Campo({ label, erro, children }: { label: string; erro?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-xs font-semibold text-ink-soft">
      {label}
      {children}
      {erro && <span className="block font-normal text-alert">{erro}</span>}
    </label>
  )
}

export function Aviso({ tipo, children }: { tipo: 'erro' | 'ok' | 'info'; children: ReactNode }) {
  const cor = tipo === 'erro' ? 'bg-alert-soft text-alert' : tipo === 'ok' ? 'bg-leaf-soft text-leaf' : 'bg-gold-soft text-gold'
  return <p className={`rounded-md px-3 py-2 text-xs font-medium ${cor}`}>{children}</p>
}

export function Opcoes({ mapa }: { mapa: Record<string, string> }) {
  return (
    <>
      {Object.entries(mapa).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </>
  )
}
