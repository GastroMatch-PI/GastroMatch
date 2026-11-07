import { Heart } from 'lucide-react'
import Protegida from '../components/Protegida'
import { EstadoVazio } from '../components/Ui'
import { useSeo } from '../lib/seo'

// confirmar: favoritos dependem de endpoints (PUT/DELETE /receitas/{id}/favorito e GET /usuarios/me/favoritos).
// Enquanto eles não forem confirmados, a tela não guarda nada no navegador.
export default function Favoritos() {
  useSeo({ titulo: 'Meus favoritos' })
  return (
    <Protegida>
      <div className="space-y-6">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold"><Heart className="fill-terra text-terra" /> Meus favoritos</h1>
        <EstadoVazio
          titulo="Favoritos ainda não disponíveis"
          texto="Em breve você poderá guardar receitas e encontrá-las aqui."
          acao={{ to: '/receitas', rotulo: 'Explorar receitas' }}
        />
      </div>
    </Protegida>
  )
}