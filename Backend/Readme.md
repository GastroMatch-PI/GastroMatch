# Fundamentação da Arquitetura em Camadas (Package by Layer)

> Para rodar o backend no seu PC (banco no Docker, variáveis de ambiente), veja [SETUP-BANCO.md](SETUP-BANCO.md).

A decisão de adotar a Arquitetura em Camadas (*Package by Layer*), estruturada com componentes de suporte (DTOs, Security e Exception Handler), é uma escolha clássica, amplamente estabelecida na indústria para aplicações corporativas.

Abaixo está a fundamentação detalhada do motivo pelo qual essa organização foi definida e por que ela é uma das melhores e mais eficientes formas de se trabalhar.

---

## 1. Por que essa estrutura foi decidida?

A organização foi projetada seguindo dois pilares centrais do desenvolvimento de software profissional: o **Princípio da Responsabilidade Única** (SRP — *Single Responsibility Principle*) e a **Separação de Conceitos** (SoC — *Separation of Concerns*).

Em aplicações reais, misturar dados de banco, regras de negócio e contratos de API na mesma classe gera o que chamamos de **código espaguete**. A estrutura adotada resolve isso criando fronteiras claras:

```
com.gastromatch/
├── config/       <-- Infraestrutura global (CORS)
├── security/     <-- Filtro JWT, geração de tokens e regras de acesso
├── controller/   <-- Porta de entrada HTTP (Entrada/Saída)
├── dto/          <-- Contratos de dados expostos (Request/Response)
├── service/      <-- O "Coração" da aplicação (Regras de Negócio)
├── entity/       <-- Mapeamento do Banco de Dados
├── repository/   <-- Comunicação direta com a base de dados
└── exception/    <-- Padronização e tratamento centralizado de erros
```

Pastas como `mapper/` (tradução entre entidade e DTO), `audit/` e `validation/` **ainda não existem**: hoje a conversão está em `UsuarioResponse.de(...)` e a validação está nas anotações dos DTOs (`@NotBlank`, `@Email`, `@Size`). Elas só entram quando houver necessidade real.

### Por que cada camada existe na prática?

- **`controller/` + `dto/`:** o `UsuarioController` não sabe como a tabela de usuários é modelada, nem como a senha é criptografada. O `AuthController` recebe um `CadastroUsuarioRequest`, delega para a Service e devolve um `UsuarioResponse`. Isso garante que informações sensíveis (como o hash da senha) jamais vazem para a API.
- **Conversão entidade → DTO:** fica no próprio `UsuarioResponse.de(...)`, o que evita métodos como `toEntity()` ou `toDTO()` espalhados pelo Service ou pelo Controller. Se a conversão crescer, ela ganha uma pasta `mapper/` própria.
- **`service/`:** é onde reside o valor real do sistema. O `UsuarioService` e o `AuthService` executam a lógica de negócio (validar e-mail único, chamar o BCrypt, emitir e girar o refresh token) sem saber se a chamada veio de um controller REST, de uma fila ou de uma linha de comando.
- **`repository/` + `entity/`:** a camada de persistência (`Usuario`, `UsuarioRepository`) fica encapsulada. Se amanhã o banco mudar do MySQL para outro, apenas o modelo de dados interno muda, sem quebrar o contrato dos DTOs ou a lógica do controller. O esquema do banco é definido pelo SQL em `Data/Modelagem`, e o Hibernate só confere se as entidades batem com ele (`ddl-auto=validate`).
- **`security/` + `exception/`:** funcionam como *Cross-Cutting Concerns* (preocupações transversais). Tratam autenticação e erros de forma global, liberando os serviços para focarem estritamente na regra de negócio.

---

## 2. Por que ela é uma das melhores formas de se trabalhar?

### A. Facilidade de Testes (Testabilidade)

Com cada componente isolado e dependendo de abstrações/interfaces, escrever testes se torna simples e direto:

- **Testes Unitários:** o `UsuarioService` pode ser testado isoladamente, mockando o `UsuarioRepository` e o `PasswordEncoder`.
- **Testes de Integração:** o `UsuarioController` pode ser testado com `@WebMvcTest`, verificando validações de DTOs e retornos HTTP sem precisar subir a base de dados inteira. É o que o `SecurityConfigTest` já faz para as regras de acesso.

### B. Curva de Aprendizado e Padronização

O *Package by Layer* é o padrão de arquitetura mais reconhecido por desenvolvedores em ecossistemas como Java (Spring Boot), .NET e C#.

- **Onboarding rápido:** qualquer desenvolvedor pleno/sênior que entrar na equipe entenderá a estrutura em minutos, pois ela segue a convenção universal da indústria.
- **Consistência:** a equipe sabe exatamente onde colocar cada nova funcionalidade (um novo endpoint vai em `controller`, uma nova query em `repository`, uma regra em `service`).

### C. Segurança por Design (*Security by Default*)

Ao forçar a existência das camadas `security/` e `dto/`:

