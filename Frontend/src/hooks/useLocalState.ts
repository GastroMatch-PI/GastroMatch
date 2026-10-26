import { useEffect, useState } from 'react'

// useState persistido no localStorage ("offline first", sem login).
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // armazenamento indisponível: segue só em memória
    }
  }, [key, value])

  return [value, setValue] as const
}
