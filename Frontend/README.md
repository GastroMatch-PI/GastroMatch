# GastroMatch — Frontend

Interface web do GastroMatch em **React 19 + Vite + TypeScript**, estilizada com **Tailwind CSS 4** e roteada com **React Router**.
Baseada no design do Stitch ("GastroMatch Culinary Discovery Platform").

## Telas

| Rota | Tela |
|---|---|
| `/` | Home & Descoberta — busca por ingredientes da geladeira, coleções, receitas em destaque, listas locais e cardápio da semana |
| `/profissionais` | Diretório de Chefs, Nutricionistas & Restaurantes — filtros, kits, mini mapa e reels |
| `/portal` | Portal & Onboarding do Profissional — status da conta, métricas e edição de perfil |
| `/receita/:id` | Detalhe da Receita — ajuste de porções, passo a passo com timers, Modo Cozinhar Guiado e comentários |

## Como rodar

```bash
npm install
npm run dev
```

Outros comandos: `npm run build` (checa os tipos e gera `dist/`) e `npm run preview`.

## Observações

- As listas (compras e cardápio), o perfil do profissional e os comentários ficam no `localStorage` do navegador, sem login.
- Os dados de receitas e profissionais são mockados em `src/data/data.ts`; ainda não há integração com o Backend.
- As fotos são placeholders (gradiente + emoji) até as imagens reais estarem disponíveis.
- `vercel.json` redireciona todas as rotas para `index.html`, necessário para o roteamento no deploy.