- **Mitigação de Mass Assignment:** o cliente não consegue alterar campos protegidos (como `id` ou `idProfissional`) injetando JSONs extras, pois o DTO aceita apenas o que foi explicitamente declarado.
- **Token verificado no banco:** o `JwtAuthFilter` não confia só na assinatura do token. Ele confere se o usuário ainda existe e se a senha não foi trocada depois da emissão do token.
- **Erros padronizados:** o `GlobalExceptionHandler` intercepta qualquer falha inesperada e responde com um JSON amigável (sem vazar a *stack trace* nem detalhes de infraestrutura para atacantes).

### D. Manutenibilidade e Baixo Acoplamento

Alterar uma regra de negócio (como mudar a política de expiração do JWT de 15 minutos para 10 minutos) requer alteração apenas na camada `security/` ou `service/`, sem impacto nos Controllers, Repositories ou DTOs.

---

## 3. Rotas da API

Erros seguem sempre o formato `{ "status": 400, "mensagem": "...", "erros": { "campo": "..." } }` (`erros` só em validação). Listas devolvem `{ conteudo, pagina, tamanho, totalElementos, totalPaginas }` (`pagina` começa em 0; `tamanho` máximo 50).

**Públicas (sem login, só GET):**

| Rota | O que faz |
|---|---|
| `GET /receitas` | Lista com filtros opcionais: `texto`, `tempoMax` (min), `dificuldade`, `tipo`, `ocasiao`, `perfil`, `metodo`, `ingredientes=1,2,3` (ids que a pessoa TEM: só voltam receitas feitas inteiramente com eles), `pagina`, `tamanho` |
| `GET /receitas/{id}` | Receita completa: ingredientes, etapas (em ordem) e dicas de cada etapa |
| `GET /receitas/{id}/comentarios` | Comentários da receita, do mais recente ao mais antigo |
| `GET /ingredientes` | Catálogo em ordem alfabética (`?nome=` filtra por trecho) |

**Conta** (`/auth/**` é público):

| Rota | O que faz |
|---|---|
| `POST /auth/cadastro`, `/auth/login`, `/auth/refresh`, `/auth/logout` | Cadastro e sessão (access token de 15 min + refresh token com rotação) |
| `GET /usuarios/me` | Dados da conta logada |

**Exigem login (`Authorization: Bearer <accessToken>`):**

| Rota | O que faz |
|---|---|
| `POST /chefs`, `GET /chefs/me` | Cria / consulta o perfil de chef da conta (uma conta tem no máximo um perfil) |
| `POST /receitas`, `PUT /receitas/{id}`, `DELETE /receitas/{id}` | Só chef, e só o chef **dono** edita ou apaga. O `PUT` troca os dados e a lista de ingredientes |
| `POST /receitas/{id}/etapas`, `PUT`/`DELETE /receitas/{id}/etapas/{idEtapa}` | Etapas (sem `ordem`, entra no fim) |
| `POST /receitas/{id}/etapas/{idEtapa}/dicas`, `PUT`/`DELETE .../dicas/{idDica}` | Dicas e erros comuns da etapa |
| `POST /receitas/{id}/comentarios`, `PUT`/`DELETE /comentarios/{id}` | Comentar (texto + nota de 0 a 5, opcional); só o autor edita ou apaga |
| `PUT`/`DELETE /receitas/{id}/favorito`, `GET /usuarios/me/favoritos` | Favoritar, desfavoritar (ambos idempotentes) e listar os favoritos |

Códigos: `400` dados inválidos, `401` sem login, `403` logado mas sem permissão (não é chef / receita de outro chef), `404` não existe, `409` conflito (email ou username repetido, conta que já tem perfil).

Vídeo da receita (`videoUrl`): só link do YouTube (`youtube.com/watch?v=ID`, `/embed/ID`, `/shorts/ID` ou `youtu.be/ID`). O front monta o iframe com `/embed/ID?start=<timestampVideo da etapa>`.

Com o profile `dev`, o Swagger lista tudo em http://localhost:8080/swagger-ui.html.

---

## 4. Package by Layer vs. Package by Feature

Atualmente existem duas grandes correntes de organização:

| Abordagem | Como agrupa o código | Quando é excelente |
|---|---|---|
| **Package by Layer** (escolha atual) | Pela função técnica (controllers, services, repositories) | Projetos de porte pequeno a médio, times onde a padronização técnica é prioridade, ou quando a API possui domínios muito interconectados (como `Usuario` e `Auth`) |
| **Package by Feature** | Pelo domínio de negócio (`usuario/`, `auth/`, `receita/`) | Sistemas monolíticos muito grandes, com múltiplos times trabalhando em domínios completamente isolados |

Para o escopo do GastroMatch, que começa pelo módulo de usuários e autenticação e segue para receitas e perfis profissionais, a organização em *Package by Layer* atende perfeitamente aos requisitos, com alto nível de legibilidade e segurança.
