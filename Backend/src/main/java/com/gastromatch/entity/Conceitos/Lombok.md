# Lombok: como funciona e como ficaria no GastroMatch
 (Decidimos não utilizar para compreender melhor o funcionamento)

## 1. O que é

Lombok é uma biblioteca que **gera código repetitivo durante a compilação**: getters, setters, construtores, `toString`, `equals`/`hashCode`. Você escreve uma anotação, e o `.class` final sai com os métodos, como se você os tivesse digitado.

```java
@Getter
public class Exemplo {
    private String nome;
}
// O .class compilado contém: public String getNome()
```

O arquivo `.java` continua mostrando só a anotação. O código gerado existe apenas no bytecode.

## 2. Como funciona por dentro

O Java permite que bibliotecas se conectem ao compilador por meio de **annotation processors**. Quando o `javac` compila, ele chama os processadores registrados, que podem inspecionar o código.

O Lombok usa isso de um jeito pouco convencional: um processador normal só *cria arquivos novos*, enquanto o Lombok **altera a árvore sintática (AST) das classes que já estão sendo compiladas**, inserindo os métodos nela. Por isso:

- **Funciona só na compilação.** Não há mágica em execução. O Spring e o Hibernate enxergam métodos normais.
- **Depende do compilador.** O Lombok usa partes internas do `javac`. Versões novas do JDK às vezes exigem versão nova do Lombok. Com Java 21, a versão que o Spring Boot gerencia deve servir, mas confirme na hora de adicionar.
- **A IDE precisa saber disso.** No VS Code, o suporte vem pela extensão Java com annotation processing habilitado. Sem isso, o editor mostra erro em `getNome()` mesmo com o Maven compilando.

## 3. Anotações principais

| Anotação | O que gera |
|---|---|
| `@Getter` / `@Setter` | Getters/setters. Em classe, vale para todos os campos; em campo, só para aquele |
| `@NoArgsConstructor` | Construtor sem argumentos |
| `@AllArgsConstructor` | Construtor com todos os campos |
| `@RequiredArgsConstructor` | Construtor com campos `final`, bom para injeção de dependência |
| `@ToString` | Método `toString` |
| `@EqualsAndHashCode` | `equals` e `hashCode` |
| `@Data` | Atalho para Getter + Setter + ToString + EqualsAndHashCode + RequiredArgsConstructor |
| `@Builder` | Padrão builder |

## 4. Como entra no `pom.xml`

Três pontos, e cada um tem motivo:

```xml
<!-- 1. Dependência: optional, para não vazar para quem depender do projeto -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

```xml
<!-- 2. Dentro de spring-boot-maven-plugin: Lombok só é necessário para compilar,
        então fica fora do JAR executável -->
<configuration>
    <excludes>
        <exclude>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </exclude>
    </excludes>
</configuration>
```

3. Registrar o Lombok como annotation processor no `maven-compiler-plugin` (`annotationProcessorPaths`). Em JDKs recentes, processadores que estão só no classpath deixaram de ser descobertos automaticamente, então declarar é a forma segura.

A versão do Lombok normalmente é gerenciada pelo parent do Spring Boot, mas **confirme para o Boot 4.1.1** gerando um projeto com Lombok no start.spring.io (Explore) e comparando com o seu `pom.xml`.

## 5. Lombok neste contexto: entidade JPA

### Como `Usuario` ficaria

```java
@Entity
@Table(name = "usuarios")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;                       // sem @Setter: o id vem do banco

    @Setter
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Setter
    @ToString.Exclude                      // só necessário se usar @ToString
    @Column(nullable = false, length = 100)
    private String password;

    @Setter
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Setter
    @Column(length = 500)
    private String capa;
}
```

O JPA aceita construtor **protegido**, então `@NoArgsConstructor(access = PROTECTED)` cumpre a exigência sem convidar o resto do código a criar um `Usuario` vazio.

### Cuidados específicos de entidade

1. **Evite `@Data` em entidades.** Ele gera `equals`/`hashCode` sobre todos os campos e `toString` com todos os campos. Em JPA isso causa problemas: o `id` é `null` antes de salvar (então `hashCode` muda depois do `save`), e com relacionamentos `LAZY` o `toString`/`hashCode` pode disparar consultas inesperadas ou laços infinitos.
2. **Segurança: `toString` e senha.** `@ToString` ou `@Data` incluem o `password` (o hash) em qualquer log que imprima o objeto. Isso fere o requisito de "logs sem segredos". Se usar `@ToString`, exclua o campo com `@ToString.Exclude`, ou simplesmente não use.
3. **Não coloque `@Setter` onde não deveria existir.** Setter na classe inteira daria `setId`. Aplicar por campo é mais explícito.
4. **`@Builder` em entidade** exige cuidado com o construtor sem argumentos e raramente compensa aqui.

## 6. Prós e contras

**A favor**
- Menos código repetitivo e classes menores.
- Adicionar um campo não exige gerar mais getter e setter.

**Contra**
- O código "real" fica escondido, e é mais difícil depurar e ler no repositório.
- Dependência do compilador e da IDE.
- É fácil usar `@Data` por reflexo e criar problemas sutis (itens 1 e 2 acima).
- Para quem está aprendendo, esconde justamente o que o JPA exige da classe.

## 7. Alternativas

- **Records (Java 16+)** para DTOs: `record LoginRequest(String email, String password) {}` já traz construtor, getters e `equals`/`hashCode` sem biblioteca. Para DTOs de entrada e saída, os records dispensam o Lombok. Não servem como entidade JPA, porque são imutáveis e sem construtor vazio.
- **Gerar na IDE:** getters e setters em um clique, sem dependência extra.

## 8. Resumo para o GastroMatch

- Lombok **pode** ser usado nas entidades, desde que de forma seletiva (`@Getter`, `@Setter` por campo, `@NoArgsConstructor(PROTECTED)`).
- DTOs: preferir `record`.
- Evitar `@Data` em entidades e nunca deixar `password` aparecer em `toString`.

## 9. Perguntas de consolidação

1. Por que o Lombok precisa estar no classpath só durante a compilação?
2. Por que `@Data` é arriscado em uma entidade JPA?
3. O que o `@ToString` poderia vazar na classe `Usuario`?