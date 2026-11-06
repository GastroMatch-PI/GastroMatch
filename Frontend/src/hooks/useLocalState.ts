import { useCallback, useEffect, useState } from 'react'

const EVT = 'gm-store'

function ler<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : initial
  } catch {
    return initial
  }
}

// useState persistido no localStorage e sincronizado entre componentes.
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => ler(key, initial))

  useEffect(() => {
    const on = (e: Event) => {
      if ((e as CustomEvent).detail === key || e.type === 'storage') setValue(ler(key, initial))
    }
    window.addEventListener(EVT, on)
    window.addEventListener('storage', on)
    return () => {
      window.removeEventListener(EVT, on)
      window.removeEventListener('storage', on)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const set = useCallback(
    (next: T | ((p: T) => T)) => {
      const cur = ler(key, initial)
      const val = typeof next === 'function' ? (next as (p: T) => T)(cur) : next
      try {
        localStorage.setItem(key, JSON.stringify(val))
      } catch {
        /* só em memória */
      }
      setValue(val)
      window.dispatchEvent(new CustomEvent(EVT, { detail: key }))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  return [value, set] as const
}
