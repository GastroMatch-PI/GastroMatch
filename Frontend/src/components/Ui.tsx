import { ChevronLeft, ChevronRight, ImagePlus, Loader2, UploadCloud, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { paginasVisiveis } from '../lib/format'

/* ---------- Skeleton / Spinner ---------- */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-2xl bg-peach-deep/60 motion-reduce:animate-none ${className}`} />
}
export function SkeletonCardReceita() {
  return <Skeleton className="aspect-[4/5] !rounded-[1.75rem]" />
}
export function SkeletonCardRestaurante() {
  return <Skeleton className="h-64" />
}
export function SkeletonComentarios() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando comentários">
      {[0, 1].map((i) => <Skeleton key={i} className="h-24" />)}
    </div>
  )
}
export function Spinner({ rotulo = 'Carregando' }: { rotulo?: string }) {
  return <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-label={rotulo} role="img" />
}

/* ---------- Estado vazio (SVG leve + texto real + ação) ---------- */
export function EstadoVazio({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: { to?: string; onClick?: () => void; rotulo: string } }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden>
        <circle cx="44" cy="44" r="40" fill="var(--color-peach)" />
        <path d="M24 46h40a0 0 0 0 1 0 0 20 20 0 0 1-20 20 20 20 0 0 1-20-20Z" stroke="var(--color-terra)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M34 36c0-4 4-4 4-8M44 36c0-4 4-4 4-8M54 36c0-4 4-4 4-8" stroke="var(--color-terra)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h3 className="text-lg font-bold">{titulo}</h3>
      {texto && <p className="max-w-sm text-sm text-ink-soft">{texto}</p>}
      {acao && (acao.to ? <Link to={acao.to} className="btn-primary">{acao.rotulo}</Link> : <button className="btn-primary" onClick={acao.onClick}>{acao.rotulo}</button>)}
    </div>
  )
}

/* ---------- Paginação ---------- */
export function Paginacao({ pagina, total, onMudar }: { pagina: number; total: number; onMudar: (p: number) => void }) {
  if (total <= 1) return null
  const btn = 'flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-full border border-line px-3 text-sm font-semibold transition hover:border-terra/60 hover:text-terra disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-2">
      <button className={btn} disabled={pagina <= 1} onClick={() => onMudar(pagina - 1)} aria-label="Página anterior"><ChevronLeft size={16} /></button>
      {paginasVisiveis(pagina, total).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} aria-hidden className="px-1 text-ink-faint">…</span>
        ) : (
          <button key={p} className={`${btn} ${p === pagina ? '!border-terra bg-terra text-on-accent' : ''}`} aria-current={p === pagina ? 'page' : undefined} aria-label={`Página ${p}`} onClick={() => onMudar(p)}>
            {p}
          </button>
        ),
      )}
      <button className={btn} disabled={pagina >= total} onClick={() => onMudar(pagina + 1)} aria-label="Próxima página"><ChevronRight size={16} /></button>
    </nav>
  )
}

/* ---------- Upload de imagem (arrastar e soltar, prévia, progresso, cancelar, redimensionar) ---------- */
const TIPOS = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 5

function redimensionar(dataUrl: string, max: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export function UploadImagem({
  valor, onChange, rotulo = 'Imagem', max = 800, redondo = false,
}: { valor?: string; onChange: (dataUrl: string | undefined) => void; rotulo?: string; max?: number; redondo?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const leitor = useRef<FileReader | null>(null)
  const [erro, setErro] = useState('')
  const [prog, setProg] = useState<number | null>(null)
  const [arrastando, setArrastando] = useState(false)

  useEffect(() => () => leitor.current?.abort(), [])

  const ler = (f: File | undefined) => {
    setErro('')
    if (!f) return
    if (!TIPOS.includes(f.type)) return setErro('Arquivo inválido: envie uma imagem JPG, PNG ou WebP.')
    if (f.size > MAX_MB * 1048576) return setErro(`A imagem tem mais de ${MAX_MB} MB.`)
    const r = new FileReader()
    leitor.current = r
    setProg(0)
    r.onprogress = (e) => e.lengthComputable && setProg(Math.round((e.loaded / e.total) * 100))
    r.onload = async () => {
      onChange(await redimensionar(String(r.result), max))
      setProg(null)
    }
    r.onabort = () => setProg(null)
    r.onerror = () => { setErro('Não foi possível ler o arquivo.'); setProg(null) }
    r.readAsDataURL(f)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-ink-soft">{rotulo}</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); ler(e.dataTransfer.files[0]) }}
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-4 text-center transition ${arrastando ? 'border-terra bg-peach' : 'border-line'}`}
      >
        {valor ? (
          <div className="relative">
            <img src={valor} alt="Pré-visualização" className={`h-32 w-32 object-cover ${redondo ? 'rounded-full' : 'rounded-xl'}`} />
            <button type="button" aria-label="Remover imagem" onClick={() => onChange(undefined)} className="absolute -right-2 -top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface shadow-soft"><X size={14} /></button>
          </div>
        ) : (
          <UploadCloud className="text-terra" size={28} aria-hidden />
        )}
        {prog !== null ? (
          <div className="w-full max-w-xs space-y-1">
            <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={prog} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-terra transition-all" style={{ width: `${prog}%` }} /></div>
            <button type="button" className="text-xs font-semibold text-terra" onClick={() => leitor.current?.abort()}>Cancelar envio</button>
          </div>
        ) : (
          <button type="button" className="btn-ghost !py-2 text-xs" onClick={() => input.current?.click()}>
            <ImagePlus size={15} /> {valor ? 'Trocar imagem' : 'Escolher imagem ou arrastar aqui'}
          </button>
        )}
        <p className="text-[11px] text-ink-faint">JPG, PNG ou WebP, até {MAX_MB} MB.</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" capture={undefined} hidden onChange={(e) => { ler(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {erro && <p role="alert" className="text-xs text-alert">{erro}</p>}
    </div>
  )
}

export function Secao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card p-5 md:p-6 ${className}`}>{children}</section>
}
