# GastroMatch: relatório da sessão (para continuar em outra sessão)

Data: 2026-10-26 · Usuário: Amos (`feature/amos`) · Meta do dia: **50% do backend**

> Cole este arquivo no início da próxima sessão. O chat original "Revisão backend e requisitos pendentes" não está neste PC.

## Preferências do Amos

- Português. Respostas **enxutas e claras**; sem jargão sem explicação.
- Quer entender cada alteração (explicar o "porquê" em termos simples).
- Não é administrador do PC (Windows Education da faculdade).

## Projeto

Plataforma de receitas (chefs, restaurantes, nutricionistas). React + Vite no front; **Spring Boot (Java 21+) + MySQL** no back. Pasta `Backend/`, schema em `Data/Modelagem/GastroDB_v1.0.0.sql` (12 tabelas).

Fluxo Git (README): PR de feature **sempre para `develop`**, nunca `main`. `main` só recebe PR de `develop`.

## O que foi feito hoje

1. PR #218 (fix do matcher do OPTIONS que liberava todas as rotas) estava com base `main`. Troquei para `develop` e foi **mergeado**. A `develop` agora é igual à `main` + o fix.
2. `feature/amos` local atualizada com a `develop` (fast-forward).
3. Verificado via API pública do GitHub: a `main` tem ruleset (PR + 1 aprovação, só admin com bypass atualiza). **A `develop` não tem proteção nenhuma**, ao contrário do README. Avisar o admin.
4. Commit `f27eff4` na `feature/amos` (**sem push ainda**):
   - `Backend/docker-compose.yml`: MySQL 8 que carrega o SQL do projeto.
   - `Backend/SETUP-BANCO.md`: passo a passo para montar o ambiente em qualquer PC.
   - `Backend/.env.example` e `.env` no `.gitignore`.
   - `application.properties`: `spring.datasource.password=${DB_PASSWORD}` e `app.jwt.secret=${JWT_SECRET}`.
5. `SecurityConfigTest` passou (2 testes). API subiu conectada ao MySQL e `/usuarios/me` sem token respondeu **401**.

## Estado do ambiente (este PC)

- Docker Desktop funcionando; container `gastromatch-mysql` ligado com as 12 tabelas.
- `Backend/.env` tem `DB_PASSWORD` gerada (**local, por PC**; cada PC usa a sua).
- JDK em `C:\Users\Amos\.jdks\openjdk-26.0.2`; `JAVA_HOME` não está definido, então setar no terminal antes do `./mvnw`.
- Docker só abriu depois de adicionar o usuário ao grupo `docker-users` (admin) e reiniciar a sessão do Windows.

## Decisões

| Decisão | Resposta |
|---|---|
| Escopo de 50% | 8 das 12 tabelas funcionando + núcleo do MVP |
| Chef publica sem aprovação | **Sim** (sem aprovação por ora) |
| Kits ilustrativos | Mock no front, fora do backend |
| Segredos | Variáveis de ambiente + documentar (feito) |
| Foto de receita | Upload em **disco local** |
| Vídeo | **Link do YouTube** (sem upload), embed por iframe no front; backend valida que a URL é de `youtube.com`/`youtu.be` |
| Coluna do vídeo | Adicionar `video_url VARCHAR(500) NULL` em `receita` (usar `timestamp_video` das etapas no `?start=`) |
| Latitude/longitude em `restaurante` | Sugeri adicionar; **Amos pediu minha opinião e ainda não confirmou** (não trava os 50%) |
| Banco | Docker local, não Supabase (Supabase é Postgres; o projeto é MySQL) |
| Java 25/26 vs 21 | Ignorar por enquanto |

## Pendências (ordem de execução)

**Bloco 0: Base** (próximo passo)
- Alinhar `Usuario` e `RefreshToken` ao SQL: `@Table("usuario")`, `Long id` → `Integer id`, adicionar `id_profissional`, `senha_alterada_em`, `email_verificado_em`, `criado_em`, `atualizado_em`.
- Criar a tabela de refresh token **no SQL** (hoje só existe via Hibernate) e trocar `ddl-auto=update` por `validate`.
- Configurar UTC no Hibernate (`hibernate.jdbc.time_zone`).
- `JwtAuthFilter` não confere se o usuário ainda existe nem usa `senha_alterada_em`.
- Segredo JWT antigo ainda está no histórico do Git: **considerar vazado** (já não é mais usado, cada PC gera o seu).
- Limpeza: apagar arquivos vazios `[Help`, `set`, `mvn` em `Backend/`; remover `Conceitos` duplicado; atualizar `Backend/Readme.md` (cita `com.gastromatch.api`, `mapper`, `audit`, `validation`, que não existem); `ApiException` sem uso.

**Bloco 1: Entidades e repositories** de `profissional`, `chef`, `restaurante`, `nutricionista`, `receita`, `etapa_receita`, `dica`, `ingrediente`, `ingrediente_receita`.

**Bloco 2: Receitas (público)**: `GET /receitas` com filtros (texto, tempo, dificuldade, tipo, ocasião, perfil, método) e "ingredientes que tenho"; `GET /receitas/{id}` com etapas, dicas e ingredientes; `GET /ingredientes`.

**Bloco 3: Chef**: cadastro de profissional e chef (validar que `role` bate com a tabela filha; `status_verificacao` nunca vem da API); CRUD de receita, etapa e dica só para chef logado.

**Depois dos 50%**: `comentario`, `favorito`, upload de foto, diretório com mapa, testes de receitas, Swagger, `data.sql` de exemplo.

## Comandos úteis

```powershell
# Banco (na pasta Backend, com Docker Desktop aberto)
docker compose up -d
docker compose down -v        # apaga tudo e recria (use quando o SQL mudar)

# API
$env:JAVA_HOME = "C:\Users\Amos\.jdks\openjdk-26.0.2"
$env:DB_PASSWORD = "<a do .env>"
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
$env:JWT_SECRET = [Convert]::ToBase64String($b)
./mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"

# Teste de segurança (não precisa de banco)
./mvnw -Dtest=SecurityConfigTest test
```

## Avisos

- **Não fazer push na `main`/`develop`.** PR da `feature/amos` para `develop` (precisa de 1 aprovação).
- Cadastro e login reais **não foram testados** ainda, só a rota protegida.
- O `docker compose` só foi testado neste PC.
- A API, ao subir com `ddl-auto=update`, cria `usuarios` e `refresh_tokens` ao lado de `usuario`. Fica resolvido no bloco 0.
- Avisar o time: a `develop` estava atrasada porque o Fellipe mergeou direto na `main`; todos devem fazer `git pull origin develop` nas suas branches.
