# Rodar o backend localmente (MySQL no Docker)

Cada pessoa tem o **seu próprio** banco, no próprio PC. Siga estes passos em cada máquina.

## 1. Instalar (uma vez por PC)

- **Docker Desktop**: https://www.docker.com/products/docker-desktop (ou `winget install Docker.DockerDesktop`). Reinicie o PC se ele pedir.
- **Java 21 ou superior** (JDK). Confira com `java -version`. O `./mvnw` exige a variável `JAVA_HOME` apontando para a pasta do JDK (veja "Problemas comuns").

Abra o **Docker Desktop** e espere ele ficar verde ("Engine running").

## 2. Criar sua senha local (uma vez por PC)

Na pasta `Backend`:

```powershell
Copy-Item .env.example .env
```

Abra o `.env` e troque o valor de `DB_PASSWORD` por uma senha sua. O `.env` não vai para o GitHub.

## 3. Subir o banco

```powershell
docker compose up -d
```

Na primeira vez ele baixa o MySQL e cria as tabelas a partir de `Data/Modelagem/GastroDB_v1.0.0.sql`. Confira:

```powershell
docker compose ps
```

O status deve ser `running`. Aguarde uns 20 segundos na primeira vez.

O banco nasce com **13 tabelas**: as 12 do modelo (DER) mais a `refresh_token`, que guarda as sessões de login. Para conferir (use a senha do seu `.env`):

```powershell
docker exec gastromatch-mysql mysql -uroot -p"SUA_SENHA" -e "SHOW TABLES" gastromatch
```

## 4. Subir a API

Use **a mesma senha** do `.env` e gere um segredo JWT seu:

```powershell
$env:DB_PASSWORD = "a-senha-que-voce-pos-no-.env"
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
$env:JWT_SECRET = [Convert]::ToBase64String($b)
./mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
```

A API fica em http://localhost:8080 e o Swagger em http://localhost:8080/swagger-ui.html (só no profile `dev`).

> As variáveis `$env:` valem só para o terminal aberto. Em terminal novo, defina de novo.

## Comandos do dia a dia

| O que | Comando |
|---|---|
| Ligar o banco | `docker compose up -d` |
| Desligar (mantém os dados) | `docker compose stop` |
| Ver logs | `docker compose logs -f mysql` |
| **Apagar tudo e recriar do zero** | `docker compose down -v` e depois `docker compose up -d` |
| Rodar os testes de segurança (sem banco) | `./mvnw -Dtest=SecurityConfigTest test` |

Use o `down -v` sempre que o `GastroDB_v1.0.0.sql` mudar: o script só roda quando o banco é criado.

## Problemas comuns

- **`JAVA_HOME environment variable is not defined correctly`**: aponte para a pasta do seu JDK no terminal aberto, por exemplo `$env:JAVA_HOME = "C:\Users\SEU_USUARIO\.jdks\openjdk-26.0.2"` (use o caminho do JDK instalado no seu PC).
- **`error during connect ... docker_engine`**: o Docker Desktop não está aberto.
- **`defina DB_PASSWORD no arquivo .env`**: você não criou o `.env` (passo 2).
- **`Access denied for user 'root'`**: a senha do `$env:DB_PASSWORD` é diferente da do `.env`. Se mudou o `.env` depois de criar o banco, rode `docker compose down -v` e suba de novo.
- **Porta 3306 em uso**: tem outro MySQL rodando no PC. Pare-o ou mude `"3306:3306"` para `"3307:3306"` no `docker-compose.yml` e ajuste a URL em `application.properties`.
