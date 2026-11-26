import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Modal } from './Feedback'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let caixa: HTMLDivElement
let raiz: Root
let redesenhar: () => void

// Imita a tela de perfil: redesenha a cada tecla e passa um onFechar novo em cada render.
function Tela({ onFechar }: { onFechar: (versao: number) => void }) {
  const [versao, setVersao] = useState(0)
  redesenhar = () => setVersao((v) => v + 1)
  return (
    <Modal titulo="Editar perfil" aberto onFechar={() => onFechar(versao)}>
      <input aria-label="Nome" />
      <textarea aria-label="Bio" />
    </Modal>
  )
}

beforeEach(() => {
  caixa = document.body.appendChild(document.createElement('div'))
  raiz = createRoot(caixa)
})

afterEach(() => {
  act(() => raiz.unmount())
  caixa.remove()
})

describe('Modal', () => {
  it('foca o primeiro campo ao abrir', () => {
    act(() => raiz.render(<Tela onFechar={() => undefined} />))
    expect(document.activeElement).toBe(caixa.querySelector('input'))
  })

  it('mantém o foco no campo em uso quando a tela redesenha', () => {
    act(() => raiz.render(<Tela onFechar={() => undefined} />))
    const bio = caixa.querySelector('textarea')!
    bio.focus()
    act(() => redesenhar())
    expect(document.activeElement).toBe(bio)
  })

  it('ESC chama o onFechar mais recente', () => {
    const onFechar = vi.fn()
    act(() => raiz.render(<Tela onFechar={onFechar} />))
    act(() => redesenhar())
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
    expect(onFechar).toHaveBeenCalledExactlyOnceWith(1)
  })
})
