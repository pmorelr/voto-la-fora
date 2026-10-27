#!/usr/bin/env bash
# Grava as chaves secretas de produção sem que apareçam na tela e configura o Supabase com elas.
# Rode você mesmo, na pasta do projeto: bash scripts/segredos-producao.sh
#   Vercel: CRON_SECRET e IP_HASH_SALT (gerados aqui), SUPABASE_SECRET_KEY (lida do projeto ligado),
#           TURNSTILE_SECRET_KEY e RESEND_API_KEY (coladas por você).
#   Supabase: captcha do Turnstile e envio de e-mails pelo Resend; depois, o modelo do e-mail com o código.
# As chaves coladas só existem na memória deste terminal enquanto o script roda.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="/opt/homebrew/bin:$PATH"
REF="$(cat supabase/.temp/project-ref)"

existentes="$(vercel env ls production 2>/dev/null || true)"
tem() { grep -qE "^[[:space:]]*$1[[:space:]]" <<<"$existentes"; }
grava() {
  if printf '%s' "$2" | vercel env add "$1" production --sensitive --yes --force >/dev/null 2>&1; then
    echo "✓ Vercel: $1"
  else
    echo "! Vercel: não consegui gravar $1"; return 1
  fi
}

for nome in CRON_SECRET IP_HASH_SALT; do
  if tem "$nome"; then echo "· Vercel: $nome já existe"; else grava "$nome" "$(openssl rand -hex 32)"; fi
done

if tem SUPABASE_SECRET_KEY; then
  echo "· Vercel: SUPABASE_SECRET_KEY já existe"
else
  chave="$(pnpm exec supabase projects api-keys --project-ref "$REF" --reveal -o json 2>/dev/null \
    | jq -r '[.[] | select(.type == "secret")][0].api_key // empty' || true)"
  if [ -n "$chave" ]; then grava SUPABASE_SECRET_KEY "$chave"; else echo "! Não achei a chave secreta do Supabase. Me avise."; fi
  unset chave
fi

read -rsp "Cole a chave secreta do Turnstile (Secret Key) e tecle Enter: " TURNSTILE_SECRET_KEY; echo
read -rsp "Cole a chave de API do Resend e tecle Enter: " RESEND_API_KEY; echo
if [ -z "$TURNSTILE_SECRET_KEY" ] || [ -z "$RESEND_API_KEY" ]; then
  echo "! Faltou uma das chaves. Rode o script de novo."; exit 1
fi
grava TURNSTILE_SECRET_KEY "$TURNSTILE_SECRET_KEY" || exit 1
grava RESEND_API_KEY "$RESEND_API_KEY" || exit 1

export TURNSTILE_SECRET_KEY RESEND_API_KEY
echo "Configurando a verificação e o envio de e-mails no Supabase..."
if printf 'y\ny\ny\n' | pnpm exec supabase config push --workdir infra/producao-segredos --project-ref "$REF" >/dev/null 2>&1; then
  echo "✓ Supabase: verificação contra robôs e envio pelo Resend"
else
  unset TURNSTILE_SECRET_KEY RESEND_API_KEY
  echo "! O Supabase recusou a configuração. Me avise no chat."; exit 1
fi
unset TURNSTILE_SECRET_KEY RESEND_API_KEY

if printf 'y\ny\ny\n' | pnpm exec supabase config push --workdir infra/producao --project-ref "$REF" >/dev/null 2>&1; then
  echo "✓ Supabase: e-mail com o código de 6 dígitos"
else
  echo "! O modelo de e-mail não entrou. Me avise no chat."
fi

echo "Pronto. Me avise no chat."
