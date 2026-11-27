#!/usr/bin/env bash
# Publica a versão mais nova da branch. O systemd chama a cada 2 minutos.
#   sudo bash atualizar.sh          publica só se houver commit novo (e, na main, com o CI verde)
#   sudo bash atualizar.sh --agora  publica de qualquer jeito (primeira vez ou nova tentativa)
set -euo pipefail

DIR=/opt/gastromatch
ENV_FILE=/etc/gastromatch.env
CONF=/etc/gastromatch.conf
ESTADO=/var/lib/gastromatch

compose() {
  docker compose --env-file "$ENV_FILE" -f "$DIR/deploy/aws/docker-compose.yml" "$@"
}

# Responde "ok", "falhou" ou "esperando" conforme as verificações do commit no GitHub.
situacao_ci() {
  curl -fsS -H 'Accept: application/vnd.github+json' \
    "https://api.github.com/repos/$GITHUB_REPO/commits/$1/check-runs?per_page=100" |
    python3 -c '
import json, sys
rodadas = json.load(sys.stdin)["check_runs"]
if not rodadas or any(r["status"] != "completed" for r in rodadas):
    print("esperando")
elif all(r["conclusion"] in ("success", "skipped", "neutral") for r in rodadas):
    print("ok")
else:
    print("falhou")
' 2>/dev/null || echo esperando
}

senha_recusada() {
  local registros
  # Todo o log desde o início desta publicação: depois da recusa o Spring escreve centenas de
  # linhas de erro, e olhar só o final do log deixaria a mensagem passar.
  registros=$(compose logs --no-color --since "$INICIO" api 2>/dev/null) || return 1
  [[ $registros == *"password authentication failed"* || $registros == *ECIRCUITBREAKER* ]]
}

api_no_ar() {
  local _
  for _ in $(seq 1 90); do
    if compose exec -T web wget -qO- http://api:8080/actuator/health 2>/dev/null | grep -q '"UP"'; then
      return 0
    fi
    ! senha_recusada || return 1
    sleep 5
  done
  return 1
}

# Tudo dentro de uma função: o git troca este arquivo enquanto ele roda.
principal() {
  local forcar=${1:-} novo ci
  # shellcheck disable=SC1090
  . "$CONF"
  mkdir -p "$ESTADO"

  exec 9>/run/gastromatch.lock
  flock -n 9 || { echo "Já há uma atualização em andamento."; return 0; }

  git -C "$DIR" fetch -q origin "$BRANCH"
  novo=$(git -C "$DIR" rev-parse FETCH_HEAD)

  if [ "$forcar" != "--agora" ]; then
    [ "$novo" != "$(cat "$ESTADO/publicado" 2>/dev/null)" ] || return 0
    [ "$novo" != "$(cat "$ESTADO/falhou" 2>/dev/null)" ] || return 0
    if [ "$EXIGIR_CI" = "sim" ]; then
      ci=$(situacao_ci "$novo")
      if [ "$ci" != "ok" ]; then
        echo "Commit ${novo:0:7}: CI $ci. Nada publicado."
        return 0
      fi
    fi
  fi

  echo "Publicando ${novo:0:7} ($BRANCH)"
  git -C "$DIR" checkout -qf -B "$BRANCH" "$novo"

  # Se a montagem falhar, a versão anterior continua no ar.
  if ! compose build; then
    echo "$novo" >"$ESTADO/falhou"
    echo "A montagem falhou. O site segue na versão anterior." >&2
    return 1
  fi

  INICIO=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  compose up -d --remove-orphans

  if ! api_no_ar; then
    echo "$novo" >"$ESTADO/falhou"
    if senha_recusada; then
      # Insistir com a senha errada pode fazer o Supabase bloquear conexões do time todo.
      compose stop api
      echo "O banco recusou a senha; a API foi parada. Refaça a configuração (ver README)." >&2
    else
      echo "A API não respondeu. Veja: sudo docker logs gastromatch-api-1 --tail 100" >&2
    fi
    return 1
  fi
  compose exec -T web caddy reload --config /etc/caddy/Caddyfile

  echo "$novo" >"$ESTADO/publicado"
  rm -f "$ESTADO/falhou"
  docker image prune -f >/dev/null
  echo "No ar: ${novo:0:7}"
}

principal "$@"; exit
