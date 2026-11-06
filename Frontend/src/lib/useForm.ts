import { useState } from 'react'
import { primeiroErro, validarCampo, validarTodos, type Esquema } from './validar'

/** Estado de formulário com validação ao sair do campo e ao enviar; foca o primeiro erro. */
export function useForm<T extends Record<string, string>>(inicial: T, esquema: Esquema) {
  const [v, setV] = useState<T>(inicial)
  const [erros, setErros] = useState<Record<string, string>>({})

  const set = (k: keyof T & string) => (val: string) => {
    setV((p) => ({ ...p, [k]: val }))
    if (erros[k]) setErros((e) => ({ ...e, [k]: '' }))
  }
  const onChange = (k: keyof T & string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(k)(e.target.value)
  const onBlur = (k: keyof T & string) => () => {
    const e = validarCampo(v[k] ?? '', esquema[k] ?? [], v)
    setErros((p) => ({ ...p, [k]: e ?? '' }))
  }
  const enviar = (fn: (valores: T) => void | Promise<void>) => (e: React.FormEvent) => {
    e.preventDefault()
    const er = validarTodos(v, esquema)
    setErros(er)
    const f = primeiroErro(er, esquema)
    if (f) {
      document.querySelector<HTMLElement>(`[name="${f}"]`)?.focus()
      return
    }
    void fn(v)
  }
  return { v, setV, erros, setErros, set, onChange, onBlur, enviar }
}
