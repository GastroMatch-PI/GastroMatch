import { AlertCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type YTPlayer = { seekTo: (s: number, allow: boolean) => void; playVideo: () => void; getCurrentTime: () => number; destroy: () => void }
type YTApi = { Player: new (el: HTMLElement, o: Record<string, unknown>) => YTPlayer }
declare global {
  interface Window { YT?: YTApi; onYouTubeIframeAPIReady?: () => void }
}

let carregando: Promise<YTApi> | null = null
// Carrega a IFrame API do YouTube só quando o player é necessário.
function carregarApi(): Promise<YTApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (carregando) return carregando
  carregando = new Promise((resolve, reject) => {
    const antes = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { antes?.(); resolve(window.YT as YTApi) }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.onerror = () => { carregando = null; reject(new Error('api')) }
    document.head.appendChild(s)
  })
  return carregando
}

/** Player com salto por etapa: `seek` muda a cada clique (n) e leva o vídeo ao segundo `t`. */
export default function PlayerYT({
  videoId, titulo, seek, onTempo,
}: { videoId: string; titulo: string; seek?: { t: number; n: number }; onTempo?: (s: number) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const [erro, setErro] = useState(false)
  const cb = useRef(onTempo)
  cb.current = onTempo

  useEffect(() => {
    let vivo = true
    let timer: number | undefined
    carregarApi()
      .then((YT) => {
        if (!vivo || !host.current) return
        const alvo = document.createElement('div')
        host.current.replaceChildren(alvo)
        player.current = new YT.Player(alvo, {
          videoId,
          host: 'https://www.youtube-nocookie.com',
          width: '100%',
          height: '100%',
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onError: () => setErro(true),
            onReady: () => { timer = window.setInterval(() => cb.current?.(player.current?.getCurrentTime() ?? 0), 1000) },
          },
        })
      })
      .catch(() => setErro(true))
    return () => {
      vivo = false
      if (timer) clearInterval(timer)
      player.current?.destroy?.()
      player.current = null
    }
  }, [videoId])

  useEffect(() => {
    if (seek && player.current?.seekTo) {
      player.current.seekTo(seek.t, true)
      player.current.playVideo()
    }
  }, [seek])

  if (erro)
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-soft" role="alert">
        <AlertCircle className="text-gold" />
        Este vídeo está indisponível ou bloqueado.
        <a className="text-terra underline" href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">Abrir no YouTube</a>
      </div>
    )
  return <div ref={host} role="region" aria-label={`Vídeo: ${titulo}`} className="aspect-video w-full overflow-hidden rounded-2xl bg-black [&_iframe]:h-full [&_iframe]:w-full" />
}

export const ytId = (u?: string) => (u ? u.match(/(?:v=|embed\/|shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] : undefined)
