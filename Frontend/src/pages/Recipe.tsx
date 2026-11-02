import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Photo, { Avatar } from '../components/Photo'
import Stars from '../components/Stars'
import { baseIngredients, comments as seedComments, steps } from '../data/data'
import { useLocalState } from '../hooks/useLocalState'

const BASE_SERVINGS = 4

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

function StepTimer({ label, seconds }: { label: string; seconds: number }) {
  const [left, setLeft] = useState(seconds)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((l) => (l <= 1 ? 0 : l - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  const done = left === 0
  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs">
      <span aria-hidden>⏰</span>
      {label}
      <button
        className="rounded bg-terra px-2 py-1 font-semibold text-white"
        onClick={() => {
          if (done) setLeft(seconds)
          setRunning(!running || done)
        }}
      >
        {done ? '↺ Reiniciar' : running ? `⏸ ${clock(left)}` : `▶ Iniciar Timer ${clock(left)}`}
      </button>
    </div>
  )
}

export default function Recipe() {
  const [servings, setServings] = useState(BASE_SERVINGS)
  const [checked, setChecked] = useState<string[]>([])
  const [doneSteps, setDoneSteps] = useState<number[]>([])
  const [listed, setListed] = useState(false)
  const [following, setFollowing] = useState(false)
  const [guided, setGuided] = useState<number | null>(null)
  const [thumb, setThumb] = useState(0)
  const [comments, setComments] = useLocalState('gm-comments', seedComments)
  const [text, setText] = useState('')
  const [rating, setRating] = useState(0)

  const factor = servings / BASE_SERVINGS
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])

  if (guided !== null) {
    const s = steps[guided]
    return (
      <div className="fixed inset-0 z-30 flex flex-col bg-ink p-6 text-white">
        <div className="flex items-center justify-between text-sm">
          <span>Modo Cozinhar Guiado • Passo {guided + 1} de {steps.length}</span>
          <button className="rounded bg-white/10 px-3 py-1.5" onClick={() => setGuided(null)}>✕ Sair</button>
        </div>
        <div className="mx-auto flex max-w-3xl flex-1 flex-col justify-center gap-6">
          <h2 className="text-4xl font-extrabold">{s.title}</h2>
          <p className="text-xl leading-relaxed text-white/85">{s.text}</p>
          <div className="text-ink"><StepTimer key={guided} label={s.timer} seconds={s.seconds} /></div>
        </div>
        <div className="flex justify-between">
          <button className="btn-ghost" disabled={guided === 0} onClick={() => setGuided(guided - 1)}>← Anterior</button>
          {guided < steps.length - 1 ? (
            <button className="btn-primary" onClick={() => setGuided(guided + 1)}>Próximo →</button>
          ) : (
            <button className="btn-primary" onClick={() => setGuided(null)}>Finalizar ✓</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <nav className="text-xs text-ink-faint">
        <Link to="/" className="hover:text-terra">Receitas</Link> › Pratos Principais › Risoto de Cogumelos Frescos
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          <Photo emoji={steps[thumb % steps.length].emoji} seed={steps[thumb % steps.length].seed} className="aspect-video w-full rounded-2xl">
            <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
              Hospedagem Nativa GastroMatch
            </span>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-terra text-2xl text-white">▶</span>
            <span className="absolute bottom-3 left-3 text-xs text-white drop-shadow">
              ⏱ 04:12 / 10:45 • Capítulo: Refogando os Cogumelos
            </span>
          </Photo>
          <div className="grid grid-cols-5 gap-2">
            {[...steps.map((s, i) => ({ ...s, label: `P.${i + 1}` })), { emoji: '🍽️', seed: 4, label: 'Final' }].map((t, i) => (
              <button
                key={t.label}
                onClick={() => setThumb(i)}
                aria-label={`Ver ${t.label}`}
                className={`overflow-hidden rounded-lg border-2 ${thumb === i ? 'border-terra' : 'border-transparent'}`}
              >
                <Photo emoji={t.emoji} seed={t.seed} className="aspect-[4/3] w-full [&>span]:text-2xl">
                  <span className="absolute bottom-0.5 right-1 !text-[10px] font-bold text-white">{t.label}</span>
                </Photo>
              </button>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card space-y-3 p-5">
            <h1 className="text-2xl font-extrabold leading-tight">Risoto de Cogumelos Frescos com Azeite Trufado e Tomilho Limão</h1>
            <p className="flex flex-wrap items-center gap-2 text-xs">
              <Stars value={5} /> <b>4.9</b>
              <span className="underline">182 avaliações da comunidade</span> • 🔖 1.4k salvos
            </p>
            <div className="flex items-center gap-2 rounded-xl bg-peach p-3 text-xs">
              <Avatar emoji="👨‍🍳" className="h-9 w-9" />
              <div className="flex-1">
                <b>Chef Henrique Faria</b>{' '}
                <span className="rounded bg-gold-soft px-1.5 py-0.5 text-[10px] text-gold">✪ Verificado</span>
                <p className="text-ink-faint">Especialista em risotos e culinária mediterrânea</p>
              </div>
              <button className="btn-ghost !px-3 !py-1 text-xs" onClick={() => setFollowing(!following)}>
                {following ? 'Seguindo' : 'Seguir'}
              </button>
            </div>
            <div className="rounded-xl border border-line p-3 text-xs">
              <p className="font-semibold text-terra">Foco Sem Distrações</p>
              <p className="text-ink-soft">Mantém a tela sempre acesa, comandos de voz para avançar e cronômetros integrados.</p>
            </div>
            <button className="btn-primary w-full" onClick={() => setGuided(0)}>
              Iniciar Modo Cozinhar Guiado →
            </button>
          </div>
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="card space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold">Ingredientes Frescos</h2>
              <p className="text-xs text-ink-faint">Calibrado com precisão pelo Chef Henrique</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-peach px-2 py-1 text-xs">
              Rendimento:
              <button aria-label="Menos porções" className="h-6 w-6 rounded bg-white font-bold" onClick={() => setServings(Math.max(1, servings - 1))}>−</button>
              <b className="text-terra">{servings}</b> porções
              <button aria-label="Mais porções" className="h-6 w-6 rounded bg-white font-bold" onClick={() => setServings(Math.min(20, servings + 1))}>+</button>
            </div>
          </div>
          <ul className="divide-y divide-line">
            {baseIngredients.map((i) => (
              <li key={i.name}>
                <label className="flex cursor-pointer items-center gap-3 py-2.5 text-sm">
                  <input type="checkbox" checked={checked.includes(i.name)} onChange={() => setChecked(toggle(checked, i.name))} />
                  <span className={`flex-1 ${checked.includes(i.name) ? 'text-ink-faint line-through' : ''}`}>{i.name}</span>
                  <b className="text-xs">{i.unit === 'maço' ? `${Math.max(1, Math.round(i.qty * factor))} maço` : `${fmt(i.qty * factor)}${i.unit}`}</b>
                </label>
              </li>
            ))}
          </ul>
          <button
            className="w-full rounded-lg bg-leaf-soft py-2.5 text-xs font-semibold text-leaf"
            onClick={() => setListed(true)}
          >
            {listed ? '✓ Ingredientes adicionados à lista' : '🛒 Adicionar ingredientes à Minha Lista de Compras'}
          </button>
        </section>

        <div className="space-y-4">
          <section className="card space-y-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">Tabela Nutricional</h2>
                <p className="text-[11px] text-ink-faint">Estimativa por porção servida (~250g)</p>
              </div>
              <span className="rounded-full bg-leaf-soft px-2 py-1 text-[10px] font-semibold text-leaf">Validado por Nutricionista</span>
            </div>
            <p className="flex items-center justify-between rounded-lg bg-peach px-3 py-2 text-sm">
              Valor Energético Total <b className="font-display text-2xl text-terra">420 <small className="text-xs">kcal / porção</small></b>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Carboidratos', '58g', 'bg-gold', 'w-3/5'],
                ['Proteínas', '12g', 'bg-leaf', 'w-1/4'],
                ['Gorduras Totais', '14g', 'bg-terra', 'w-1/3'],
                ['Fibras Alimentares', '3.5g', 'bg-leaf', 'w-1/5'],
              ].map(([n, v, c, w]) => (
                <div key={n} className="rounded-lg border border-line p-2">
                  <p className="flex justify-between"><span className="text-ink-soft">{n}</span><b>{v}</b></p>
                  <div className="mt-1 h-1 rounded bg-peach"><div className={`h-1 rounded ${c} ${w}`} /></div>
                </div>
              ))}
            </div>
            <p className="flex justify-between text-[10px] text-ink-faint"><span>Sódio: 410mg</span><span>Cálcio: 110mg</span><span>Índice Glicêmico: Médio</span></p>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-bold">💡 Dicas do Chef & Segredos</h2>
            <div className="rounded-lg border-l-4 border-alert bg-alert-soft p-3 text-xs">
              <p className="font-bold text-alert">⚠ Alerta de Erro Comum</p>
              <p><b>Nunca utilize caldo em temperatura ambiente ou gelado.</b> O choque térmico paralisa a liberação de amido do arroz, resultando em grãos empapados por fora e crus por dentro.</p>
            </div>
            <div className="rounded-lg border-l-4 border-gold bg-gold-soft p-3 text-xs">
              <p className="font-bold text-gold">💡 O Ponto do Mantecare</p>
              <p>Desligue o fogo 1 minuto antes do grão ficar al dente. A manteiga precisa estar bem gelada para emulsificar com o amido e garantir a cremosidade <i>all’onda</i>.</p>
            </div>
          </section>
        </div>
      </div>

      <section className="card space-y-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase text-terra">Execução Profissional</p>
            <h2 className="text-2xl font-bold">Passo a Passo Guiado</h2>
          </div>
          <p className="text-xs text-leaf">✔ {doneSteps.length}/{steps.length} etapas • Marque os passos concluídos</p>
        </div>
        {steps.map((s, i) => (
          <article key={s.title} className={`grid gap-4 rounded-xl border border-line bg-cream p-4 md:grid-cols-[1fr_160px] ${doneSteps.includes(i) ? 'opacity-60' : ''}`}>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terra text-sm font-bold text-white">{i + 1}</span>
                <h3 className="flex-1 text-base font-bold">{s.title}</h3>
                <label className="flex items-center gap-1 text-[11px] text-ink-faint">
                  <input type="checkbox" checked={doneSteps.includes(i)} onChange={() => setDoneSteps(toggle(doneSteps, i))} /> Concluído
                </label>
              </div>
              <p className="text-sm text-ink-soft">{s.text}</p>
              <StepTimer label={s.timer} seconds={s.seconds} />
            </div>
            <Photo emoji={s.emoji} seed={s.seed} className="h-28 w-full rounded-lg md:h-full" />
          </article>
        ))}
      </section>

      <section className="card space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold">Comentários e Avaliações da Comunidade</h2>
            <p className="text-xs text-ink-faint">Compartilhe suas adaptações, fotos e experiências de preparo</p>
          </div>
          <button className="btn-primary text-xs" onClick={() => document.getElementById('novo-comentario')?.focus()}>
            ✎ Avaliar Receita
          </button>
        </div>
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return
            setComments([{ name: 'Você', where: 'Neste navegador', when: 'Agora', text: text.trim(), useful: 0 }, ...comments])
            setText('')
            setRating(0)
          }}
        >
          <Avatar emoji="EU" className="h-9 w-9 text-xs font-bold text-terra" />
          <div className="flex-1 space-y-2">
            <textarea
              id="novo-comentario"
              className="input h-20"
              placeholder="Você fez essa receita? Conte para o Chef Henrique e para a comunidade como ficou..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                Sua nota:
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" aria-label={`${n} estrelas`} onClick={() => setRating(n)} className={n <= rating ? 'text-gold' : 'text-line'}>★</button>
                ))}
              </span>
              <button className="btn-ghost !py-1.5 text-xs">Publicar Avaliação</button>
            </div>
          </div>
        </form>
        {comments.map((c, i) => (
          <article key={`${c.name}-${i}`} className="rounded-xl border border-line bg-cream p-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar emoji="🙂" className="h-9 w-9" />
              <div className="flex-1 text-xs">
                <b className="text-sm">{c.name}</b>
                <p className="text-ink-faint">{c.where} • {c.when}</p>
              </div>
              <Stars value={5} className="text-xs" />
            </div>
            <p className="mt-2 text-ink-soft">{c.text}</p>
            <p className="mt-2 flex gap-4 text-[11px] text-ink-faint">
              <button onClick={() => setComments(comments.map((x, j) => (j === i ? { ...x, useful: x.useful + 1 } : x)))}>
                👍 Útil ({c.useful})
              </button>
              <span>↩ Responder</span>
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}
