# KB: Knowledge Base do GastroMatch

Notas de estudo sobre as decisões e os conceitos do projeto. Cada nota segue: responsabilidade, como funciona no código, decisões, erros comuns e perguntas de consolidação.

## Backend

| Nota | Assunto |
|---|---|
| [Controller](Conceitos/Controller.md) | Porta de entrada HTTP |
| [Service](Conceitos/Service.md) | Regras de negócio (cadastro, BCrypt, transação) |
| [Repository](Conceitos/Repository.md) | Acesso ao banco |
| [Entity](Conceitos/Entity.md) | Mapeamento JPA das tabelas |
| [DTOs](Conceitos/DTOs.md) | Contratos de entrada e saída |
| [Exception](Conceitos/Exception.md) | Tratamento centralizado de erros |
| [Lombok](Conceitos/Lombok.md) | Redução de código repetitivo |
| [ConstrutorGetSet](Conceitos/ConstrutorGetSet.md) | Construtores, getters e setters |
| [Autenticação JWT](Conceitos/Autenticacao-JWT.md) | Access/refresh token e Spring Security |
| [Receitas: busca e cálculo](Conceitos/Receitas-Busca-e-Calculo.md) | Filtros, porções, nutrição, imagens |

## Dados

| Nota | Assunto |
|---|---|
| [Banco de dados](Conceitos/Banco-de-Dados.md) | PostgreSQL, tabelas e migração do MySQL |

## Frontend

| Nota | Assunto |
|---|---|
| [Sessão e API](Conceitos/Frontend-Sessao-e-API.md) | Auth, cliente HTTP, rotas |

## Ordem de leitura sugerida

Banco → Entity → Repository → DTOs → Service → Controller → Exception → Autenticação → Frontend.

Arquitetura geral e como rodar: [Backend/Readme.md](../Backend/Readme.md) e [Backend/SETUP-BANCO.md](../Backend/SETUP-BANCO.md).
