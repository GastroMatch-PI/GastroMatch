# Checklist de responsividade

Breakpoints usados (Tailwind): **360 px** (celular), **768 px** (`md`) e **1200 px** (`xl`/container máximo de 72rem).

Teste manual feito no navegador, medindo `document.documentElement.scrollWidth` contra `innerWidth` em 360 px.

| Rota | 360 px sem rolagem horizontal |
|---|---|
| `/` | ok |
| `/receitas` | ok |
| `/receita/:id` | ok |
| `/restaurantes` | ok |
| `/profissionais` | ok |
| `/publicar` | ok |
| `/onboarding` | ok (rótulos das abas reduzidos no celular) |
| `/painel` | ok |
| `/login` | ok |

Como repetir: abrir a rota com a janela em 360 px e rodar `document.documentElement.scrollWidth <= innerWidth` no console.

Pendências: testar em aparelho real (iOS Safari e Android Chrome) e em 768 px e 1200 px de forma sistemática.
