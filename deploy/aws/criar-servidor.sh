#!/usr/bin/env bash
# Rode no terminal do AWS Academy Learner Lab (com o lab ligado).
# Cria o servidor do GastroMatch: firewall, EC2 com Ubuntu e IP fixo.
# Pode rodar de novo: o que já existe é reaproveitado.
set -euo pipefail

export AWS_DEFAULT_REGION=us-east-1
export AWS_PAGER=""

NOME=gastromatch
TIPO=t3.small
DISCO_GB=30
CHAVE=vockey # chave SSH que o Learner Lab já cria
AMI_PARAMETRO=/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id

echo "1/3 Firewall (portas 22, 80 e 443)"
VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$NOME" "Name=vpc-id,Values=$VPC" \
  --query 'SecurityGroups[0].GroupId' --output text)
if [ "$SG" = "None" ]; then
  SG=$(aws ec2 create-security-group --group-name "$NOME" --description "GastroMatch SSH HTTP HTTPS" \
    --vpc-id "$VPC" --query GroupId --output text)
fi
for PORTA in 22 80 443; do
  if ! SAIDA=$(aws ec2 authorize-security-group-ingress --group-id "$SG" --protocol tcp --port "$PORTA" \
    --cidr 0.0.0.0/0 2>&1); then
    case "$SAIDA" in
      *InvalidPermission.Duplicate*) ;; # a porta já estava liberada
      *) echo "$SAIDA" >&2; exit 1 ;;
    esac
  fi
done

echo "2/3 Servidor EC2 ($TIPO, $DISCO_GB GB)"
ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=$NOME" Name=instance-state-name,Values=pending,running,stopping,stopped \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)
if [ "$ID" = "None" ]; then
  AMI=$(aws ssm get-parameter --name "$AMI_PARAMETRO" --query Parameter.Value --output text)
  ID=$(aws ec2 run-instances --image-id "$AMI" --instance-type "$TIPO" --key-name "$CHAVE" \
    --security-group-ids "$SG" \
    --block-device-mappings "DeviceName=/dev/sda1,Ebs={VolumeSize=$DISCO_GB,VolumeType=gp3}" \
    --metadata-options HttpTokens=required \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$NOME}]" \
      "ResourceType=volume,Tags=[{Key=Name,Value=$NOME}]" \
    --query 'Instances[0].InstanceId' --output text)
else
  echo "    já existe: $ID"
  aws ec2 start-instances --instance-ids "$ID" >/dev/null 2>&1 || true
fi
aws ec2 wait instance-running --instance-ids "$ID"

echo "3/3 IP fixo"
ALOCACAO=$(aws ec2 describe-addresses --filters "Name=tag:Name,Values=$NOME" \
  --query 'Addresses[0].AllocationId' --output text)
if [ "$ALOCACAO" = "None" ]; then
  ALOCACAO=$(aws ec2 allocate-address --domain vpc \
    --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=$NOME}]" \
    --query AllocationId --output text)
fi
aws ec2 associate-address --instance-id "$ID" --allocation-id "$ALOCACAO" >/dev/null
IP=$(aws ec2 describe-addresses --allocation-ids "$ALOCACAO" --query 'Addresses[0].PublicIp' --output text)

cat <<FIM

Servidor pronto.
  IP:      $IP
  Site:    https://${IP//./-}.sslip.io  (só abre depois da instalação)

Agora espere 1 minuto e entre no servidor:
  ssh -i ~/.ssh/labsuser.pem ubuntu@$IP
FIM
