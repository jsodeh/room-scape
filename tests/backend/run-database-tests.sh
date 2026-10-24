#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
ROOMSCAPE_TEST_CONTAINER="roomscape-policies-$$"
trap 'docker rm -f "$ROOMSCAPE_TEST_CONTAINER" >/dev/null 2>&1 || true' EXIT
docker run --detach --rm --network none --name "$ROOMSCAPE_TEST_CONTAINER" \
  -e POSTGRES_PASSWORD=local-test-only postgres:17-alpine >/dev/null
for attempt in {1..30}; do
  if docker exec "$ROOMSCAPE_TEST_CONTAINER" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
cat tests/backend/bootstrap.sql supabase/migrations/20261023000100_roomscape.sql tests/backend/policies.sql | \
  docker exec -i "$ROOMSCAPE_TEST_CONTAINER" psql -U postgres --set ON_ERROR_STOP=1 --single-transaction
