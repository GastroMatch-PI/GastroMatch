# Construtor, getters e setters: funcionamento geral e aplicação no `Usuario`

## 1. Funcionamento genérico

### Construtor

É o método que **cria o objeto** e define seu estado inicial.

- Tem o mesmo nome da classe e não declara tipo de retorno.
- Se você não declara nenhum, o Java cria um construtor vazio automaticamente.
- Se você declara um com argumentos, o construtor vazio **deixa de existir**, a não ser que você o escreva também.

```java
public class Exemplo {
    private String nome;

    public Exemplo() { }                    // construtor vazio
    public Exemplo(String nome) {           // construtor com argumento
        this.nome = nome;
    }
}
```

### Getter e setter

Existem por causa do **encapsulamento**: os campos são `private`, e o acesso passa por métodos.

- **Getter:** lê o valor do campo.
- **Setter:** altera o valor do campo.

Vantagens:

1. **Controle de acesso.** Dá para omitir um dos dois. Sem `setId`, o id fica somente leitura para o resto do código.
2. **Validação ou transformação.** O setter pode, por exemplo, normalizar o email em minúsculas antes de gravar.
3. **Liberdade para mudar a implementação.** Quem usa a classe não depende de como o dado é guardado por dentro.

## 2. Aplicação no `Usuario`

O objeto percorre dois caminhos diferentes.

### Criação (cadastro)

```java
Usuario usuario = new Usuario();                         // construtor vazio
usuario.setEmail(request.email());                       // setters montam o estado
usuario.setUsername(request.username());
usuario.setPassword(encoder.encode(request.password())); // recebe o HASH, nunca a senha pura
usuarioRepository.save(usuario);                         // Hibernate faz o INSERT e preenche o id
```

### Leitura (login, perfil)

```java
Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow(...);
// O Hibernate já criou o objeto (construtor vazio) e preencheu os campos.
usuario.getEmail();   // getters leem os dados para montar o UsuarioResponse
```

## 3. Quem usa o quê

| Peça | Quem usa | Para quê |
|---|---|---|
| Construtor vazio | Hibernate, e o service na criação | Instanciar o objeto |
| Setters | Service | Montar ou alterar dados |
| Getters | Service | Ler dados para montar respostas |

**Ponto importante:** getters e setters **não conversam com o banco**. Como as anotações (`@Id`, `@Column`) estão nos campos, o Hibernate acessa os **campos diretamente**, por reflexão. Ele precisa do construtor vazio (público ou protegido) para instanciar a entidade, mas não precisa de getters e setters. Eles existem para o **nosso código**.

## 4. Fluxo completo de leitura

A entidade nunca é exibida diretamente:

```
Banco → Hibernate → Usuario → Service (usa getters) → UsuarioResponse → API
```

O `UsuarioResponse` não contém `password`, e é isso que impede o hash de sair na resposta.

## 5. Alteração de dados: dirty checking

Dentro de uma transação (`@Transactional` no service), se você buscar um `Usuario` e chamar um setter, o Hibernate detecta a mudança e executa o `UPDATE` ao final, **mesmo sem chamar `save`**.

```java
@Transactional
public void alterarUsername(Long id, String novoUsername) {
    Usuario u = usuarioRepository.findById(id).orElseThrow(...);
    u.setUsername(novoUsername);   // o UPDATE acontece ao fim da transação
}
```

Isso costuma surpreender quem está começando. Voltamos a esse tema quando fizermos a edição de perfil.

## 6. Alternativa de design: construtor com dados obrigatórios

Em vez de construtor vazio mais setters:

```java
public Usuario(String email, String username, String passwordHash) { ... }
```

Assim ninguém cria um `Usuario` sem email ou senha. O construtor vazio continuaria existindo como `protected`, apenas para o Hibernate.

- **A favor:** mais robusto, o objeto nasce sempre completo.
- **Contra:** um pouco mais de código.

Para o cadastro do GastroMatch, construtor vazio e setters bastam.

## 7. Relação com o Lombok

O Lombok gera exatamente essas peças em tempo de compilação:

| Manual | Lombok |
|---|---|
| Construtor vazio | `@NoArgsConstructor` |
| Getters | `@Getter` |
| Setters | `@Setter` |

O funcionamento descrito neste documento não muda: o Lombok só poupa a digitação. Os detalhes estão em `lombok-explicacao.md`.

## 8. Perguntas de consolidação

1. Por que o `password` tem setter, mas o `UsuarioResponse` não terá nenhum campo de senha?
2. Se eu criasse `new Usuario()` e chamasse `save` sem ter feito `setEmail`, o que impediria a gravação? (Dica: `nullable = false`.)
3. Por que o Hibernate precisa do construtor vazio, mas não precisa dos getters e setters?