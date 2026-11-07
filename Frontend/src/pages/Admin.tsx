import Protegida from '../components/Protegida'
import { EstadoVazio } from '../components/Ui'
import { useSeo } from '../lib/seo'

// A curadoria (aprovar/rejeitar perfis e analisar denúncias) ainda não tem API.
// confirmar: quando existirem endpoints de administração com autorização por papel, esta tela volta a ter conteúdo.
export default function Admin() {
  useSeo({ titulo: 'Curadoria' })
  return (
    <Protegida>
      <EstadoVazio
        titulo="Curadoria indisponível"
        texto="A aprovação de perfis e a análise de denúncias ainda não estão disponíveis na plataforma."
        acao={{ to: '/', rotulo: 'Voltar para a Home' }}
      />
    </Protegida>
  )
}