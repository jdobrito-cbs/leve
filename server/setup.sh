#!/usr/bin/env bash
# Instalação/atualização do leve-server no WSRTA.
# Roda com DOMAIN, PORT e DATABASE_URL (banco gerenciado) no ambiente.
# Primeira instalação: gera o .env com segredos únicos e mostra o ADMIN_TOKEN.
# Atualização: preserva o .env e reaplica dependências, build e migrações.
set -euo pipefail

echo "== Leve · instalação =="
echo "dominio: ${DOMAIN:-"(nao informado)"} · porta: ${PORT:-3333}"

command -v node >/dev/null 2>&1 || { echo "ERRO: Node.js nao encontrado no servidor."; exit 1; }
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "ERRO: precisa de Node.js 20 ou mais novo (encontrado $(node -v))."
  exit 1
fi

# Regrava KEY=valor no .env (sem depender de sed com caracteres especiais).
set_env() {
  local key="$1" val="$2"
  { grep -v "^${key}=" .env 2>/dev/null || true; printf '%s=%s\n' "$key" "$val"; } > .env.tmp
  mv .env.tmp .env
}

GENERATED=0
if [ ! -f .env ]; then
  echo "== Primeira instalacao: gerando .env com segredos novos =="
  ADMIN_TOKEN="$(node -p 'require("crypto").randomBytes(24).toString("hex")')"
  JWT_SECRET="$(node -p 'require("crypto").randomBytes(32).toString("hex")')"
  cat > .env <<EOF
# Gerado pelo setup.sh na instalacao — segredos unicos deste servidor.
# IA de comida (scan por foto e busca nutricional): cole a sua chave do
# OpenRouter em HUB_API_KEY e reinicie o app. Sem ela, o resto funciona.
# Obs.: o scan por foto exige modelo com visao — se este nao aceitar imagem,
# troque HUB_MODEL por um modelo de visao (confira em openrouter.ai/models).
HUB_BASE_URL=https://openrouter.ai/api/v1
HUB_API_KEY=
HUB_MODEL=google/gemma-4-26b-a4b-it:free
# Codigo do painel: pedido no cadastro do master e chave-mestra de recuperacao.
ADMIN_TOKEN=${ADMIN_TOKEN}
# Segredo das sessoes das contas do app (backup).
JWT_SECRET=${JWT_SECRET}
EOF
  chmod 600 .env
  GENERATED=1
else
  echo "== Atualizacao: .env existente preservado =="
fi

set_env PORT "${PORT:-3333}"
set_env TRUST_PROXY "1"
if [ -n "${DATABASE_URL:-}" ]; then
  set_env DATABASE_URL "$DATABASE_URL"
fi

echo "== Dependencias =="
npm ci --include=dev --no-audit --no-fund

echo "== Build =="
npx prisma generate
npm run build

if [ -n "${DATABASE_URL:-}" ]; then
  echo "== Banco: aplicando migracoes =="
  npx prisma migrate deploy
else
  echo "== Sem DATABASE_URL: chaves e administradores em ./data (arquivo) =="
fi

npm prune --omit=dev --no-audit --no-fund

# Mostra o codigo do painel em TODA execucao (instalacao e atualizacao) —
# se o painel reexecutar os passos, o codigo continua visivel no log.
TOKEN_ATUAL="$(grep '^ADMIN_TOKEN=' .env | cut -d= -f2- || true)"
echo ""
echo "==============================================================="
echo " Leve pronto."
echo ""
echo " Codigo do painel (ADMIN_TOKEN) — guarde com cuidado:"
echo ""
echo "   ${TOKEN_ATUAL:-"(nao encontrado no .env)"}"
echo ""
echo " Ele e pedido UMA vez para criar o administrador master em"
echo "   https://${DOMAIN:-seu-dominio}/painel"
echo " e e a chave-mestra de recuperacao (tambem fica no .env)."
if ! grep -q '^HUB_API_KEY=..' .env; then
  echo ""
  echo " IA de comida: cole a sua chave em HUB_API_KEY no .env e reinicie."
fi
echo "==============================================================="
