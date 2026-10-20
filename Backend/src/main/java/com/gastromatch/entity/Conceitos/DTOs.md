# DTO: o que é, por que existe e como usar no GastroMatch

## 1. O problema que o DTO resolve

Imagine o endpoint de cadastro **sem DTO**, recebendo e devolvendo a própria entidade:

```java
@PostMapping("/cadastro")
public Usuario cadastrar(@RequestBody Usuario usuario) { ... }
```

Parece prático, mas tem três problemas graves:

1. **Vazamento de dados.** Ao devolver `Usuario`, a resposta JSON inclui o campo `password` (o hash). Qualquer campo que a entidade ganhar no futuro também sai.
2. **O cliente controla campos que não deveria.** Se o JSON recebido tiver `"id": 1`, ou no futuro `"role": "ADMIN"`, o Spring preenche esses campos na entidade. Isso se chama *mass assignment*.
3. **Acoplamento.** Qualquer mudança na tabela muda o contrato da API, e vice-versa.

## 2. O que é um DTO

**DTO** significa *Data Transfer Object* (objeto de transferência de dados). É uma classe simples cuja única função é **carregar dados entre a API e o resto do sistema**. Ela:

- tem só os campos que **aquela operação** precisa;
- não tem regra de negócio e não conversa com o banco;
- não é uma entidade, então o JPA não a conhece.

A regra de ouro: **o que entra e o que sai da API são DTOs; a entidade fica por dentro**.

## 3. Entrada e saída: DTOs diferentes

Cada operação tem a sua forma de dados:

| DTO | Direção | Campos | Observação |
|---|---|---|---|
| `CadastroUsuarioRequest` | entrada | email, username, password | O cliente envia a senha pura (por HTTPS) |
| `LoginRequest` | entrada | email, password | |
| `UsuarioResponse` | saída | id, email, username, capa | **Sem password** |
| `AuthResponse` | saída | (token de acesso) | Entra na etapa do JWT |

Note que `CadastroUsuarioRequest` não tem `id` nem `capa`: o cliente não decide o id, e a capa não faz parte do cadastro inicial.

## 4. Fluxo completo no cadastro

```
JSON do cliente
   ↓  (Jackson converte)
CadastroUsuarioRequest      ← validado aqui (Bean Validation)
   ↓
Controller → Service        ← o service monta o Usuario e faz o hash da senha
   ↓
Usuario (entidade)  →  banco
   ↓
Service monta UsuarioResponse a partir de Usuario
   ↓  (Jackson converte)
JSON da resposta
```

A conversão entre DTO e entidade é feita **à mão, no service**: copiar campo por campo. É explícito, curto e fácil de entender. Bibliotecas de mapeamento existem, mas não precisamos delas agora.

## 5. Como escrever: records

Desde o Java 16 existem os **records**, feitos para esse tipo de classe. Um record declara os campos uma vez e o Java gera construtor, getters, `equals`, `hashCode` e `toString`:

```java
public record LoginRequest(String email, String password) { }
```

Pontos importantes:

- Os campos são **imutáveis**: depois de criado, o objeto não muda. Ótimo para dados que chegam da rede.
- Os "getters" não têm o prefixo `get`: usa-se `request.email()`, não `request.getEmail()`.
- Não precisamos de Lombok nos DTOs.
- Records **não servem como entidade JPA** (a entidade precisa de construtor vazio e é mutável), por isso `Usuario` continua sendo classe.

## 6. Bean Validation: validar a entrada

O `spring-boot-starter-validation` que adicionamos ao `pom.xml` permite declarar regras com anotações do pacote `jakarta.validation.constraints`:

| Anotação | Regra |
|---|---|
| `@NotBlank` | Não pode ser nulo, vazio, nem só espaços (para `String`) |
| `@NotNull` | Não pode ser nulo |
| `@Email` | Formato de email |
| `@Size(min, max)` | Tamanho mínimo e máximo |
| `@Pattern(regexp)` | Precisa casar com uma expressão regular |

Cada anotação aceita uma mensagem: `@NotBlank(message = "Email é obrigatório")`.

**Importante:** só declarar as anotações **não valida nada**. A validação acontece quando o controller marca o parâmetro com `@Valid`:

```java
public ResponseEntity<?> cadastrar(@Valid @RequestBody CadastroUsuarioRequest request)
```

Sem o `@Valid`, as anotações são ignoradas. Esse é um dos erros mais comuns. Quando a validação falha, o Spring lança uma exceção (`MethodArgumentNotValidException`), que trataremos no `GlobalExceptionHandler`.

Na entrada em record, as anotações vão **no componente**:

```java
public record LoginRequest(
        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        String email,

        @NotBlank(message = "Senha é obrigatória")
        String password
) { }
```

## 7. Exemplo completo: `LoginRequest`

```java
package com.gastromatch.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Dados recebidos no login. Não é entidade: só carrega o que o login precisa.
 */
public record LoginRequest(
        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        String email,

        @NotBlank(message = "Senha é obrigatória")
        String password
) { }
```

Observe que no login **não impomos tamanho mínimo à senha**. Quem decide as regras de senha é o cadastro. No login, o objetivo é só verificar se as credenciais batem.

## 8. Cuidados de segurança com DTOs

1. **`toString` do record imprime todos os campos.** Se alguém fizer `log.info("Recebido: " + request)`, a senha em texto puro vai para o log. Para DTOs que contêm senha, sobrescreva o `toString` para omitir o campo, ou simplesmente nunca registre o objeto inteiro em logs.
2. **BCrypt só considera os primeiros 72 bytes da senha.** Por isso o cadastro deve limitar o tamanho máximo (por exemplo, 72). Sem limite, aceitamos senhas enormes que o algoritmo ignora em parte, e abrimos espaço para abuso com payloads gigantes.
3. **Validação no DTO não substitui a do banco.** O DTO barra entradas malformadas, mas a unicidade de email e username continua dependendo do service e das constraints `UNIQUE`.
4. **Mensagens de validação aparecem para o cliente.** Evite mensagens que revelem detalhes internos.
5. **Nunca devolva a entidade**, nem "só por enquanto" em um teste. O hábito errado de testes vira o código de produção.

## 9. Erros comuns

- Esquecer o `@Valid` no controller.
- Usar `javax.validation` em vez de `jakarta.validation`.
- Colocar `@NotBlank` em tipos que não são `String` (use `@NotNull`).
- Reaproveitar o mesmo DTO para entrada e saída.
- Incluir campos "só por precaução" no DTO. Cada campo extra é um campo que o cliente pode enviar ou ler.

## 10. Perguntas de consolidação

1. Que problema acontece se o endpoint devolver `Usuario` em vez de `UsuarioResponse`?
2. Por que o `CadastroUsuarioRequest` não deve ter o campo `id`?
3. O que acontece se eu declarar `@NotBlank` no DTO mas esquecer o `@Valid` no controller?
4. Por que limitar o tamanho máximo da senha no cadastro?