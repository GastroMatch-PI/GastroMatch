# Rodar o backend localmente (PostgreSQL)

O banco do projeto é **PostgreSQL**. Existem dois jeitos de usar, e você escolhe só um:

| Jeito | Quando usar |
|---|---|
| **A. Supabase** (banco do time, na nuvem) | Dia a dia: todo mundo vê os mesmos dados |
| **B. Docker** (banco só seu, no seu PC) | Testar sem mexer nos dados do time |

Nos dois casos a API lê a conexão do arquivo **`Backend/.env`**. Você não precisa digitar variáveis no terminal.

## 1. Instalar (uma vez por PC)

- **Java 21 ou superior** (JDK). Confira com `java -version`. O `./mvnw` exige a variável `JAVA_HOME` apontando para a pasta do JDK (veja "Problemas comuns").
- **Docker Desktop** (https://www.docker.com/products/docker-desktop), só se for usar o jeito B.

## 2. Criar o seu `.env` (uma vez por PC)

Na pasta `Backend`:

```powershell
Copy-Item .env.example .env
```

Abra o `.env` e preencha conforme o jeito escolhido (o `.env.example` explica cada linha). O `.env` **não vai para o GitHub**: nunca cole a senha do banco em commits, issues ou no grupo. Quem criou o projeto no Supabase passa a senha no privado.

Para gerar o `JWT_SECRET` (segredo que assina os logins, cada pessoa tem o seu):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }) -as [byte[]])
```

## Jeito A: Supabase

### A1. Quem cria o projeto (só uma pessoa do time, uma vez)

1. Entre em https://supabase.com, crie um projeto e escolha a região **South America (São Paulo)**. Guarde a senha do banco.
2. Abra **SQL Editor**, cole todo o conteúdo de `Data/Modelagem/GastroDB_v2.0.0_postgres.sql` e rode. Depois faça o mesmo com `Data/Modelagem/GastroDB_dados_exemplo.sql` (opcional, são as receitas de exemplo).
3. Em **Table Editor**, confira: 13 tabelas, todas com o selo **RLS enabled**.
4. Em **Connect > Session pooler**, copie host, porta e usuário (`postgres.<id-do-projeto>`).

> **Use o Session pooler.** A conexão direta usa IPv6 e falha em muitas redes. O Transaction pooler (porta 6543) também não serve para esta API.

### A2. Cada pessoa do time

No `.env`, preencha `DB_URL`, `DB_USERNAME` e `DB_PASSWORD` (as linhas da "Opção 1" do `.env.example`) e o seu `JWT_SECRET`.

> **Plano grátis do Supabase:** o projeto **pausa após 7 dias sem acesso**. Se a API não conectar, entre no painel e clique em *Restore project*. Antes de qualquer apresentação, confira com um dia de antecedência.

## Jeito B: Docker local

Abra o **Docker Desktop** e espere ele ficar verde ("Engine running"). No `.env`, deixe só `DB_PASSWORD` e `JWT_SECRET` (a URL padrão já aponta para o Docker). Depois:

```powershell
docker compose up -d
docker compose ps
```

Na primeira vez ele baixa o PostgreSQL e cria as **13 tabelas** (as 12 do modelo mais a `refresh_token`) e os dados de exemplo. Aguarde uns 20 segundos. Para conferir:

```powershell
docker exec gastromatch-postgres psql -U postgres -d gastromatch -c "\dt"
```

## 3. Subir a API

```powershell
./mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
```

A API fica em http://localhost:8080 e o Swagger em http://localhost:8080/swagger-ui.html (só no profile `dev`).

## Perfis (dev, test, prod)

| Profile | Quando é usado | O que muda |
|---|---|---|
| `dev` | No seu PC, no dia a dia (`-Dspring-boot.run.profiles=dev`) | Swagger ligado (`/swagger-ui.html`) e log de SQL |
| `test` | Automático nos testes (`Backend/src/test/resources/application.properties` ativa sozinho) | Swagger desligado, sem log de SQL, job de limpeza (B25) desligado |
| `prod` | No ar (o Dockerfile já ativa) | Sem log de SQL, log em INFO, encerramento gracioso |

Nenhum profile tem segredo fixo: todos leem `DB_PASSWORD` e `JWT_SECRET` de variável de ambiente (ou do `.env`). Se `JWT_SECRET` tiver menos de 32 caracteres, a API se recusa a subir em qualquer profile (`JwtService`), não só em prod.

## Variáveis de ambiente

Todas ficam no `.env` (veja `.env.example`); nenhuma tem valor real no repositório.

| Variável | Obrigatória | Padrão | Para quê |
|---|---|---|---|
| `DB_URL` | Não | Postgres do Docker local | Endereço JDBC do banco (Supabase ou Docker) |
| `DB_USERNAME` | Não | `postgres` | Usuário do banco |
| `DB_PASSWORD` | **Sim** | — | Senha do banco |
| `JWT_SECRET` | **Sim** | — | Assina os tokens de login; precisa de 32+ caracteres |
| `CORS_ORIGINS` | Não | `http://localhost:5173` | Endereço(s) do front liberados no CORS |
| `UPLOADS_DIR` | Não | `uploads` | Pasta onde ficam as imagens enviadas (sem Supabase Storage) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET` | Não | — (usa o disco) | Guardar imagens no Supabase Storage em produção |
| `PORT` | Não | `8080` | Porta da API (o host define a dele) |

## Comandos do dia a dia (Docker)

| O que | Comando |
|---|---|
| Ligar o banco | `docker compose up -d` |
| Desligar (mantém os dados) | `docker compose stop` |
| Ver logs | `docker compose logs -f postgres` |
| **Apagar tudo e recriar do zero** | `docker compose down -v` e depois `docker compose up -d` |
| Rodar os testes que não precisam de banco | `./mvnw -Dtest='!ApplicationTests' test` |

Use o `down -v` sempre que o `GastroDB_v2.0.0_postgres.sql` mudar: o script só roda quando o banco é criado. No Supabase, mudanças no esquema são aplicadas à mão no SQL Editor (e o time avisa no grupo).

## Dados de exemplo

O banco nasce com 18 ingredientes e 5 receitas (`Data/Modelagem/GastroDB_dados_exemplo.sql`), para testar `GET /receitas` sem cadastrar nada. O chef de exemplo não tem conta, então ninguém loga como ele. O script pode rodar mais de uma vez sem duplicar nada.

## O que mudou do MySQL para o PostgreSQL

O esquema antigo está em `Data/Modelagem/legado-mysql/`, só como referência. Resumo: `ENUM` virou `VARCHAR` + `CHECK`, as datas são `TIMESTAMPTZ`, o `atualizado_em` é mantido por um gatilho, e a busca por receitas e ingredientes ignora acento (extensão `unaccent`).

## Problemas comuns

- **`JAVA_HOME environment variable is not defined correctly`**: aponte para a pasta do seu JDK, por exemplo `$env:JAVA_HOME = "C:\Users\SEU_USUARIO\.jdks\openjdk-21"`.
- **`Could not resolve placeholder 'DB_PASSWORD'` ou `'JWT_SECRET'`**: o `.env` não existe, não está na pasta `Backend`, ou falta essa linha. Rode a API a partir da pasta `Backend`.
- **`password authentication failed`**: senha errada no `.env`. No Docker, se mudou a senha depois de criar o banco, rode `docker compose down -v` e suba de novo.
- **`Connection refused` / `UnknownHost`**: no Docker, o container não está rodando (`docker compose ps`); no Supabase, confira o `DB_URL` e se o projeto não está pausado.
- **`Schema-validation: wrong column type` / `missing table`**: o banco não tem o esquema atual. Rode o `GastroDB_v2.0.0_postgres.sql` de novo (é seguro) ou recrie o Docker com `down -v`.
- **`error during connect ... docker_engine`**: o Docker Desktop não está aberto.
- **Porta 5432 em uso**: tem outro PostgreSQL no PC. Pare-o ou mude `"5432:5432"` para `"5433:5432"` no `docker-compose.yml` e ponha `DB_URL=jdbc:postgresql://localhost:5433/gastromatch` no `.env`.
