import { useEffect } from 'react'

type Seo = { titulo: string; descricao?: string; imagem?: string; jsonLd?: object | null }

function meta(attr: 'name' | 'property', chave: string, valor: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${chave}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, chave)
    document.head.appendChild(el)
  }
  el.content = valor
}

const SITE = 'GastroMatch'
const DESC_PADRAO = 'Receitas de chefs, nutricionistas e restaurantes. Cozinhe o que você já tem em casa.'

/** Título e descrição únicos por rota, Open Graph, Twitter Card e JSON-LD (SPA). */
export function useSeo({ titulo, descricao = DESC_PADRAO, imagem, jsonLd }: Seo) {
  useEffect(() => {
    const t = titulo === SITE ? SITE : `${titulo} · ${SITE}`
    document.title = t
    meta('name', 'description', descricao)
    meta('property', 'og:title', t)
    meta('property', 'og:description', descricao)
    meta('property', 'og:type', jsonLd ? 'article' : 'website')
    meta('property', 'og:url', location.href)
    meta('name', 'twitter:card', imagem ? 'summary_large_image' : 'summary')
    meta('name', 'twitter:title', t)
    meta('name', 'twitter:description', descricao)
    if (imagem) {
      meta('property', 'og:image', imagem)
      meta('name', 'twitter:image', imagem)
    }
    const antigo = document.getElementById('jsonld-rota')
    antigo?.remove()
    if (jsonLd) {
      const s = document.createElement('script')
      s.id = 'jsonld-rota'
      s.type = 'application/ld+json'
      s.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(s)
    }
    return () => document.getElementById('jsonld-rota')?.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titulo, descricao, imagem, JSON.stringify(jsonLd)])
}
