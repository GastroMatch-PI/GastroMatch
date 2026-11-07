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

## API

O front usa a API real (Backend/Readme.md, seção 3). O endereço fica em `VITE_API_URL`:

- `npm run dev`: lê o `.env.local` (copie o `.env.example`). Para usar o back local, aponte para `http://localhost:8080`.
- `npm run build`: lê o `.env.production` (API no Render).

O cliente está em `src/lib/api.ts`: coloca o `Authorization`, lê o erro `{ status, mensagem, erros }` e renova o token em `/auth/refresh` quando vem 401. O access token fica só em memória; o refresh token fica no `localStorage` (chave `gm-refresh-token`), para a sessão sobreviver a recarregar a página.

O Render grátis dorme: a primeira chamada pode levar uns 40 segundos, e as telas avisam isso.

## Observações

- O CORS da API só libera `http://localhost:5173`. Para o site publicado funcionar, o endereço dele precisa entrar em `app.cors.allowed-origins` (ver `Backend/PENDENCIAS.md`).
- A API ainda não tem: trocar senha, sessões, aprovação de profissional, denúncia de comentário, vínculo chef-restaurante, receitas de um chef, nota média e imagem de restaurante. As telas que dependiam disso foram removidas.
- `vercel.json` redireciona todas as rotas para `index.html`, necessário para o roteamento no deploy.
