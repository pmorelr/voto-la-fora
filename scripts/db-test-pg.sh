#!/usr/bin/env bash
# Valida migrations, seed e testes num Postgres 16 puro, sem o Supabase.
# Usa a imagem local pgvector/pgvector:pg16 (ou PG_IMAGE). Uso: pnpm db:test:pg
set -euo pipefail
cd "$(dirname "$0")/.."

NAME=votolafora-pgtest
IMAGE=${PG_IMAGE:-pgvector/pgvector:pg16}

docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -e POSTGRES_PASSWORD=postgres "$IMAGE" >/dev/null
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 60); do
  if docker logs "$NAME" 2>&1 | grep -q "PostgreSQL init process complete" \
     && docker exec "$NAME" pg_isready -U postgres -q; then
    break
  fi
  sleep 1
done

PSQL=(docker exec -i "$NAME" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)

"${PSQL[@]}" < scripts/pg-bootstrap.sql
for f in supabase/migrations/*.sql; do
  echo "# migration: $f"
  "${PSQL[@]}" < "$f"
done
echo "# seed: supabase/seed.sql"
"${PSQL[@]}" < supabase/seed.sql

for t in ${TEST_GLOB:-supabase/tests/database/*.test.sql}; do
  echo "# test: $t"
  { echo "set search_path = public, tap, extensions;"; grep -v "create extension if not exists pgtap" "$t"; } \
    | "${PSQL[@]}" -t -A
done
