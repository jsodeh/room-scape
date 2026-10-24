#!/usr/bin/env python3
"""Enable the worker schedule; credentials stay in Supabase secrets/Vault."""
import importlib.util
import json
import os
from pathlib import Path
import secrets
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('supabase_deploy', ROOT / 'scripts/deploy-supabase.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


def main():
    api = deploy.ManagementAPI(os.environ['SUPABASE_ACCESS_TOKEN'])
    if api.request('')['id'] != deploy.PROJECT:
        raise RuntimeError('Unexpected project.')
    api.query('update public.design_capabilities set worker_ready=false where id=true', False)
    present = api.query("select id from vault.secrets where name='roomscape_worker_token'")
    if not present:
        value = secrets.token_urlsafe(48)
        api.request('/secrets', 'POST', [{'name': 'ROOMSCAPE_WORKER_TOKEN', 'value': value}])
        api.request('/database/query', 'POST', {'query': "select vault.create_secret($1,'roomscape_worker_token','Roomscape internal worker authentication')", 'parameters': [value]})
        print('Configured internal worker credential.')
    api.query((ROOT / 'supabase/design-worker-schedule.sql').read_text(), False)
    request = api.query("select public.design_dispatch_worker('models') as id", False)[0]['id']
    response = None
    for _ in range(20):
        rows = api.query(f'select status_code,content from net._http_response where id={int(request)}')
        if rows:
            response = rows[0]
            break
        time.sleep(1)
    if not response or response['status_code'] != 200:
        raise RuntimeError('Worker model-catalog probe failed; worker readiness remains disabled.')
    content = json.loads(response['content'])
    if not any(item['available'] for item in content['models']):
        raise RuntimeError('No configured image model is visible to the Gemini project.')
    active = api.query("select count(*) as count from cron.job where jobname='roomscape-design-worker' and active")[0]['count']
    if active != 1:
        raise RuntimeError('Worker schedule verification failed.')
    api.query('update public.design_capabilities set worker_ready=true where id=true', False)
    print(json.dumps({'worker_schedule_active': True, 'models': content['models']}))


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, KeyError, ValueError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
