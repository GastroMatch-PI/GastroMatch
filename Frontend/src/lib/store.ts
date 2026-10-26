import { useSyncExternalStore } from 'react'

export type Store<T> = {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

// Estado compartilhado entre componentes, guardado no localStorage (sem login).
export function createStore<T>(key: string, initial: T): Store<T> {
  let value = initial
  try {
    const raw = localStorage.getItem(key)
    if (raw) value = JSON.parse(raw) as T
  } catch {
    // sem acesso ao storage: segue só em memória
  }

  const listeners = new Set<() => void>()

  return {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // idem
      }
      listeners.forEach((listener) => listener())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function useStore<T>(store: Store<T>) {
  const value = useSyncExternalStore(store.subscribe, store.get)
  return [value, store.set] as const
}
