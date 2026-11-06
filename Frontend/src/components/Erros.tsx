import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useSeo } from '../lib/seo'
import { EstadoVazio } from './Ui'

export function NotFound() {
  useSeo({ titulo: 'Página não encontrada' })
  return <EstadoVazio titulo="Página não encontrada" texto="O endereço não existe ou foi movido." acao={{ to: '/', rotulo: 'Voltar para a Home' }} />
}

export function AcessoNegado() {
  useSeo({ titulo: 'Acesso negado' })
  return <EstadoVazio titulo="Acesso negado" texto="Você não tem permissão para ver esta página." acao={{ to: '/', rotulo: 'Voltar para a Home' }} />
}

export function ErroGenerico({ onTentar }: { onTentar?: () => void }) {
  return (
    <div className="card mx-auto my-16 max-w-md space-y-4 p-8 text-center" role="alert">
      <h1 className="text-2xl font-bold">Algo deu errado</h1>
      <p className="text-sm text-ink-soft">Tivemos um problema inesperado. Tente de novo em instantes.</p>
      <div className="flex justify-center gap-2">
        {onTentar && <button className="btn-primary" onClick={onTentar}>Tentar de novo</button>}
        <Link to="/" className="btn-ghost" onClick={onTentar}>Ir para a Home</Link>
      </div>
    </div>
  )
}

// Captura erros de renderização; mostra mensagem amigável e registra o contexto sem dados sensíveis.
export class ErrorBoundary extends Component<{ children: ReactNode }, { erro: boolean }> {
  state = { erro: false }
  static getDerivedStateFromError() { return { erro: true } }
  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('[GastroMatch] erro inesperado', { mensagem: erro.message, rota: location.pathname, componente: info.componentStack?.split('\n')[1]?.trim() })
  }
  render() { return this.state.erro ? <ErroGenerico onTentar={() => this.setState({ erro: false })} /> : this.props.children }
}
