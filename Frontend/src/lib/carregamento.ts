/**
 * Mostra estado de carregamento em um elemento enquanto a promessa não termina:
 * marca aria-busy, desabilita botões/campos e devolve o estado ao final.
 */
export async function comCarregamento<T>(promessa: Promise<T>, elemento: HTMLElement | null): Promise<T> {
  if (!elemento) return promessa
  const antes = elemento.getAttribute('aria-busy')
  const controles = Array.from(elemento.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input, select, textarea'))
  const estavam = controles.map((c) => c.disabled)
  elemento.setAttribute('aria-busy', 'true')
  controles.forEach((c) => { c.disabled = true })
  try {
    return await promessa
  } finally {
    controles.forEach((c, i) => { c.disabled = estavam[i] })
    if (antes === null) elemento.removeAttribute('aria-busy')
    else elemento.setAttribute('aria-busy', antes)
  }
}
