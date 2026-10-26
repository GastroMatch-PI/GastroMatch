# GastroMatch: próximos passos do backend

Meta: **50% do backend** = 8 das 12 tabelas funcionando + núcleo do MVP.
Contexto completo do que já foi feito: `RELATORIO-SESSAO.md`.

**Onde paramos:** autenticação pronta (cadastro, login, refresh, logout, `/usuarios/me`), fix de segurança mergeado na `develop`, MySQL local no Docker com as 12 tabelas, segredos em variáveis de ambiente. Falta alinhar o código ao SQL e criar os outros domínios.

---

## 0. Como retomar (5 minutos)

1. Abra o **Docker Desktop** e espere "Engine running".
2. No terminal, na pasta `Backend`:
   ```powershell
   git checkout feature/amos
   git pull origin develop
   docker compose up -d
   ```
3. Se o banco sumiu ou o SQL mudou: `docker compose down -v` e depois `docker compose up -d`.
4. Para rodar a API, siga o passo 4 de [Backend/SETUP-BANCO.md](Backend/SETUP-BANCO.md) (precisa de `JAVA_HOME`, `DB_PASSWORD` e `JWT_SECRET`).
5. O commit `f27eff4` (Docker + segredos) está só local. Dê push da `feature/amos` quando for abrir o PR.

**Para pedir ajuda ao Claude em uma sessão nova**, cole este texto:

> Leia `RELATORIO-SESSAO.md` e `PROXIMOS-PASSOS.md` na raiz do GastroMatch. Vamos começar o bloco 0. Responda em português, de forma enxuta, e explique cada alteração em termos simples.

---

## Bloco 0: Base (começar por aqui)

**Por quê:** hoje o código Java e o script SQL não batem, então a API cria tabelas duplicadas (`usuarios`, `refresh_tokens`) e os dados reais iriam para a tabela errada.

| # | O que fazer | Onde |
|---|---|---|
| 1 | `@Table(name = "usuarios")` → `"usuario"` | `entity/Usuario.java` |
| 2 | `Long id` → `Integer id` (o SQL usa `INT`). Ajustar quem usa: `UsuarioResponse`, `UsuarioController`, `UsuarioService.buscarPorId`, `JwtService`, `JwtAuthFilter` | `entity/`, `dto/`, `controller/`, `service/`, `security/` |
| 3 | Adicionar em `Usuario` as colunas que faltam: `id_profissional`, `senha_alterada_em`, `email_verificado_em`, `criado_em`, `atualizado_em` | `entity/Usuario.java` |
| 4 | Criar a tabela de refresh token **no SQL** (hoje só existe via Hibernate): `refresh_token` com `id`, `token_hash` (64, único), `id_usuario` (FK), `expira_em`, `revogado`. Alinhar `RefreshToken` (`@Table`, `usuario_id` → `id_usuario`, `Integer id`) | `Data/Modelagem/GastroDB_v1.0.0.sql` e `entity/RefreshToken.java` |
| 5 | `spring.jpa.hibernate.ddl-auto=update` → `validate` | `application.properties` |
| 6 | Configurar UTC: `spring.jpa.properties.hibernate.jdbc.time_zone=UTC` | `application.properties` |
| 7 | `JwtAuthFilter`: recusar token se o usuário não existe mais ou se o token foi emitido antes de `senha_alterada_em` | `security/JwtAuthFilter.java` |
| 8 | Limpeza: apagar arquivos vazios `[Help`, `set`, `mvn` em `Backend/`; remover a pasta `Conceitos` duplicada (`entity/Conceitos` vs `KB/`); remover ou usar `ApiException`; atualizar `Backend/Readme.md` (cita `com.gastromatch.api`, `mapper`, `audit`, `validation`, que não existem) | `Backend/` |

**Como saber que deu certo**
- `docker compose down -v` + `up -d` e a API sobe sem erro (com `validate`, se o Java não bater com o SQL ela recusa subir e diz a coluna).
- No banco não aparecem `usuarios` nem `refresh_tokens`.
- **Testar de verdade** (ainda não foi feito): `POST /auth/cadastro` → `POST /auth/login` → `GET /usuarios/me` com o token → `POST /auth/refresh`. Pelo Swagger em http://localhost:8080/swagger-ui.html (profile `dev`).
- `./mvnw -Dtest=SecurityConfigTest test` continua passando.

---

## Bloco 1: Entidades e repositories

**Entrega:** para cada tabela, uma **entidade** (classe que representa a tabela) e um **repository** (busca e salva). Nada aparece na API ainda; é a base dos blocos 2 e 3.

Tabelas: `profissional`, `chef`, `restaurante`, `nutricionista`, `receita`, `etapa_receita`, `dica`, `ingrediente`, `ingrediente_receita`.

- `profissional` é a tabela mãe; `chef`, `nutricionista` e `restaurante` apontam para ela (`id_profissional`). `usuario.id_profissional` liga a conta ao perfil.
- **Adicionar** `video_url VARCHAR(500) NULL` em `receita` (link do YouTube). `etapa_receita.timestamp_video` já existe.
- Seguir o padrão de nomes do SQL: tabela no singular, snake_case, FK `id_<tabela>`.
- Sempre que mudar o SQL: `docker compose down -v` e `up -d`.

---

## Bloco 2: Receitas (rotas públicas, sem login)

- `GET /receitas`: lista com filtros (texto, tempo, dificuldade, tipo, ocasião, perfil, método) e busca por "ingredientes que tenho".
- `GET /receitas/{id}`: detalhe com etapas, dicas e ingredientes.
- `GET /ingredientes`.
- Liberar essas rotas (somente `GET`) no `SecurityConfig`, mantendo o resto protegido. **Escrever teste** para garantir que continua assim.
- Usar DTOs (não devolver a entidade direto).

---

## Bloco 3: Chef (rotas com login)

- Cadastro de profissional e de chef. O backend valida que o `role` do profissional bate com a tabela filha (o banco não garante isso).
- `status_verificacao` **nunca vem da API**. Decisão: chef publica **sem aprovação**.
- CRUD de receita, etapa e dica **só para o chef dono** (verificar que `receita.id_chef` é do usuário logado).
- Vídeo: aceitar só URL de `youtube.com` ou `youtu.be`. O front monta o iframe com `/embed/ID?start=<timestamp_video>`.

**Fim do bloco 3 = 50%.**

---

## Depois dos 50%

- `comentario` (leitura pública, escrita com login) e `favorito`.
- Upload de foto em disco local (campos `imagem`, `foto`, `comprovante_profissao`).
- Diretório de restaurantes e profissionais; mini mapa precisa de `latitude`/`longitude` em `restaurante` (recomendado adicionar).
- Testes de receitas, Swagger, README, `data.sql` com ingredientes e receitas de exemplo.
- Kits ilustrativos: mock no front.

---

## Pendências fora do código

- [ ] Pedir ao admin para **proteger a `develop`** (PR + 1 aprovação). Hoje ela não tem proteção, apesar do README.
- [ ] Avisar o time: a `develop` estava atrasada porque o Fellipe mergeou direto na `main`. Todos devem rodar `git pull origin develop` nas suas branches.
- [ ] Cada pessoa que for rodar o backend segue o `Backend/SETUP-BANCO.md` (testado só no seu PC até agora).
- [ ] Decidir `latitude`/`longitude` em `restaurante` (não trava os 50%).
- [ ] O segredo JWT antigo continua no histórico do Git: considerar vazado (não é mais usado).
- [ ] Mensagem do PR para a `develop`: base **`develop`**, nunca `main`.
