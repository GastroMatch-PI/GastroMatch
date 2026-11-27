import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FeedbackProvider } from '../components/Feedback'
import { AuthProvider } from '../context/Auth'
import NovaReceita from './NovaReceita'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let caixa: HTMLDivElement
let raiz: Root

// No lugar da tela de login: mostra para onde a pessoa deve voltar depois de entrar.
function Login() {
  const { state } = useLocation()
  return <p>login, depois voltar para {(state as { from?: string } | null)?.from}</p>
}

const abrirEdicaoPeloEndereco = () =>
  act(async () => {
    raiz.render(
      <MemoryRouter initialEntries={['/receita/54/editar']}>
        <AuthProvider>
          <FeedbackProvider>
            <Routes>
              <Route path="/receita/:id/editar" element={<NovaReceita />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </FeedbackProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
  })

beforeEach(() => {
  // A API não responde: a sessão fica "sendo restaurada" durante todo o teste.
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))
  localStorage.clear()
  caixa = document.body.appendChild(document.createElement('div'))
  raiz = createRoot(caixa)
})

afterEach(() => {
  act(() => raiz.unmount())
  caixa.remove()
  vi.unstubAllGlobals()
})

// A ordem importa: a renovação de sessão que fica pendente é compartilhada pelo módulo api.
describe('NovaReceita aberta direto pelo endereço', () => {
  it('sem sessão salva, vai para o login e lembra a tela de edição', async () => {
    await abrirEdicaoPeloEndereco()
    expect(caixa.textContent).toBe('login, depois voltar para /receita/54/editar')
  })

  it('com sessão salva, espera a restauração em vez de ir para o login', async () => {
    localStorage.setItem('gm-refresh-token', 'token-de-teste')
    await abrirEdicaoPeloEndereco()
    expect(caixa.textContent).toContain('Restaurando sua sessão')
    expect(caixa.textContent).not.toContain('login')
  })
})
