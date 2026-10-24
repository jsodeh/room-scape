#!/usr/bin/env python3
"""Inspect or deploy the new Roomscape backend through the Supabase Management API.

Requires SUPABASE_ACCESS_TOKEN in the environment. No database password is needed.
Defaults to a read-only check; --apply deploys the migration and both functions.
"""
import argparse
import json
import os
from pathlib import Path
import sys
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
PROJECT = "fkptdunoizrlkqwdmcyi"
VERSION = "20261023000100"
MIGRATION = ROOT / "supabase/migrations/20261023000100_roomscape.sql"
FUNCTIONS = ("generate-staged-room", "gemini-analyzer")
TABLES = {"profiles", "furniture_items", "staging_projects", "project_feedback"}


class ManagementAPI:
    def __init__(self, token):
        self.token = token

    def request(self, path, method="GET", data=None, content_type="application/json"):
        if data is not None and not isinstance(data, bytes):
            data = json.dumps(data).encode()
        req = urllib.request.Request(
            "https://api.supabase.com/v1/projects/" + PROJECT + path,
            data=data,
            method=method,
            headers={"Authorization": "Bearer " + self.token, "Content-Type": content_type},
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as response:
                payload = response.read()
                return json.loads(payload) if payload else None
        except urllib.error.HTTPError as error:
            # Never print response bodies: provider responses can contain configuration.
            raise RuntimeError(f"Supabase Management API returned HTTP {error.code} for {method} {path}.") from None
        except urllib.error.URLError:
            raise RuntimeError("Supabase Management API is unreachable. Check the environment network policy.") from None

    def query(self, sql, read_only=True):
        endpoint = "/database/query/read-only" if read_only else "/database/query"
        return self.request(endpoint, "POST", {"query": sql})

    def deploy_function(self, slug):
        base = ROOT / "supabase/functions"
        paths = sorted((base / slug).glob("*.ts")) + sorted((base / "_shared").glob("*.ts"))
        paths += [base / "deno.json", base / "deno.lock"]
        boundary = "roomscape-" + uuid.uuid4().hex
        parts = []
        metadata = {"entrypoint_path": f"{slug}/index.ts", "name": slug, "verify_jwt": True}
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="metadata"\r\n\r\n'.encode() + json.dumps(metadata).encode() + b"\r\n")
        for path in paths:
            if not path.is_file():
                continue
            filename = path.relative_to(base).as_posix()
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode() + path.read_bytes() + b"\r\n")
        parts.append(f"--{boundary}--\r\n".encode())
        return self.request(f"/functions/deploy?slug={slug}", "POST", b"".join(parts), f"multipart/form-data; boundary={boundary}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Apply the schema and deploy both functions to the new project")
    args = parser.parse_args()
    token = os.environ.get("SUPABASE_ACCESS_TOKEN")
    if not token:
        raise RuntimeError("Set SUPABASE_ACCESS_TOKEN securely in environment settings. Do not paste it into chat.")
    if os.environ.get("SUPABASE_PROJECT_REF", PROJECT) != PROJECT:
        raise RuntimeError("SUPABASE_PROJECT_REF must identify fkptdunoizrlkqwdmcyi; refusing to deploy to another project.")
    api = ManagementAPI(token)
    project = api.request("")
    if project.get("id") != PROJECT:
        raise RuntimeError("The Management API did not confirm the intended project.")
    print(f"Verified target project: {PROJECT}")
    tables = api.query("select tablename from pg_tables where schemaname = 'public' and tablename in ('profiles','furniture_items','staging_projects','project_feedback')")
    table_names = {row["tablename"] for row in tables}
    history = api.query("select to_regclass('supabase_migrations.schema_migrations') is not null as present")
    tracked = []
    if history[0]["present"]:
        tracked = api.query(f"select version from supabase_migrations.schema_migrations where version = '{VERSION}'")
    buckets = api.query("select id from storage.buckets where id = 'room-images'")
    if not tracked and (table_names or buckets):
        raise RuntimeError("Existing Roomscape tables or storage bucket found without this migration. Inspect them before deployment; nothing was changed.")
    if tracked and table_names != TABLES:
        raise RuntimeError("Migration history and live schema disagree. Inspect the project before deployment.")
    if not args.apply:
        print("Read-only preflight passed. Migration:", "already recorded" if tracked else "not yet applied")
        print("Use --apply to deploy the database and both Edge Functions.")
        return
    if not tracked:
        sql = MIGRATION.read_text()
        stored = sql.replace("'", "''")
        api.query("begin; select pg_advisory_xact_lock(hashtext('roomscape-initial-schema')); "
                  "create schema if not exists supabase_migrations; "
                  "create table if not exists supabase_migrations.schema_migrations "
                  "(version text primary key, statements text[], name text); " + sql +
                  f"\ninsert into supabase_migrations.schema_migrations(version, statements, name) values ('{VERSION}', array['{stored}'], 'roomscape'); commit;", False)
        print("Database migration applied and recorded.")
    else:
        print("Database migration already recorded; no schema changes made.")
    for slug in FUNCTIONS:
        api.deploy_function(slug)
        print(f"Deployment request completed: {slug} (JWT verification required)")
    deployed = api.request("/functions")
    for slug in FUNCTIONS:
        found = next((item for item in deployed if item.get("slug") == slug or item.get("name") == slug), None)
        if not found or found.get("status") != "ACTIVE" or found.get("verify_jwt") is not True:
            raise RuntimeError(f"Deployment verification did not confirm an ACTIVE, JWT-protected {slug}.")
        print(f"Verified active function: {slug}")
    names = {item["name"] for item in api.request("/secrets")}
    for name in ("GEMINI_API_KEY", "STABILITY_API_KEY", "IMAGE_PROVIDER", "GEMINI_IMAGE_MODEL", "GEMINI_ANALYSIS_MODEL"):
        print(f"Edge configuration {name}: {'present' if name in names else 'not set'}")
    print("Configure provider secrets and Auth URLs as documented in docs/SUPABASE_DEPLOYMENT.md.")
    print("Deployment verification does not establish live AI quality or a working frontend until its public key is configured.")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, KeyError, ValueError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
