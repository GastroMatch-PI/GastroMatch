import { ChefHat, Pencil } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CardRestaurante from '../components/CardRestaurante'
import { Aviso, Campo, Opcoes } from '../components/Campo'
import { Modal, useToast } from '../components/Feedback'
import Protegida from '../components/Protegida'
import RecipeCard from '../components/RecipeCard'
import { Avatar } from '../components/Photo'
import { Carregando, ErroApi, EstadoVazio, Paginacao, UploadImagem } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import { mensagem, put, urlImagem } from '../lib/api'
import type { Especializacao, Pagina, ReceitaResumo, RestauranteDetalhe, Usuario } from '../lib/apiTipos'
import { useSeo } from '../lib/seo'
import { useApi } from '../lib/useApi'

const TAMANHO = 12

export default function Conta() {
  useSeo({ titulo: 'Meu perfil' })
  const { usuario, perfil, carregandoPerfil, atualizarUsuario, recarregarPerfil, sair } = useAuth()
  const nav = useNavigate()
  const toast = useToast()

  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')
  const [username, setUsername] = useState('')
  const [foto, setFoto] = useState<string | undefined>()
  const [bio, setBio] = useState('')
  const [especializacao, setEspecializacao] = useState<Especializacao | ''>('')
  const [pagina, setPagina] = useState(1)

  const chefId = perfil?.papel === 'CHEF' ? perfil.dados.id : null
  const restauranteId = perfil?.papel === 'CHEF' ? perfil.dados.idRestaurante : null
  const receitasChef = useApi<Pagina<ReceitaResumo>>(
    chefId ? `/receitas?chefId=${chefId}&pagina=${pagina - 1}&tamanho=${TAMANHO}` : null,
  )
  const favoritas = useApi<Pagina<ReceitaResumo>>(
    chefId ? null : `/usuarios/me/favoritos?pagina=${pagina - 1}&tamanho=${TAMANHO}`,
  )
  const restaurante = useApi<RestauranteDetalhe>(
    restauranteId ? `/restaurantes/${restauranteId}` : null,
  )

  const abrirEdicao = () => {
    setErroSalvar('')
    setUsername(usuario?.username ?? '')
    setFoto(usuario?.capa ?? undefined)
    setBio(perfil?.dados && 'bio' in perfil.dados ? perfil.dados.bio ?? '' : '')
    setEspecializacao(perfil?.papel === 'CHEF' ? perfil.dados.especializacao ?? '' : '')
    setModalAberto(true)
  }

  const salvarPerfil = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (!username.trim() || salvando) return
    setSalvando(true)
    setErroSalvar('')

    try {
      // O campo `capa` já existe no banco e guarda o caminho da foto enviado pela API.
      const atualizado = await put<Usuario>('/usuarios/me', {
        username: username.trim(),
        capa: foto ?? null,
      })
      atualizarUsuario(atualizado)

      if (perfil?.papel === 'CHEF') {
        await put('/chefs/me', {
          bio: bio.trim() || null,
          especializacao: especializacao || null,
          idRestaurante: perfil.dados.idRestaurante ?? null,
        })
      } else if (perfil?.papel === 'NUTRICIONISTA') {
        await put('/nutricionistas/me', {
          bio: bio.trim() || null,
          crn: perfil.dados.crn,
        })
      } else if (perfil?.papel === 'RESTAURANTE') {
        const r = perfil.dados
        await put('/restaurantes/me', {
          nome: r.nome,
          bio: bio.trim() || null,
          cnpj: r.cnpj,
          numero: r.numero,
          rua: r.rua,
          cep: r.cep,
          bairro: r.bairro,
          cidade: r.cidade,
          estado: r.estado,
          latitude: r.latitude,
          longitude: r.longitude,
        })
      }

      await recarregarPerfil()
      setModalAberto(false)
      toast.sucesso('Perfil atualizado.')
    } catch (erro) {
      setErroSalvar(mensagem(erro))
    } finally {
      setSalvando(false)
    }
  }

  const papel = perfil?.papel === 'CHEF'
    ? 'Chef'
    : perfil?.papel === 'NUTRICIONISTA'
      ? 'Nutricionista'
      : perfil?.papel === 'RESTAURANTE'
        ? 'Restaurante'
        : 'Membro GastroMatch'
  const bioPerfil = perfil?.dados && 'bio' in perfil.dados ? perfil.dados.bio : null
  const fotoUrl = urlImagem(usuario?.capa)
  const lista = chefId ? receitasChef : favoritas
  const receitas = lista.dados?.conteudo ?? []

  return (
    <Protegida>
      <div className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {fotoUrl ? (
                <img src={fotoUrl} alt={`Foto de perfil de ${usuario?.username ?? 'usuário'}`} className="h-48 w-48 rounded-full border border-line object-cover shadow-soft" />
              ) : (
                <Avatar className="h-48 w-48 border border-line" />
              )}
              <h1 className="mt-4 break-words font-display text-2xl font-extrabold">{usuario?.username}</h1>
              <p className="mt-1 text-sm text-ink-soft">
                {papel}{perfil?.papel === 'CHEF' && perfil.dados.especializacao
                  ? ` · ${ENUMS.especializacao[perfil.dados.especializacao]}`
                  : ''}
              </p>
            </div>

            <button type="button" className="btn-ghost w-full justify-center" onClick={abrirEdicao}>
              <Pencil size={15} /> Editar perfil
            </button>
            {perfil?.papel === 'CHEF' && (
              <Link to="/publicar" className="btn-primary w-full justify-center">Publicar receita</Link>
            )}
            <p className="break-all text-xs text-ink-faint">{usuario?.email}</p>
            <button type="button" className="text-xs text-ink-soft underline" onClick={async () => { await sair(); nav('/') }}>Sair da conta</button>
          </aside>

          <div className="min-w-0 space-y-8">
            <section className="card space-y-3 p-5 md:p-7" aria-labelledby="sobre-perfil">
              <h2 id="sobre-perfil" className="text-xl font-bold">Sobre</h2>
              {carregandoPerfil ? (
                <p className="text-sm text-ink-soft">Carregando informações do perfil…</p>
              ) : bioPerfil ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-ink-soft">{bioPerfil}</p>
              ) : (
                <p className="text-sm text-ink-faint">Este perfil ainda não tem uma bio.</p>
              )}
              {perfil?.papel === 'CHEF' && (
                <p className="flex items-center gap-2 text-sm font-semibold text-terra">
                  <ChefHat size={16} /> {perfil.dados.especializacao ? ENUMS.especializacao[perfil.dados.especializacao] : 'Especialização não informada'}
                </p>
              )}
            </section>

            {perfil?.papel === 'CHEF' && (
              <section className="space-y-4" aria-labelledby="restaurante-perfil">
                <h2 id="restaurante-perfil" className="text-2xl font-bold">Restaurante</h2>
                {!restauranteId ? (
                  <EstadoVazio titulo="Nenhum restaurante associado" texto="Quando um restaurante for associado ao perfil de chef, ele aparecerá aqui." />
                ) : restaurante.erro ? (
                  <ErroApi erro={restaurante.erro} onTentar={restaurante.recarregar} />
                ) : !restaurante.dados ? (
                  <Carregando lento={restaurante.lento} texto="Carregando restaurante" />
                ) : (
                  <CardRestaurante restaurante={restaurante.dados} />
                )}
              </section>
            )}

            <section className="space-y-4" aria-labelledby="receitas-perfil">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="receitas-perfil" className="text-2xl font-bold">
                    {chefId ? 'Receitas publicadas' : 'Receitas favoritas'}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {chefId ? 'Receitas deste perfil de chef.' : 'Suas receitas favoritas aparecem aqui.'}
                  </p>
                </div>
                {!chefId && <Link to="/favoritos" className="text-sm font-semibold text-terra underline">Ver favoritos</Link>}
              </div>

              {lista.erro ? (
                <ErroApi erro={lista.erro} onTentar={lista.recarregar} />
              ) : !lista.dados ? (
                <Carregando lento={lista.lento} texto={chefId ? 'Carregando receitas' : 'Carregando favoritos'} />
              ) : receitas.length === 0 ? (
                <EstadoVazio
                  titulo={chefId ? 'Este chef ainda não publicou receitas' : 'Você ainda não favoritou receitas'}
                  acao={{ to: '/receitas', rotulo: 'Explorar receitas' }}
                />
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {receitas.map((receita) => <RecipeCard key={receita.id} receita={receita} />)}
                  </div>
                  <Paginacao pagina={pagina} total={lista.dados.totalPaginas} onMudar={setPagina} />
                </>
              )}
            </section>
          </div>
        </div>
      </div>

      <Modal titulo="Editar perfil" aberto={modalAberto} onFechar={() => setModalAberto(false)}>
        <form className="space-y-4" onSubmit={salvarPerfil}>
          {erroSalvar && <Aviso tipo="erro">{erroSalvar}</Aviso>}
          <Campo label="Nome de exibição">
            <input className="input" value={username} minLength={3} maxLength={50} required onChange={(evento) => setUsername(evento.target.value)} />
          </Campo>
          <UploadImagem rotulo="Foto de perfil" valor={foto} onChange={setFoto} redondo />
          {perfil && 'bio' in perfil.dados && (
            <Campo label="Bio" dica={`${bio.length} / 500`}>
              <textarea className="input" rows={4} maxLength={500} value={bio} onChange={(evento) => setBio(evento.target.value)} />
            </Campo>
          )}
          {perfil?.papel === 'CHEF' && (
            <Campo label="Especialização">
              <select className="input" value={especializacao} onChange={(evento) => setEspecializacao(evento.target.value as Especializacao | '')}>
                <option value="">Selecione</option>
                <Opcoes mapa={ENUMS.especializacao} />
              </select>
            </Campo>
          )}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalAberto(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar alterações'}</button>
          </div>
        </form>
      </Modal>
    </Protegida>
  )
}
