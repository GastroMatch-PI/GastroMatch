import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type Tipo = 'sucesso' | 'erro' | 'aviso'
type Toast = { id: number; tipo: Tipo; texto: string }
type ConfirmOpts = { titulo: string; texto?: string; confirmar?: string; perigo?: boolean }

const ToastCtx = createContext<(tipo: Tipo, texto: string) => void>(() => undefined)
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(() => Promise.resolve(false))

export const useToast = () => {
  const push = useContext(ToastCtx)
  return {
    sucesso: (t: string) => push('sucesso', t),
    erro: (t: string) => push('erro', t),
    aviso: (t: string) => push('aviso', t),
  }
}
export const useConfirmar = () => useContext(ConfirmCtx)

const icones = { sucesso: CheckCircle2, erro: XCircle, aviso: Info }
const cores = {
  sucesso: 'border-leaf/50 text-leaf',
  erro: 'border-alert/50 text-alert',
  aviso: 'border-gold/50 text-gold',
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)

  const push = useCallback((tipo: Tipo, texto: string) => {
    const id = Date.now() + Math.random()
    setToasts((l) => [...l.slice(-3), { id, tipo, texto }])
    setTimeout(() => setToasts((l) => l.filter((t) => t.id !== id)), 5000)
  }, [])

  const confirmar = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setDlg({ ...o, resolve })), [])

  const fechar = (v: boolean) => {
    dlg?.resolve(v)
    setDlg(null)
  }

  return (
    <ToastCtx.Provider value={push}>
      <ConfirmCtx.Provider value={confirmar}>
        {children}
        {/* aria-live anuncia os toasts para leitores de tela */}
        <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4">
          {toasts.map((t) => {
            const Icon = icones[t.tipo]
            return (
              <div key={t.id} className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border bg-surface px-4 py-3 text-sm shadow-lift ${cores[t.tipo]}`}>
                <Icon size={18} className="mt-0.5 shrink-0" />
                <p className="flex-1 text-ink">{t.texto}</p>
                <button aria-label="Fechar aviso" className="cursor-pointer text-ink-faint hover:text-ink" onClick={() => setToasts((l) => l.filter((x) => x.id !== t.id))}>
                  <X size={16} />
                </button>
              </div>
            )
          })}
        </div>
        {dlg && <ModalConfirmar {...dlg} onFechar={fechar} />}
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  )
}

// Modal acessível: foco preso, ESC fecha, devolve o foco ao elemento anterior.
function ModalConfirmar({ titulo, texto, confirmar = 'Confirmar', perigo, onFechar }: ConfirmOpts & { onFechar: (v: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    const foco = () => ref.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    foco()?.[foco()!.length - 1]?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar(false)
      if (e.key === 'Tab') {
        const els = foco()
        if (!els || !els.length) return
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); anterior?.focus() }
  }, [onFechar])

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => onFechar(false)}>
      <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d" className="card w-full max-w-md space-y-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          {perigo && <AlertTriangle className="mt-1 shrink-0 text-alert" size={20} />}
          <div>
            <h2 id="dlg-t" className="text-lg font-bold">{titulo}</h2>
            {texto && <p id="dlg-d" className="mt-1 text-sm text-ink-soft">{texto}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => onFechar(false)}>Cancelar</button>
          <button className={perigo ? 'inline-flex cursor-pointer items-center rounded-full bg-alert px-5 py-2.5 text-sm font-bold text-on-accent' : 'btn-primary'} onClick={() => onFechar(true)}>{confirmar}</button>
        </div>
      </div>
    </div>
  )
}

// Modal genérico (mesma regra de foco e ESC) para formulários curtos.
export function Modal({ titulo, aberto, onFechar, children }: { titulo: string; aberto: boolean; onFechar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto) return
    const anterior = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
      if (e.key === 'Tab') {
        const els = ref.current?.querySelectorAll<HTMLElement>('button, input, select, textarea, [href]')
        if (!els?.length) return
        const first = els[0], last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); anterior?.focus() }
  }, [aberto, onFechar])
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onFechar}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={titulo} className="card w-full max-w-md space-y-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{titulo}</h2>
        {children}
      </div>
    </div>
  )
}
