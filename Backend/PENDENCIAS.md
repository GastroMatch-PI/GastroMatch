# Pendências do backend

Coisas combinadas para fazer depois, fora do que já está nos PRs.

## CORS para o front no ar

**O que é:** o navegador bloqueia um site de chamar uma API de outro endereço, a menos que a API diga que aquele endereço pode.

**Situação:** `app.cors.allowed-origins` (em `src/main/resources/application.properties`) aceita só `http://localhost:5173`, que é o front rodando no PC de quem desenvolve.

**O que fazer quando o front for para o ar (ex.: Vercel):**

1. Pegar o endereço real do front, por exemplo `https://gastromatch.vercel.app`.
2. Acrescentar esse endereço em `app.cors.allowed-origins`, separado por vírgula do `http://localhost:5173`. O `CorsConfig` já aceita uma lista.
3. Se não quiser fixar no código, ler o valor de uma variável de ambiente no deploy.
4. Testar abrindo o front publicado e conferindo no console do navegador que não aparece erro de CORS.

Sem isso, as chamadas do front publicado são bloqueadas pelo navegador, mesmo com a API funcionando.
