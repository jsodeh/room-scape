#!/usr/bin/env python3
"""Deploy the additive design workflow. Requires the existing management binding."""
import argparse
import importlib.util
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('supabase_deploy', ROOT / 'scripts/deploy-supabase.py')
legacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(legacy)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--migrations-only', action='store_true')
    parser.add_argument('--functions-only', action='store_true')
    args = parser.parse_args()
    if args.migrations_only and args.functions_only:
        parser.error('Choose one deployment subset.')
    token = os.environ.get('SUPABASE_ACCESS_TOKEN')
    if not token:
        raise RuntimeError('The Supabase management binding is required.')
    if os.environ.get('SUPABASE_PROJECT_REF', legacy.PROJECT) != legacy.PROJECT:
        raise RuntimeError('SUPABASE_PROJECT_REF does not identify the intended Roomscape project.')
    api = legacy.ManagementAPI(token)
    if api.request('')['id'] != legacy.PROJECT:
        raise RuntimeError('Unexpected target project.')
    migrations = sorted(p for p in (ROOT / 'supabase/migrations').glob('*.sql') if p.name.split('_', 1)[0] > legacy.VERSION)
    tracked = {row['version']: row for row in api.query('select version,statements from supabase_migrations.schema_migrations')}
    if legacy.VERSION not in tracked:
        raise RuntimeError('Deploy the initial Roomscape backend before its additive workflow migrations.')
    for path in migrations:
        version, name = path.stem.split('_', 1)
        if version in tracked:
            if tracked[version]['statements'] != [path.read_text()]:
                raise RuntimeError('Local migration differs from the recorded deployment: ' + version)
            print('Migration already recorded:', version)
            continue
        if args.apply and args.functions_only:
            raise RuntimeError('Apply pending migrations before deploying functions: ' + version)
        print('Pending migration:', version, name)
        if args.apply and not args.functions_only:
            sql = path.read_text()
            stored = sql.replace("'", "''")
            api.query("begin; select pg_advisory_xact_lock(hashtext('roomscape-design-workflow')); " + sql +
                      f"\ninsert into supabase_migrations.schema_migrations(version,name,statements) values('{version}','{name}',array['{stored}']); commit;", False)
            print('Applied:', version)
    functions = {'design-api': True, 'design-worker': False, 'generate-staged-room': True, 'gemini-analyzer': True}
    if args.apply and not args.migrations_only:
        for slug, jwt in functions.items():
            api.deploy_function(slug, verify_jwt=jwt)
            print('Deployed:', slug)
        observed = api.request('/functions')
        for slug, jwt in functions.items():
            found = next((f for f in observed if f.get('slug') == slug), None)
            if not found or found.get('status') != 'ACTIVE' or found.get('verify_jwt') is not jwt:
                raise RuntimeError('Deployment verification failed for ' + slug)
    if not args.apply:
        print('Read-only preflight complete. Use --apply to deploy.')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, KeyError, ValueError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
