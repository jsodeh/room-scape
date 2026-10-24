#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
ROOMSCAPE_WORKFLOW_CONTAINER="roomscape-workflow-tests-$$"
trap 'docker rm -f "$ROOMSCAPE_WORKFLOW_CONTAINER" >/dev/null 2>&1 || true' EXIT
docker run --detach --rm --network none --name "$ROOMSCAPE_WORKFLOW_CONTAINER" -e POSTGRES_PASSWORD=local-test-only postgres:17-alpine >/dev/null
for attempt in {1..30}; do
  if docker exec "$ROOMSCAPE_WORKFLOW_CONTAINER" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
cat tests/backend/bootstrap.sql supabase/migrations/*.sql tests/backend/workflow.sql | docker exec -i "$ROOMSCAPE_WORKFLOW_CONTAINER" psql -U postgres --set ON_ERROR_STOP=1 --single-transaction
