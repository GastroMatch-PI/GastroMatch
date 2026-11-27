# GastroMatch: plano de execução e evidências

**Projeto Integrador II: DevOps, Ciência de Dados e Computação em Nuvem**

- **Equipe:** Amós, Diogo, Fellipe, Gustavo e Vinicius
- **Repositório:** <https://github.com/GastroMatch-PI/GastroMatch>
- **Demonstração (AWS):** <https://184-197-177-43.sslip.io> (disponível com o Learner Lab ligado)
- **Reserva:** <https://gastromatch-front.vercel.app> (front na Vercel, API no Render)
- **Atualizado em:** 27/11/2026

## 1. Problema, usuário e valor

Quem cozinha procura receitas em muitos lugares, sem saber o valor nutricional nem se o preparo é confiável. Quem publica não sabe o que o público ainda não encontra.

- **Usuário que decide com os dados:** o chef que publica receitas.
- **Pergunta principal:** que tipo de receita o chef deveria publicar a seguir?
- **Pergunta de apoio (equipe):** dá para confiar na tabela nutricional mostrada?
- **Valor esperado:** publicar onde há pouca oferta e boa avaliação, e corrigir os dados que impedem o cálculo nutricional.

## 2. Escopo

**Dentro (implementado):** busca e filtros de receitas; busca por ingredientes que a pessoa tem; receita com etapas, dicas e vídeo do YouTube; ajuste de porções; modo cozinhar; tabela nutricional; comentários e notas; favoritos; cadastro e login; perfis de chef, nutricionista e restaurante; publicação de receitas; envio de imagens; indicadores em relatório.

**Fora desta entrega:** fórum e comunidade; kits; lista de compras e cardápio; mapa; feed de vídeos; painel de indicadores dentro do site; tela de administração de ingredientes; conversão de "unidade" e "xícara" em gramas; automação industrial (opcional no guia).

**Fluxo principal:** chef publica a receita, o visitante consulta e avalia, os dados viram indicadores e o chef decide a próxima publicação.

## 3. Requisitos e critérios de aceite

