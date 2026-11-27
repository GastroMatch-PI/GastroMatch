# GastroMatch na AWS (AWS Academy Learner Lab)

```text
Navegador ──HTTPS──> EC2 t3.small (Ubuntu + Docker)
                      ├─ web: Caddy (front em / e repasse de /api)
                      └─ api: Spring Boot
                              │
                              └──> Supabase (banco e imagens, os mesmos do Render)

GitHub (main) <── o EC2 consulta a cada 2 minutos; com o CI verde, monta e publica
```

O servidor **busca** a atualização. Nenhuma chave da AWS fica no GitHub (no Learner Lab elas
mudam a cada sessão), e um merge feito com o servidor desligado é publicado quando ele liga.

## Criar o servidor (uma vez)

1. No Learner Lab, clique em **Start Lab** e espere o círculo ao lado de "AWS" ficar verde.
2. No terminal do lab, troque `BRANCH` pela branch que tem estes arquivos (`main` depois do merge):

   ```bash
   BRANCH=main
   curl -fsSLo criar-servidor.sh https://raw.githubusercontent.com/GastroMatch-PI/GastroMatch/$BRANCH/deploy/aws/criar-servidor.sh
   bash criar-servidor.sh
   ```

3. Entre no servidor com o comando `ssh` que o script mostra.
4. Dentro do servidor:

   ```bash
   BRANCH=main
   curl -fsSLo instalar.sh https://raw.githubusercontent.com/GastroMatch-PI/GastroMatch/$BRANCH/deploy/aws/instalar.sh
   sudo BRANCH=$BRANCH bash instalar.sh
   ```

   Ele pede `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`
   (os mesmos do Render, em **Environment**). Eles ficam só em `/etc/gastromatch.env`, no
   servidor. O `JWT_SECRET` é gerado na hora, então quem estava logado no outro endereço
   precisa entrar de novo.

O site fica em `https://<IP-com-hífens>.sslip.io` (o `sslip.io` transforma o IP em um nome,
sem cadastro, e o Caddy cria o certificado HTTPS).

## Nos dias de apresentação

1. **Start Lab** uns 15 minutos antes: o EC2 liga sozinho e o site volta.
2. Abra o site e teste login e uma receita.
3. A sessão dura 4 horas. Clique em **Start Lab** de novo para reiniciar a contagem.

## Comandos úteis (dentro do servidor)

| Para | Comando |
|---|---|
| Ver o que a atualização fez | `sudo journalctl -u gastromatch-atualizar -n 50` |
| Logs da API | `sudo docker logs gastromatch-api-1 --tail 100` |
| Logs do Caddy (HTTPS) | `sudo docker logs gastromatch-web-1 --tail 50` |
| Publicar agora / tentar de novo | `sudo bash /opt/gastromatch/deploy/aws/atualizar.sh --agora` |
| Trocar de branch | `sudo BRANCH=main bash /opt/gastromatch/deploy/aws/instalar.sh` |

Um commit que falhou ao montar ou subir não é tentado de novo sozinho: mande um commit novo
ou use `--agora`.

## Custo e limpeza

- Servidor desligado: o disco e o IP fixo continuam cobrando (cerca de US$ 5 por mês).
- Servidor ligado: cerca de US$ 0,03 por hora no total. São estimativas; acompanhe o saldo no lab.
- Para apagar tudo no fim: no console da AWS, encerre (**Terminate**) a instância `gastromatch`
  e libere (**Release**) o IP fixo de mesmo nome.
- A porta 22 fica aberta, só com acesso por chave (sem senha).
