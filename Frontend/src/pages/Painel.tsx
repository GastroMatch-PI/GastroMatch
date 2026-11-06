import { Eye, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useConfirmar, useToast } from '../components/Feedback'
import Protegida from '../components/Protegida'
import { EstadoVazio } from '../components/Ui'
import { useAuth } from '../context/Auth'
import type { Recipe } from '../data/data'
import { useLocalState } from '../hooks/useLocalState'
import { fmtNum } from '../lib/format'
import { useSeo } from '../lib/seo'
import { useFavoritos, useNotas, useRecipes } from '../lib/useRecipes'

export default function Painel() {
  useSeo({ titulo: 'Painel do chef' })
  const { usuario, meusPerfis } = useAuth()
  const toast = useToast()
  const confirmar = useConfirmar()
  const todas = useRecipes(true)
  const [, setReceitas] = useLocalState<Recipe[]>('gm-receitas', [])
  const notaDe = useNotas()
  const { contar } = useFavoritos()
  const [busca, setBusca] = useState('')

  const chef = meusPerfis.find((p) => p.papel === 'CHEF' && p.status === 'APROVADO')
  const minhas = todas.filter((r) => r.owner === usuario?.id)
  const lista = minhas.filter((r) => r.title.toLowerCase().includes(busca.toLowerCase()))
  const ativas = minhas.filter((r) => !r.deleted)
  const avaliadas = ativas.map((r) => notaDe(r.id)).filter((n) => n.total > 0)
  const mediaGeral = avaliadas.length ? avaliadas.reduce((a, n) => a + n.media, 0) / avaliadas.length : 0
  const favTotal = ativas.reduce((a, r) => a + contar(r.id), 0)

  const excluir = async (r: Recipe) => {
    if (await confirmar({ titulo: 'Excluir receita?', texto: `“${r.title}” sai do site. Você pode restaurá-la aqui.`, confirmar: 'Excluir', perigo: true })) {
      setReceitas((l) => l.map((x) => (x.id === r.id ? { ...x, deleted: true } : x)))
      toast.sucesso('Receita excluída.')
    }
  }
  const restaurar = (r: Recipe) => { setReceitas((l) => l.map((x) => (x.id === r.id ? { ...x, deleted: false } : x))); toast.sucesso('Receita restaurada.') }

  return (
    <Protegida>
      {!chef ? (
        <EstadoVazio titulo="Só chefs aprovados acessam o painel" texto="Crie seu perfil de chef para gerenciar receitas." acao={{ to: '/onboarding', rotulo: 'Criar perfil de chef' }} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-extrabold">Painel do chef</h1>
            <Link to="/publicar" className="btn-primary"><Plus size={16} /> Nova receita</Link>
          </div>

          <dl className="grid gap-3 sm:grid-cols-3">
            {[['Receitas publicadas', String(ativas.length)], ['Nota média geral', avaliadas.length ? fmtNum(mediaGeral) : '—'], ['Favoritos recebidos', String(favTotal)]].map(([t, v]) => (
              <div key={t} className="card p-4"><dt className="text-xs font-semibold text-ink-soft">{t}</dt><dd className="mt-1 font-display text-3xl font-extrabold">{v}</dd></div>
            ))}
          </dl>

          <input className="input max-w-sm" placeholder="Buscar por nome" aria-label="Buscar receita" value={busca} onChange={(e) => setBusca(e.target.value)} />

          {minhas.length === 0 ? (
            <EstadoVazio titulo="Você ainda não publicou receitas" texto="Publique a primeira e ela aparece na Home e na lista de receitas." acao={{ to: '/publicar', rotulo: 'Criar receita' }} />
          ) : lista.length === 0 ? (
            <EstadoVazio titulo="Nenhuma receita com esse nome" />
          ) : (
            <ul className="space-y-3">
              {lista.map((r) => {
                const n = notaDe(r.id)
                return (
                  <li key={r.id} className={`card flex flex-wrap items-center gap-3 p-4 ${r.deleted ? 'opacity-60' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold [overflow-wrap:anywhere]">{r.title}</p>
                      <p className="text-xs text-ink-faint">
                        <span className={`mr-2 rounded-full px-2 py-0.5 font-semibold ${r.deleted ? 'bg-alert-soft text-alert' : 'bg-leaf-soft text-leaf'}`}>{r.deleted ? 'Excluída' : 'Publicada'}</span>
                        Nota {n.total ? fmtNum(n.media) : '—'} ({n.total}) · {contar(r.id)} favoritos
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!r.deleted && <Link aria-label={`Ver ${r.title}`} to={`/receita/${r.id}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-line hover:text-terra"><Eye size={16} /></Link>}
                      {!r.deleted && <Link aria-label={`Editar ${r.title}`} to={`/receita/${r.id}/editar`} className="flex h-10 w-10 items-center justify-center rounded-full border border-line hover:text-terra"><Pencil size={16} /></Link>}
                      {!r.deleted && <button aria-label={`Excluir ${r.title}`} onClick={() => excluir(r)} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-line text-alert"><Trash2 size={16} /></button>}
                      {r.deleted && <button aria-label={`Restaurar ${r.title}`} onClick={() => restaurar(r)} className="btn-ghost !py-2 text-xs"><RotateCcw size={14} /> Restaurar</button>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </Protegida>
  )
}
