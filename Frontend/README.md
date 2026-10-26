# GastroMatch — Frontend

Interface web do GastroMatch em **React 19 + Vite + TypeScript**, com **Tailwind CSS 4**, **React Router** e ícones **lucide-react**.
O visual segue o projeto do Stitch ("GastroMatch Culinary Discovery Platform"), refeito com tipografia Poppins e fotos do Unsplash.

## Como rodar

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # confere os tipos e gera dist/
npm run preview   # serve o build gerado
npm run lint      # oxlint
```

## Telas

| Rota | Tela |
|---|---|
| `/` | Início: receita da semana, busca por ingredientes da geladeira, receitas com filtro por coleção, listas locais e destaques |
| `/profissionais` | Chefs, nutricionistas e restaurantes: filtros, kits, contato, mapa e vídeos da comunidade |
| `/portal` | Portal do profissional: status da conta, métricas e edição do perfil |
| `/receita/:id` | Receita: galeria, ingredientes com ajuste de porções, tabela nutricional, modo de preparo com cronômetros, modo cozinhar e avaliações |
| `*` | Página não encontrada |

## Estrutura

```
src/
  components/   Header, Footer, RecipeCard, Img, Avatar, Stars, NotFound...
  pages/        Home, Directory, Portal, Recipe (uma por rota)
  data/         dados mockados (receitas, profissionais, vídeos, comentários)
  lib/          store.ts (estado no localStorage), lists.ts, comments.ts, format.ts
  index.css     tokens do tema e classes base (.btn, .field, .card, .wrap)
```

- Componentes em PascalCase, um por arquivo.
- Estado compartilhado (lista de compras, cardápio da semana, receitas salvas, ingredientes marcados, avaliações e perfil)
  fica no `localStorage`, sem login. Veja `src/lib/store.ts`.
- Os dados ainda são mockados em `src/data/data.ts`; não há integração com o Backend.

## Guia de estilo

Os tokens ficam em `src/index.css`, dentro de `@theme`, e viram variáveis CSS e classes do Tailwind.

| Token | Valor | Uso |
|---|---|---|
| `--font-sans` | Poppins 400, 500 e 600 | todo o texto |
| `ink` / `soft` / `faint` | `#1f1a17` / `#5c544d` / `#8a8179` | texto principal, secundário e de apoio |
| `line` / `surface` | `#ebe5de` / `#faf7f4` | bordas e fundos suaves |
| `brand` | `#b4471d` | ações principais e destaques |
| `leaf` | `#2f6f4a` | validação e sucesso |
| `gold` / `alert` | `#c28a1b` / `#b42318` | notas, dicas e avisos |

## Deploy

O `vercel.json` redireciona todas as rotas para `index.html`, necessário para o roteamento no navegador.
No Vercel, use `Frontend` como Root Directory.
