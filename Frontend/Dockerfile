# Monta o front e serve os arquivos com o Caddy (usado no deploy da AWS, ver deploy/aws).

# Fase 1: gera a pasta dist com o mesmo Node do CI.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Na AWS a API fica no mesmo endereço do site, em /api. Esta variável vale mais que o .env.production.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Fase 2: só o Caddy e os arquivos prontos. A configuração vem de deploy/aws/caddy.
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
