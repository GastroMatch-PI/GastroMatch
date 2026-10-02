# Fundamentação da Arquitetura em Camadas (Package by Layer)

A decisão de adotar a Arquitetura em Camadas (*Package by Layer*), estruturada com componentes de suporte (Mappers, DTOs, Security, Exception Handler e Audit), é uma escolha clássica, amplamente estabelecida na indústria para aplicações corporativas.

Abaixo está a fundamentação detalhada do motivo pelo qual essa organização foi definida e por que ela é uma das melhores e mais eficientes formas de se trabalhar.

---

## 1. Por que essa estrutura foi decidida?

A organização foi projetada seguindo dois pilares centrais do desenvolvimento de software profissional: o **Princípio da Responsabilidade Única** (SRP — *Single Responsibility Principle*) e a **Separação de Conceitos** (SoC — *Separation of Concerns*).

Em aplicações reais, misturar dados de banco, regras de negócio e contratos de API na mesma classe gera o que chamamos de **código espaguete**. A estrutura proposta resolve isso criando fronteiras claras:

```
com.gastromatch.api/
├── config/       <-- Infraestrutura global e políticas
├── security/     <-- Filtros, tokens e regras de acesso
├── controller/   <-- Porta de entrada HTTP (Entrada/Saída)
├── dto/          <-- Contratos de dados expostos (Request/Response)
├── mapper/       <-- Tradutores entre API e Banco
├── service/      <-- O "Coração" da aplicação (Regras de Negócio)
├── entity/       <-- Mapeamento do Banco de Dados
├── repository/   <-- Comunicação direta com a base de dados
├── exception/    <-- Padronização e tratamento centralizado de erros
├── audit/        <-- Rastreabilidade automatizada
└── validation/   <-- Validações customizadas reusáveis
```

### Por que cada camada existe na prática?

- **`controller/` + `dto/`:** o `UserController` não sabe como a tabela de usuários é modelada, nem como a senha é criptografada. Ele apenas recebe um `RegisterRequestDTO`, delega para a Service e devolve um `UserResponseDTO`. Isso garante que informações sensíveis (como hashes de senhas ou dados internos) jamais vazem para a API.
- **`mapper/`:** evita a poluição de métodos como `toEntity()` ou `toDTO()` dentro do Service ou do Controller. O Mapper é uma ferramenta puramente funcional e isolada para conversão.
- **`service/`:** é onde reside o valor real do sistema. O `UserService` e o `AuthService` executam a lógica de negócio (validar e-mail único, chamar o BCrypt, interagir com o `RefreshTokenService`) sem saber se a chamada veio de um controller REST, de uma fila Kafka ou de uma CLI.
- **`repository/` + `entity/`:** a camada de persistência (`User`, `UserRepository`) fica totalmente encapsulada. Se amanhã o banco mudar de PostgreSQL para MongoDB, apenas o modelo de dados interno muda, sem quebrar o contrato dos DTOs ou a lógica do controller.
- **`security/` + `exception/`:** funcionam como *Cross-Cutting Concerns* (preocupações transversais). Tratam autenticação/autorização e erros de forma global, liberando os serviços para focarem estritamente na regra de negócio.

---

## 2. Por que ela é uma das melhores formas de se trabalhar?

### A. Facilidade de Testes (Testabilidade)

Com cada componente isolado e dependendo de abstrações/interfaces, escrever testes se torna simples e direto:

- **Testes Unitários:** o `UserService` pode ser testado isoladamente, mockando o `UserRepository` e o `PasswordEncoder`.
- **Testes de Integração:** o `UserController` pode ser testado com `@WebMvcTest`, verificando validações de DTOs e retornos HTTP sem precisar subir a base de dados inteira.

### B. Curva de Aprendizado e Padronização

O *Package by Layer* é o padrão de arquitetura mais reconhecido por desenvolvedores em ecossistemas como Java (Spring Boot), .NET e C#.

- **Onboarding rápido:** qualquer desenvolvedor pleno/sênior que entrar na equipe entenderá a estrutura em minutos, pois ela segue a convenção universal da indústria.
- **Consistência:** a equipe sabe exatamente onde colocar cada nova funcionalidade (um novo endpoint vai em `controller`, uma nova query em `repository`, uma regra em `service`).

### C. Segurança por Design (*Security by Default*)

Ao forçar a existência das camadas `security/`, `dto/` e `validation/`:

- **Mitigação de Mass Assignment:** o cliente não consegue alterar campos protegidos (como `role` ou `isVerified`) injetando JSONs extras, pois o DTO aceita apenas o que foi explicitamente declarado.
- **Erros padronizados:** o `GlobalExceptionHandler` intercepta qualquer falha inesperada e responde com um JSON amigável (sem vazar a *stack trace* nem detalhes de infraestrutura para atacantes).

### D. Manutenibilidade e Baixo Acoplamento

Alterar uma regra de negócio (como mudar a política de expiração do JWT de 15 minutos para 10 minutos) requer alteração apenas na camada `security/` ou `service/`, sem impacto nos Controllers, Repositories ou DTOs.

---

## 3. Package by Layer vs. Package by Feature

Atualmente existem duas grandes correntes de organização:

| Abordagem | Como agrupa o código | Quando é excelente |
|---|---|---|
| **Package by Layer** (escolha atual) | Pela função técnica (controllers, services, repositories) | Projetos de porte pequeno a médio, times onde a padronização técnica é prioridade, ou quando a API possui domínios muito interconectados (como `User` e `Auth`) |
| **Package by Feature** | Pelo domínio de negócio (`user/`, `auth/`, `receita/`) | Sistemas monolíticos muito grandes, com múltiplos times trabalhando em domínios completamente isolados |

Para o escopo do GastroMatch, focado na construção de um módulo sólido de usuários e autenticação profissional, a organização em *Package by Layer* atende perfeitamente aos requisitos de mercado, com altíssimo nível de legibilidade e segurança.