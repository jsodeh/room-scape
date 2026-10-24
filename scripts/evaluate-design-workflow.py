#!/usr/bin/env python3
"""Operator-only hosted smoke/evaluation. Default performs zero paid generations.

Use --generate for at most three 2K requests (Pro, Pro refinement, Nano Banana 2.1).
Uses the repository's synthetic room fixture, never a user's photographs. Temporary
test account, projects and storage objects are removed even after a failed check.
Credentials are kept in process memory and never written to the report.
"""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import secrets
import time
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('deploy', ROOT / 'scripts/deploy-supabase.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)
BASE = 'https://' + deploy.PROJECT + '.supabase.co'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    image_mode = parser.add_mutually_exclusive_group()
    image_mode.add_argument('--generate', action='store_true', help='Pro generation/refinement and a Nano Banana 2.1 comparison.')
    parser.add_argument('--analyze', action='store_true', help='One explicit hosted analysis of the synthetic reference; no image-generation request.')
    image_mode.add_argument('--single-generation', action='store_true', help='One request only, including allowlisted provider diagnostics if it fails.')
    image_mode.add_argument('--two-turn', action='store_true', help='One generation and one explicit follow-up edit with the selected model.')
    parser.add_argument('--quality', choices=['lite','quality','next','fast'], default='quality')
    parser.add_argument('--turn-delay-seconds', type=int, choices=range(61), default=0)
    parser.add_argument('--output', type=Path, default=Path('/tmp/roomscape-evaluation'))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    management = deploy.ManagementAPI(os.environ['SUPABASE_ACCESS_TOKEN'])
    keys = management.request('/api-keys')
    service = next(k['api_key'] for k in keys if k['name'] == 'service_role')
    anon = next(k['api_key'] for k in keys if k['name'] == 'anon')
    report = {'generation_attempts': 0, 'checks': [], 'renders': [], 'cleanup': False}
    objects = {'room-images': [], 'design-results': []}
    user_id = None
    jwt = None

    def request(path, method='GET', body=None, credential=None, raw=False):
        credential = credential or service
        headers = {'Authorization': 'Bearer ' + credential, 'apikey': anon, 'Content-Type': 'image/png' if raw else 'application/json'}
        data = body if raw else json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=150) as response:
                value = response.read()
                return json.loads(value) if value else None
        except urllib.error.HTTPError as error:
            # Surface only application messages, never raw auth/provider responses.
            detail = ''
            if path == '/functions/v1/design-api':
                try:
                    response = json.loads(error.read())
                    detail = ': ' + response.get('error', '')
                    report['last_api_failure'] = {k: response.get(k) for k in ['error_code', 'provider_status', 'retry_after_seconds', 'request_id']}
                    report['last_api_failure']['http_status'] = error.code
                except (ValueError, AttributeError): pass
            raise RuntimeError(f'Hosted check returned HTTP {error.code} at {path.split("?")[0]}{detail}') from None
        except urllib.error.URLError:
            raise RuntimeError('Hosted check could not reach the configured Supabase project.') from None

    def api(action, **body):
        if not jwt:
            raise RuntimeError('No authenticated evaluation session is available.')
        return request('/functions/v1/design-api', 'POST', {'action': action, **body}, jwt)

    try:
        password = secrets.token_urlsafe(32)
        account = request('/auth/v1/admin/users', 'POST', {'email': f'roomscape-check-{uuid.uuid4().hex}@example.test', 'password': password, 'email_confirm': True})
        user_id = account['id']
        session = request('/auth/v1/token?grant_type=password', 'POST', {'email': account['email'], 'password': password}, anon)
        jwt = session['access_token']

        caps = api('capabilities')
        assert caps['workerReady'] and any(m['available'] for m in caps['models'])
        report['models'] = caps['models']; report['checks'].append('authenticated catalog and worker readiness')
        project_id = str(uuid.uuid4())
        path = f'{user_id}/{project_id}/synthetic-room.png'
        request('/storage/v1/object/room-images/' + path, 'POST', (ROOT / 'public/images/studio-room.png').read_bytes(), jwt, raw=True)
        objects['room-images'].append(path)
        context = {'brief': {'room': 'Living room', 'style': 'Warm modern', 'palette': 'Earth and linen', 'density': 'Balanced', 'notes': 'Keep the existing windows, doors, walls and camera viewpoint.', 'preserve': True}, 'references': [], 'profileVersionId': None}
        history = api('create', projectId=project_id, title='Temporary synthetic workflow check', originalUrl=BASE + '/storage/v1/object/public/room-images/' + path, context=context)
        root = history['versions'][0]['id']; branch = history['branches'][0]
        assert api('history', projectId=project_id)['versions'][0]['id'] == root
        report['checks'].append('project initialization and persisted history')
        ref_path = f'{user_id}/{project_id}/synthetic-reference.png'
        request('/storage/v1/object/room-images/' + ref_path, 'POST', (ROOT / 'public/images/studio-room.png').read_bytes(), jwt, raw=True)
        objects['room-images'].append(ref_path)
        reference = api('register-reference', projectId=project_id, url=BASE + '/storage/v1/object/public/room-images/' + ref_path)['asset']
        reference_context = {**branch['context'], 'references': [{'assetId': reference['id'], 'role': 'palette', 'scope': 'turn', 'priority': 'primary', 'accepted': {}}]}
        api('context', projectId=project_id, branchId=branch['id'], contextRevision=branch['context_revision'], context=reference_context)
        history = api('history', projectId=project_id); branch = history['branches'][0]
        api('context', projectId=project_id, branchId=branch['id'], contextRevision=branch['context_revision'], context={**branch['context'], 'references': []})
        profile = api('save-profile', projectId=project_id, branchId=branch['id'], name='Temporary style', guidance='Natural oak and soft linen.', includeReferences=False)
        assert any(p['latest_version_id'] == profile['versionId'] for p in api('profiles')['profiles'])
        report['checks'].append('reference attachment/removal and immutable style profile')
        if args.analyze:
            report['analysis_attempts'] = 1
            analysis = api('analyze', projectId=project_id, assetId=reference['id'], role='furniture')['analysis']
            assert analysis['role'] == 'furniture'
            report['checks'].append('hosted structured reference analysis')
        if args.generate or args.single_generation or args.two_turn:
            def render(quality, base, instruction):
                history = api('history', projectId=project_id)
                current = next(b for b in history['branches'] if b['id'] == branch['id'])
                edit_input = {'projectId': project_id, 'branchId': current['id'], 'baseVersionId': base, 'contextRevision': current['context_revision'], 'userEdit': instruction, 'scope': 'branch', 'operation': 'generate' if base == root else 'refine', 'quality': quality, 'imageSize': '1K' if quality == 'lite' else '2K', 'idempotencyKey': str(uuid.uuid4())}
                start = time.monotonic(); job = api('submit', input=edit_input)['job']; report['generation_attempts'] += 1
                assert api('submit', input=edit_input)['job']['id'] == job['id']
                for _ in range(90):
                    job = api('job', jobId=job['id'])['job']
                    if job['status'] not in ('queued', 'running', 'saving'): break
                    time.sleep(2)
                if job['status'] != 'succeeded':
                    detail = management.query("select provider_error from public.design_jobs where id='" + str(uuid.UUID(job['id'])) + "'")
                    report['generation_failure'] = {'preset': quality, 'provider': detail[0]['provider_error'] if detail else None}
                    raise RuntimeError(f"Generation ended as {job['status']}: {job.get('error_message')}")
                history = api('history', projectId=project_id)
                version = next(v for v in history['versions'] if v['id'] == job['result_version_ids'][0])
                asset = next(a for a in history['assets'] if a['id'] == version['asset_id'])
                extension = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[asset['mime_type']]
                with urllib.request.urlopen(asset['url'], timeout=30) as r: (args.output / f'{quality}-{report["generation_attempts"]}.{extension}').write_bytes(r.read())
                report['renders'].append({'preset': quality, 'configured_model': version['model'], 'returned_model': version.get('returned_model'), 'width': asset['width'], 'height': asset['height'], 'mime': asset['mime_type'], 'seconds': round(time.monotonic() - start, 1)})
                report['checks'].append('idempotent generation ' + str(report['generation_attempts']))
                return version['id']

            brief = 'Create a calm warm living room with soft cream seating, a natural oak coffee table and a muted sage rug. Keep the architecture and viewpoint exactly as in the photograph.'
            first = render('quality' if args.generate else args.quality, root, brief)
            print(json.dumps({'first_render_saved': True, 'preset': 'quality' if args.generate else args.quality}), flush=True)
            if args.two_turn:
                for _ in range(args.turn_delay_seconds):
                    time.sleep(1)
                render(args.quality, first, 'Change only the rug to muted terracotta. Keep all other furnishing, windows and viewpoint unchanged.')
            elif args.generate:
                render('quality', first, 'Change only the rug to muted terracotta. Keep all other furnishing, windows and viewpoint unchanged.')
                fork = api('fork', projectId=project_id, versionId=root, name='Temporary comparison')['branch']
                branch = fork
                render('next', root, brief)
            rows = management.query("select max((state->>'turns')::int) as turns from public.design_provider_states where user_id='" + user_id + "'")
            report['max_provider_turns'] = rows[0]['turns']
        print(json.dumps({k: v for k, v in report.items() if k != 'cleanup'}), flush=True)
    except (RuntimeError, KeyError, AssertionError, StopIteration) as error:
        report['error'] = str(error) or type(error).__name__
        print(json.dumps({'error': report['error'], 'generation_attempts': report['generation_attempts']}), flush=True)
    finally:
        if user_id:
            try:
                # Do not discard recovery identifiers while a dispatched worker
                # may still be saving. This loop makes no inference requests.
                for _ in range(75):
                    running = management.query("select id from public.design_jobs where user_id='" + user_id + "' and status in ('running','saving')")
                    if not running:
                        break
                    time.sleep(2)
                if running:
                    raise RuntimeError('A test worker is still active; preserve its records for recovery.')
                management.query("update public.design_jobs set status='cancelled',cancel_requested=true where user_id='" + user_id + "' and status in ('queued','needs_recovery')", False)
                projects = management.query("select id from public.staging_projects where user_id='" + user_id + "'")
                for project in projects:
                    api('forget-conversations', projectId=project['id'])
                for _ in range(10):
                    pending = management.query("select count(*) as total from public.design_provider_states where user_id='" + user_id + "'")[0]['total']
                    if not pending:
                        break
                    management.query("select public.design_dispatch_worker('work')", False)
                    time.sleep(2)
                if pending:
                    raise RuntimeError('Provider deletion still pending; preserve test records until it completes.')
                assets = management.query("select bucket,storage_path from public.design_assets where user_id='" + user_id + "'")
                for asset in assets: objects.setdefault(asset['bucket'], []).append(asset['storage_path'])
                for bucket, paths in objects.items():
                    if paths: request('/storage/v1/object/' + bucket, 'DELETE', {'prefixes': list(set(paths))})
                request('/auth/v1/admin/users/' + user_id, 'DELETE')
                report['cleanup'] = True
            except RuntimeError:
                report['cleanup'] = False
                report['cleanup_user_id'] = user_id
        (args.output / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps({'cleanup': report['cleanup'], 'report': str(args.output / 'report.json')}), flush=True)
    if report.get('error') or not report['cleanup']: raise SystemExit(1)


if __name__ == '__main__':
    main()
