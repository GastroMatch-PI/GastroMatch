import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, get, mensagem } from './api'

/**
 * Busca um GET e acompanha carregando/erro. `path` null não busca.
 * `lento` fica true após 4 s: o Render grátis "dorme" e a primeira chamada demora.
 */
export function useApi<T>(path: string | null) {
  const [dados, setDados] = useState<T | null>(null)
  const [carregando, setCarregando] = useState(path !== null)
  const [erro, setErro] = useState<ApiError | null>(null)
  const [lento, setLento] = useState(false)
  const [n, setN] = useState(0)
  const ativo = useRef(0)

  useEffect(() => {
    if (path === null) { setCarregando(false); return }
    const ctl = new AbortController()
    const id = ++ativo.current
    setCarregando(true); setErro(null); setLento(false)
    const t = setTimeout(() => setLento(true), 4000)
    get<T>(path, ctl.signal)
      .then((d) => { if (id === ativo.current) setDados(d) })
      .catch((e) => {
        if ((e as Error).name === 'AbortError' || id !== ativo.current) return
        setErro(e instanceof ApiError ? e : new ApiError(0, mensagem(e)))
      })
      .finally(() => { clearTimeout(t); if (id === ativo.current) { setCarregando(false); setLento(false) } })
    return () => { ctl.abort(); clearTimeout(t) }
  }, [path, n])

  const recarregar = useCallback(() => setN((x) => x + 1), [])
  return { dados, carregando, erro, lento, recarregar, setDados }
}
