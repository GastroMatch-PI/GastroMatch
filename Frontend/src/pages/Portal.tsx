import { Link } from 'react-router-dom'
import { Aviso, Campo, Opcoes } from '../components/Campo'
import { useToast } from '../components/Feedback'
import { Avatar } from '../components/Photo'
import Protegida from '../components/Protegida'
import { Carregando, EstadoVazio } from '../components/Ui'
import { useAuth } from '../context/Auth'
import { ENUMS } from '../data/enums'
import { errosDeCampo, mensagem, put } from '../lib/api'
import type { PerfilProfissional } from '../lib/apiTipos'
import { mascaraCNPJ, mascaraCRN } from '../lib/mascaras'
import { useSeo } from '../lib/seo'
import { useForm } from '../lib/useForm'
import { obrigatorio, tamanho } from '../lib/validar'
import { useState } from 'react'

const nomes = { CHEF: 'Chef', NUTRICIONISTA: 'Nutricionista', RESTAURANTE: 'Restaurante' }

function Formulario({ perfil }: { perfil: PerfilProfissional }) {
  const { recarregarPerfil } = useAuth()
  const toast = useToast()
  const [erro, setErro] = useState('')
  const d = perfil.dados
  const f = useForm(
    {
      bio: ('bio' in d && d.bio) || '',
      especializacao: perfil.papel === 'CHEF' ? (perfil.dados.especializacao ?? '') : '',
      crn: perfil.papel === 'NUTRICIONISTA' ? perfil.dados.crn : '',
      nome: perfil.papel === 'RESTAURANTE' ? perfil.dados.nome : '',
      numero: perfil.papel === 'RESTAURANTE' ? String(perfil.dados.numero ?? '') : '',
      rua: perfil.papel === 'RESTAURANTE' ? (perfil.dados.rua ?? '') : '',
      cep: perfil.papel === 'RESTAURANTE' ? (perfil.dados.cep ?? '') : '',
      bairro: perfil.papel === 'RESTAURANTE' ? (perfil.dados.bairro ?? '') : '',
      cidade: perfil.papel === 'RESTAURANTE' ? (perfil.dados.cidade ?? '') : '',
      estado: perfil.papel === 'RESTAURANTE' ? (perfil.dados.estado ?? '') : '',
    },
    { bio: [tamanho(0, 500)], ...(perfil.papel === 'NUTRICIONISTA' ? { crn: [obrigatorio('Informe o CRN'), tamanho(1, 20)] } : {}), ...(perfil.papel === 'RESTAURANTE' ? { nome: [obrigatorio('Informe o nome')] } : {}) },
  )

  const salvar = f.enviar(async (v) => {
    setErro('')
    // O PUT troca todos os campos: o que não for enviado fica vazio.
    const corpo =
      perfil.papel === 'CHEF' ? { bio: v.bio, especializacao: v.especializacao || undefined }
      : perfil.papel === 'NUTRICIONISTA' ? { bio: v.bio, crn: v.crn }
      : { nome: v.nome.trim(), bio: v.bio, cnpj: perfil.dados.cnpj, numero: v.numero ? Number(v.numero) : undefined, rua: v.rua, cep: v.cep || undefined, bairro: v.bairro, cidade: v.cidade, estado: v.estado, latitude: perfil.dados.latitude ?? undefined, longitude: perfil.dados.longitude ?? undefined }
    try {
      await put(perfil.papel === 'CHEF' ? '/chefs/me' : perfil.papel === 'NUTRICIONISTA' ? '/nutricionistas/me' : '/restaurantes/me', corpo)
      await recarregarPerfil()
      toast.sucesso('Perfil atualizado.')
    } catch (e) {
      f.setErros(errosDeCampo(e))
      setErro(mensagem(e))
    }
  })

  return (
    <form onSubmit={salvar} noValidate className="space-y-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {perfil.papel === 'RESTAURANTE' && (
        <>
          <Campo label="Nome" erro={f.erros.nome}><input name="nome" className="input" maxLength={150} value={f.v.nome} onChange={f.onChange('nome')} /></Campo>
          <Campo label="CNPJ" dica="O CNPJ não pode ser alterado aqui."><input className="input" value={mascaraCNPJ(perfil.dados.cnpj)} readOnly /></Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Rua"><input name="rua" className="input" value={f.v.rua} onChange={f.onChange('rua')} /></Campo>
            <Campo label="Número" erro={f.erros.numero}><input name="numero" className="input" inputMode="numeric" value={f.v.numero} onChange={(e) => f.set('numero')(e.target.value.replace(/\D/g, ''))} /></Campo>
            <Campo label="CEP" erro={f.erros.cep}><input name="cep" className="input" value={f.v.cep} onChange={f.onChange('cep')} /></Campo>
            <Campo label="Bairro"><input name="bairro" className="input" value={f.v.bairro} onChange={f.onChange('bairro')} /></Campo>
            <Campo label="Cidade"><input name="cidade" className="input" value={f.v.cidade} onChange={f.onChange('cidade')} /></Campo>
            <Campo label="Estado"><input name="estado" className="input" value={f.v.estado} onChange={f.onChange('estado')} /></Campo>
          </div>
        </>
      )}
      {perfil.papel === 'NUTRICIONISTA' && (
        <Campo label="CRN" erro={f.erros.crn}><input name="crn" className="input" maxLength={20} value={f.v.crn} onChange={(e) => f.set('crn')(mascaraCRN(e.target.value))} /></Campo>
      )}
      {perfil.papel === 'CHEF' && (
        <Campo label="Especialização" erro={f.erros.especializacao}>
          <select name="especializacao" className="input" value={f.v.especializacao} onChange={f.onChange('especializacao')}><option value="">Selecione</option><Opcoes mapa={ENUMS.especializacao} /></select>
        </Campo>
      )}
      <Campo label="Bio (até 500)" erro={f.erros.bio} dica={`${f.v.bio.length} / 500`}><textarea name="bio" className="input" rows={4} maxLength={500} value={f.v.bio} onChange={f.onChange('bio')} /></Campo>
      <button className="btn-primary">Salvar perfil</button>
    </form>
  )
}

export default function Portal() {
  useSeo({ titulo: 'Meu perfil profissional' })
  const { usuario, perfil, carregandoPerfil } = useAuth()
  return (
    <Protegida>
      {carregandoPerfil ? (
        <Carregando texto="Carregando seu perfil" />
      ) : !perfil ? (
        <EstadoVazio titulo="Você ainda não tem perfil profissional" texto="Crie um perfil de chef, nutricionista ou restaurante." acao={{ to: '/onboarding', rotulo: 'Criar perfil' }} />
      ) : (
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="card flex items-center gap-4 p-5">
            <Avatar className="h-16 w-16" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-terra">{nomes[perfil.papel]}</p>
              <h1 className="truncate font-display text-2xl font-extrabold">{perfil.papel === 'RESTAURANTE' ? perfil.dados.nome : usuario?.username}</h1>
              <p className="text-xs text-ink-faint">Perfil ativo e visível nas listas públicas.</p>
            </div>
            {perfil.papel === 'CHEF' && <Link to="/publicar" className="btn-primary">Nova receita</Link>}
          </div>
          <section className="card space-y-4 p-5">
            <h2 className="text-lg font-bold">Editar perfil</h2>
            <Formulario key={perfil.papel} perfil={perfil} />
          </section>
        </div>
      )}
    </Protegida>
  )
}