| # | Critério de aceite | Situação em 27/11 | Evidência |
|---|---|---|---|
| 1 | Receita publicada fica disponível na API e no site | Atendido | receita 54, publicada pelo site |
| 2 | Dado inválido é recusado com o motivo | Atendido | validações da API e [testes](../Backend/src/test/java/com/gastromatch) |
| 3 | Pelo menos dois indicadores com fórmula, fonte e interpretação | Atendido (três) | [seção Indicadores](#8-indicadores) |
| 4 | Serviço acessível por URL, com banco | Atendido | demonstração na AWS, `/api/actuator/health` |
| 5 | Mudança no código dispara o pipeline; só o que passa é publicado | Atendido | [CI](../.github/workflows/ci.yml) e [atualizar.sh](../deploy/aws/atualizar.sh) |
| 6 | Há como investigar e recuperar uma falha | Atendido | [incidente](evidencias/incidente-2026-11-27.md) e [README da AWS](../deploy/aws/README.md) |
| 7 | Volta à versão anterior ensaiada | **Pendente** | instrução escrita, ainda não executada |
| 8 | Site volta sozinho após desligar e religar o lab | **Pendente** | a verificar antes da apresentação |

## 4. Backlog

| Prioridade | Item |
|---|---|
| Alta | Ensaiar o religamento do lab e a volta de versão; marcar a versão `v1.0.0` |
| Alta | Confirmar que os segredos antigos do histórico não estão em uso |
| Média | Peso por unidade nos ingredientes, para subir a cobertura nutricional |
| Média | Importar a tabela TACO (Unicamp), com origem e registro de linhas rejeitadas |
| Média | Painel de indicadores dentro do site |
| Baixa | Chef cadastrar ingrediente pela tela de receita |

## 5. Arquitetura

```text
Visitante e chef
      |  HTTPS
      v
EC2 t3.small (AWS, us-east-1)
  +-- web: Caddy (front React; repassa /api)
  +-- api: Spring Boot (Java 21)
             |
             v
      Supabase: PostgreSQL e Storage de imagens

GitHub --(CI: testes, lint, segredos, imagens)--> main
EC2 consulta a main a cada 2 minutos e publica o commit aprovado

Dados --> API --> indicadores.mjs --> relatório e amostra no repositório
```

| Camada | Tecnologia |
|---|---|
| Front | React, TypeScript, Vite, Tailwind |
| API | Java 21, Spring Boot, Spring Security (JWT) |
| Banco e imagens | PostgreSQL e Storage da Supabase |
| Execução | Docker e Docker Compose |
| Servidor web | Caddy (HTTPS automático) |
| Pipeline | GitHub Actions |

## 6. Dados

| Item | Descrição |
|---|---|
| Origem | Cadastros feitos no site pela API; carga inicial pelos [scripts SQL](../Data/Modelagem). Há dados de demonstração criados pela equipe, e as avaliações não representam público real. |
| Formato | Tabelas PostgreSQL; JSON na API; amostra em [Data/amostra/receitas.json](../Data/amostra/receitas.json) |
| Frequência | Escrita sob demanda; indicadores calculados quando o script é executado |
| Volume (27/11) | 52 receitas, 51 ingredientes, 70 notas |
| Privacidade | A coleta dos indicadores não guarda nome, e-mail nem outro dado de pessoa |

### Validação e tratamento

1. **Na entrada (API):** campos obrigatórios, tamanhos, listas fechadas, números positivos, nota de 0 a 5, imagem conferida pelo conteúdo. A resposta diz qual campo está errado.
2. **No banco:** chaves estrangeiras, nomes únicos e restrições `CHECK`.
3. **Na análise:** [indicadores.mjs](../Data/indicadores/indicadores.mjs) valida cada registro, rejeita com o motivo (inclusive `id` repetido) e agrupa receita sem perfil como `SEM_PERFIL`. Receita sem nota não entra como zero na média.

### Limitações

- A nutrição soma só ingredientes em **g** e **ml**; "unidade" e "xícara" ficam de fora, com aviso na tela.
- Os valores nutricionais da carga inicial são **aproximados e sem fonte oficial**; não servem para orientação alimentar.
- Cada receita tem um único perfil alimentar.
- Várias imagens são links externos.

## 7. Armazenamento e consultas

| Grupo | Tabelas |
|---|---|
| Contas | `usuario`, `refresh_token`, `profissional`, `chef`, `nutricionista`, `restaurante` |
| Receitas | `receita`, `etapa_receita`, `dica`, `ingrediente`, `ingrediente_receita` |
| Interação | `comentario` (texto e nota), `favorito` |

Relações principais: um chef tem várias receitas; cada receita tem etapas e uma lista de ingredientes com quantidade e unidade; cada comentário liga um usuário a uma receita. O esquema completo está em [GastroDB_v2.0.0_postgres.sql](../Data/Modelagem/GastroDB_v2.0.0_postgres.sql), com as migrações na mesma pasta.

Consulta da avaliação de uma receita:

```sql
SELECT AVG(nota) AS media, COUNT(nota) AS quantidade
FROM comentario
WHERE id_receita = :idReceita;
```

Nutrição por porção ([CalculoReceita.java](../Backend/src/main/java/com/gastromatch/service/CalculoReceita.java)): soma de `(quantidade / porcao_base) x valor do ingrediente`, dividida pelo número de porções.

## 8. Indicadores

Para gerar de novo: `node Data/indicadores/indicadores.mjs`. Resultado completo em [evidencias/indicadores.md](evidencias/indicadores.md). Valores abaixo da coleta de 27/11/2026.

### Cobertura nutricional

- **Fórmula:** receitas com todos os ingredientes calculados ÷ receitas válidas × 100
- **Fonte:** campo `nutricao.completa` de `GET /receitas/{id}`
- **Valor:** 32 ÷ 52 = **61,5%**
- **Interpretação:** cerca de 4 em cada 10 receitas mostram tabela incompleta. A ação é dar peso às unidades antes de destacar a nutrição como diferencial.

### Oferta por perfil alimentar

- **Fórmula:** receitas do perfil ÷ receitas válidas × 100
- **Fonte:** campo `perfil` de `GET /receitas`

| Perfil | Receitas | Oferta |
|---|---|---|
| Vegano | 17 | 32,7% |
| Sem perfil informado | 14 | 26,9% |
| Low carb | 10 | 19,2% |
| Vegetariano | 6 | 11,5% |
| Sem glúten | 5 | 9,6% |
| Sem lactose | 0 | 0% |

- **Interpretação:** faltam receitas **sem lactose** (nenhuma) e **sem glúten**. As 14 sem perfil também são um problema de qualidade: ficam fora do filtro.

### Avaliação média por perfil

- **Fórmula:** soma de (média da receita × número de notas) ÷ total de notas do perfil
- **Fonte:** `GET /receitas/{id}/comentarios`

| Perfil | Notas | Média (0 a 5) |
|---|---|---|
| Vegetariano | 6 | 4,92 |
| Low carb | 12 | 4,58 |
| Vegano | 20 | 4,32 |
| Sem perfil informado | 22 | 4,30 |
| Sem glúten | 10 | 4,05 |

- **Interpretação:** vegetariano combina a melhor nota com pouca oferta. **A amostra é pequena e de demonstração**, então isso é uma hipótese, não uma conclusão.

### Resposta à pergunta principal

Publicar primeiro receitas **sem lactose** e **sem glúten** (menor oferta); em seguida, testar mais receitas **vegetarianas** (melhor avaliação, ainda com poucas notas).

## 9. Nuvem

| Item | Escolha |
|---|---|
| Servidor | EC2 `t3.small`, disco de 30 GB, IP fixo, região `us-east-1` (AWS Academy Learner Lab) |
| Acesso | HTTPS pelo domínio `sslip.io` derivado do IP |
| Portas | 80 e 443 (site) e 22 (só com chave) |
| Banco e imagens | Supabase |

Variáveis de configuração, guardadas só no servidor (`/etc/gastromatch.env`): `SITE_ADDRESS`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_BUCKET`.

- **Criar e instalar:** [deploy/aws/README.md](../deploy/aws/README.md)
- **Testar:** abrir o site e `/api/actuator/health`
- **Desligar:** botão **End Lab**; para apagar, encerrar a instância e liberar o IP
- **Custo estimado:** cerca de US$ 5 por mês parado (disco e IP) e US$ 0,03 por hora ligado; crédito de US$ 50

**Limite conhecido:** a sessão do lab dura 4 horas e o site não fica no ar o tempo todo.

## 10. DevOps

1. Trabalho em branch própria; PR para a `develop` e depois para a `main`, com revisão.
2. [Pipeline](../.github/workflows/ci.yml) em cada PR e push:

| Verificação | O que faz |
|---|---|
| Testes do back | JUnit com PostgreSQL descartável; cobertura mínima de 80% nas classes de segurança, autenticação e validação |
| Front | lint, auditoria de dependências (aviso), testes com cobertura mínima de 80% em quatro módulos de `src/lib`, build |
| Dados | testes dos indicadores e relatório reproduzível |
| Segredos | Gitleaks nos arquivos atuais |
| Imagens | montagem das imagens Docker da API e do front |

3. O servidor publica o commit da `main` **somente com todas as verificações aprovadas**.
4. **Versão publicada:** `/versao` mostra o commit.
5. **Volta à versão anterior:** reverter o PR na `main` (o servidor publica a reversão) ou, em emergência, os comandos do [README da AWS](../deploy/aws/README.md#voltar-a-uma-versão-anterior).
6. **Dependências:** Dependabot abre PRs semanais.

## 11. Segurança

| Medida | Situação |
|---|---|
| Senhas de usuário com BCrypt | Em uso |
| Token de acesso de 15 minutos e renovação rotativa | Em uso |
| Configuração por variáveis; `.env` fora do Git | Em uso |
| HTTPS e CORS restrito ao site | Em uso |
| Detecção de segredos no pipeline | Incluída nesta entrega |
| **Histórico antigo** | Commits de outubro tinham senha de banco e segredo JWT escritos em `application.properties`. O arquivo atual usa variáveis. **Pendente:** confirmar que nenhum dos dois está em uso e trocar o que estiver. |
| Porta 22 aberta à internet | Aceito para o laboratório; acesso só por chave |

## 12. Observabilidade

- **Saúde:** `/api/actuator/health` inclui a conexão com o banco.
- **Logs:** `sudo docker logs gastromatch-api-1` e `sudo journalctl -u gastromatch-atualizar`.
- **Falha real analisada:** [senha do banco trocada](evidencias/incidente-2026-11-27.md).
- **Ainda não há:** métricas históricas nem alerta automático.

## 13. Riscos

| Risco | Efeito | Como reduzir |
|---|---|---|
| Senha do banco trocada sem aviso | API fora do ar | combinar a troca; atualizar Render, EC2 e `.env` no mesmo momento |
| Sessão do lab encerrar | site fora do ar | iniciar antes e renovar; manter a reserva na Vercel |
| Orçamento do lab acabar | perda do ambiente | acompanhar o saldo; evitar recursos que cobram parados |
| Banco compartilhado entre ambientes | teste altera dados da demonstração | evitar testes no dia; testes automáticos usam banco descartável |
| Merge perto da apresentação | reinício na hora errada | congelar a `main` no dia |

## 14. Decisões

| Decisão | Motivo | Alternativa descartada |
|---|---|---|
| Um único EC2 | simples, barato e fácil de explicar | serviços separados (S3, RDS): mais custo |
| O servidor busca a atualização | as chaves do lab mudam a cada sessão; funciona mesmo se o servidor estava desligado no merge | GitHub enviar para a AWS |
| Servidor monta as imagens | não depende de permissão no registro da organização | publicar no GHCR |
| Manter a Supabase | sem migração e sem custo extra | banco próprio na AWS |
| `sslip.io` | HTTPS sem cadastrar domínio | domínio pago |

## 15. Onde está cada evidência

| Evidência | Local |
|---|---|
| Código e histórico | commits e PRs do repositório |
| Pipeline | aba **Actions** do GitHub |
| Testes | `Backend/src/test`, `Frontend/src`, `Data/indicadores` |
| Dados e indicadores | `Data/` e [evidencias/indicadores.md](evidencias/indicadores.md) |
| Infraestrutura | `deploy/aws/`, `Backend/Dockerfile`, `Frontend/Dockerfile` |
| Falha e recuperação | [evidencias/incidente-2026-11-27.md](evidencias/incidente-2026-11-27.md) |

## 16. Resultados e retrospectiva

**Resultado:** seis dos oito critérios de aceite atendidos; faltam os ensaios de religamento e de volta de versão.

**O que funcionou**

- Fluxo com PRs e testes automáticos.
- Mesma receita Docker para o Render e a AWS.
- Publicação automática sem guardar chave da AWS no GitHub.

**O que deu errado**

- Front e API publicados em versões diferentes deixaram a página de receita com erro.
- Troca de senha do banco sem aviso derrubou a API.
- A trava criada para esse caso falhou na primeira vez, porque o teste imitava um log curto demais.

**Melhorias**

- Publicar front e API juntos, como na AWS.
- Avisar o time antes de trocar qualquer segredo.
- Testar com saídas parecidas com as reais.
