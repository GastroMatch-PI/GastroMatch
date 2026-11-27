#!/usr/bin/env bash
# Rode DENTRO do EC2:  sudo bash instalar.sh
# Instala o Docker, baixa o projeto, pede as senhas, publica o site e liga a atualização automática.
# Para trocar de branch depois:  sudo BRANCH=main bash instalar.sh  (as senhas são mantidas)
set -euo pipefail

BRANCH=${BRANCH:-main}
GITHUB_REPO=${GITHUB_REPO:-GastroMatch-PI/GastroMatch}
DIR=/opt/gastromatch
ENV_FILE=/etc/gastromatch.env
CONF=/etc/gastromatch.conf

[ "$(id -u)" = "0" ] || { echo "Rode com sudo." >&2; exit 1; }

# Pergunta um valor e guarda na variável $1. "oculto" não mostra o que é digitado.
perguntar() {
  local variavel=$1 texto=$2 modo=${3:-visivel} valor=""
  if [ "$modo" = "oculto" ]; then
    read -rsp "$texto: " valor
    echo
  else
    read -rp "$texto: " valor
  fi
  case "$valor" in
    *\'*) echo "O valor não pode ter aspas simples (')." >&2; exit 1 ;;
  esac
  printf -v "$variavel" '%s' "$valor"
}

echo "== 1/5 Programas"
apt-get update -q
DEBIAN_FRONTEND=noninteractive apt-get install -yq docker.io docker-compose-v2 docker-buildx git curl openssl python3
systemctl enable --now docker

echo "== 2/5 Memória extra (swap) para montar o projeto"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

echo "== 3/5 Código ($BRANCH)"
[ -d "$DIR/.git" ] || git clone -q "https://github.com/$GITHUB_REPO.git" "$DIR"
git -C "$DIR" fetch -q origin "$BRANCH"
git -C "$DIR" checkout -qf -B "$BRANCH" FETCH_HEAD

echo "== 4/5 Configuração"
if [ -f "$ENV_FILE" ]; then
  echo "Já existe $ENV_FILE; mantendo. (Para refazer: sudo rm $ENV_FILE e rode de novo.)"
else
  echo "Copie os valores do Render (Environment). O que é senha não aparece na tela."
  perguntar DB_URL "DB_URL (começa com jdbc:postgresql://)"
  case "$DB_URL" in
    jdbc:postgresql://*) ;;
    *) echo "DB_URL precisa começar com jdbc:postgresql://" >&2; exit 1 ;;
  esac
  perguntar DB_USERNAME "DB_USERNAME"
  perguntar DB_PASSWORD "DB_PASSWORD" oculto
  [ -n "$DB_USERNAME" ] && [ -n "$DB_PASSWORD" ] || { echo "Usuário e senha são obrigatórios." >&2; exit 1; }
  perguntar SUPABASE_URL "SUPABASE_URL (Enter para guardar imagens no próprio servidor)"
  SUPABASE_SERVICE_KEY=""
  SUPABASE_BUCKET=""
  if [ -n "$SUPABASE_URL" ]; then
    perguntar SUPABASE_SERVICE_KEY "SUPABASE_SERVICE_KEY" oculto
    perguntar SUPABASE_BUCKET "SUPABASE_BUCKET (Enter = imagens)"
  fi

  TOKEN=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')
  IP=$(curl -fsS -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)

  (
    umask 077
    cat >"$ENV_FILE" <<FIM
SITE_ADDRESS='${IP//./-}.sslip.io'
DB_URL='$DB_URL'
DB_USERNAME='$DB_USERNAME'
DB_PASSWORD='$DB_PASSWORD'
JWT_SECRET='$(openssl rand -base64 48 | tr -d '\n')'
SUPABASE_URL='$SUPABASE_URL'
SUPABASE_SERVICE_KEY='$SUPABASE_SERVICE_KEY'
SUPABASE_BUCKET='${SUPABASE_BUCKET:-imagens}'
FIM
  )
fi

# Só a main tem CI a cada push; em outra branch (teste) publica sem esperar.
EXIGIR_CI=nao
[ "$BRANCH" = "main" ] && EXIGIR_CI=sim
cat >"$CONF" <<FIM
BRANCH=$BRANCH
GITHUB_REPO=$GITHUB_REPO
EXIGIR_CI=$EXIGIR_CI
FIM

echo "== 5/5 Publicando (a primeira vez leva alguns minutos)"
cat >/etc/systemd/system/gastromatch-atualizar.service <<FIM
[Unit]
Description=Atualiza o GastroMatch quando a branch muda no GitHub
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/bash $DIR/deploy/aws/atualizar.sh
TimeoutStartSec=30min
FIM
cat >/etc/systemd/system/gastromatch-atualizar.timer <<'FIM'
[Unit]
Description=Procura versão nova do GastroMatch a cada 2 minutos

[Timer]
OnBootSec=1min
OnUnitInactiveSec=2min

[Install]
WantedBy=timers.target
FIM
systemctl daemon-reload
systemctl stop gastromatch-atualizar.timer 2>/dev/null || true
if ! bash "$DIR/deploy/aws/atualizar.sh" --agora; then
  echo "A publicação falhou. Se o erro for de senha ou endereço do banco:" >&2
  echo "  sudo rm $ENV_FILE   e rode a instalação de novo." >&2
  exit 1
fi
systemctl enable --now gastromatch-atualizar.timer

# shellcheck disable=SC1090
SITE=$(. "$ENV_FILE" && echo "$SITE_ADDRESS")
echo
echo "Pronto: https://$SITE"
echo "A cada 2 minutos o servidor procura commits novos em '$BRANCH'."
