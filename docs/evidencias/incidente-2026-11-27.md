# Falha analisada: API recusada pelo banco (27/11/2026)

## Sintoma

Durante a instalação na AWS, o site abria, mas a API respondia **502**. Pouco depois, a API no Render também parou de responder.

## Como foi investigado

1. De fora: o front respondia 200 e `/api/actuator/health` respondia 502. O servidor web estava bem; o problema era a API.
2. No EC2, a API foi parada e o log filtrado:

```bash
sudo docker stop gastromatch-api-1
sudo docker logs gastromatch-api-1 2>&1 | grep -E 'ERROR|FATAL|Caused by' | tail -15
```

3. Mensagem encontrada:

```text
org.postgresql.util.PSQLException: FATAL: password authentication failed for user "postgres"
```

4. O painel do Render mostrava a mesma mensagem.

## Linha do tempo (horário de Brasília)

| Hora | Acontecimento |
|---|---|
| ~13:20 | API instalada na AWS com a senha copiada do Render |
| 13:35 | Primeira falha registrada no Render |
| ~13:36 | API da AWS parada para investigação |
| 13:44 | Senha nova salva no Render, com novo deploy |
| 13:47 | Render recuperado |
| depois | Senha atualizada no EC2, testada com uma única conexão, e API publicada |

## Causa

A senha do banco tinha sido trocada por um integrante **sem aviso**. Render e AWS ainda usavam a anterior.

Não foi demonstrado que as tentativas repetidas da API na AWS tenham contribuído para a falha do Render: a senha antiga, sozinha, explica o erro.

## Segunda falha encontrada

O script de publicação deveria parar a API ao ver a recusa da senha, e não parou. Ele lia só as **últimas 200 linhas** do log, e a mensagem ficava antes das linhas de erro do Spring.

- **Correção:** ler todo o log desde o início da publicação ([atualizar.sh](../../deploy/aws/atualizar.sh), commit `1abd7e0`).
- **Teste:** um log imitado com milhares de linhas depois da recusa falhava antes da correção e passou depois.

## Prevenção

- Combinar a troca de segredos e atualizar Render, EC2 e os `.env` no mesmo momento.
- Testar a senha nova com uma única conexão antes de ligar a API ([roteiro](../../deploy/aws/README.md#quando-a-senha-do-banco-mudar)).
