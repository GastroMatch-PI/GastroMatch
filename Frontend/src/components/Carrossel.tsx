import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

// Carrossel acessível: autoplay com botão de pausa, pausa ao focar/passar o mouse, setas, indicadores e gesto de arrastar.
export default function Carrossel({ itens, rotulo }: { itens: ReactNode[]; rotulo: string }) {
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(true)
  const [pausado, setPausado] = useState(false)
  const toque = useRef<number | null>(null)
  const n = itens.length
  const reduzido = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!auto || pausado || reduzido || n < 2) return
    const t = setInterval(() => setI((x) => (x + 1) % n), 5000)
    return () => clearInterval(t)
  }, [auto, pausado, reduzido, n])

  useEffect(() => { if (i >= n) setI(0) }, [n, i])
  if (n === 0) return null
  const ir = (d: number) => setI((x) => (x + d + n) % n)

  return (
    <section
      role="region"
      aria-roledescription="carrossel"
      aria-label={rotulo}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onTouchStart={(e) => { toque.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (toque.current === null) return
        const dx = e.changedTouches[0].clientX - toque.current
        if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1)
        toque.current = null
      }}
      className="space-y-4"
    >
      <div className="overflow-hidden rounded-3xl">
        <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }} aria-live={auto && !pausado ? 'off' : 'polite'}>
          {itens.map((it, k) => (
            <div key={k} role="group" aria-roledescription="slide" aria-label={`${k + 1} de ${n}`} aria-hidden={k !== i} inert={k !== i} className="w-full shrink-0 px-0.5">{it}</div>
          ))}
        </div>
      </div>
      {n > 1 && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-line bg-surface hover:border-terra/60" aria-label="Slide anterior" onClick={() => ir(-1)}><ChevronLeft size={18} /></button>
            <button className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-line bg-surface hover:border-terra/60" aria-label="Próximo slide" onClick={() => ir(1)}><ChevronRight size={18} /></button>
            <button className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-line bg-surface hover:border-terra/60" aria-label={auto ? 'Pausar rotação automática' : 'Iniciar rotação automática'} aria-pressed={!auto} onClick={() => setAuto(!auto)}>{auto ? <Pause size={16} /> : <Play size={16} />}</button>
          </div>
          <div className="flex gap-2" role="tablist" aria-label="Escolher slide">
            {itens.map((_, k) => (
              <button key={k} role="tab" aria-selected={k === i} aria-label={`Ir para o slide ${k + 1}`} onClick={() => setI(k)} className="flex h-6 w-6 cursor-pointer items-center justify-center">
                <span className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-terra' : 'w-2 bg-line'}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
