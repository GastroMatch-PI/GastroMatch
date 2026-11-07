import { useCallback, useEffect, useRef, useState } from 'react'
import type { Recipe } from '../data/data'
import { adaptarResumo, extrairPagina, listarReceitas, type FiltrosReceita, type ReceitaResumoDto } from './receitas'

export function useReceitasApi(filtros: FiltrosReceita, tamanho = 12) {
  const [receitas, setReceitas] = useState<Recipe[]>([])
  const [pagina, setPagina] = useState(0)
  const [temMais, setTemMais] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const chave = JSON.stringify(filtros)
  // Sobe a cada nova busca; respostas de buscas antigas (inclusive "carregar mais") são descartadas.
  const geracao = useRef(0)

  useEffect(() => {
    let ativo = true
    const minha = ++geracao.current
    setCarregando(true)
    setErro('')

    const t = setTimeout(() => {
      listarReceitas({ ...filtros, pagina: 0, tamanho })
        .then((bruto) => {
          if (!ativo || minha !== geracao.current) return
          const p = extrairPagina<ReceitaResumoDto>(bruto)
          setReceitas(p.itens.map(adaptarResumo))
          setPagina(0)
          setTemMais(p.paginaAtual + 1 < p.totalPaginas)
        })
        .catch((e) => {
          if (ativo && minha === geracao.current) setErro((e as Error).message)
        })
        .finally(() => {
          if (ativo && minha === geracao.current) setCarregando(false)
        })
    }, 300)

    return () => {
      ativo = false
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, tamanho])

  const carregarMais = useCallback(() => {
    const prox = pagina + 1
    const minha = geracao.current
    listarReceitas({ ...filtros, pagina: prox, tamanho })
      .then((bruto) => {
        if (minha !== geracao.current) return // o filtro mudou enquanto esta página carregava
        const p = extrairPagina<ReceitaResumoDto>(bruto)
        setReceitas((l) => [...l, ...p.itens.map(adaptarResumo)])
        setPagina(prox)
        setTemMais(p.paginaAtual + 1 < p.totalPaginas)
      })
      .catch((e) => {
        if (minha === geracao.current) setErro((e as Error).message)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, pagina, tamanho])

  return { receitas, carregando, erro, temMais, carregarMais }
}