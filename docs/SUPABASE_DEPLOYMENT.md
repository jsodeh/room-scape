Roomscape uses Supabase project `fkptdunoizrlkqwdmcyi` and frontend https://room-scape-omega.vercel.app . The old project is no longer a runtime fallback. This page describes the initial backend and compatibility endpoints. For persistent editing, new models, worker and feature flag, see [Gemini workspace deployment](GEMINI_WORKSPACE_DEPLOYMENT.md).

| Location | Variable | Correct value or source |
| --- | --- | --- |
| Vercel Production/Preview/Development; local `.env.local` | `VITE_SUPABASE_URL` | `https://fkptdunoizrlkqwdmcyi.supabase.co` |
| Same frontend environments | `VITE_SUPABASE_ANON_KEY` | This new project's public anon/publishable API key from its API settings. Required; never reuse the old project's key. |
| Cloud deployment environment only | `SUPABASE_PROJECT_REF` | `fkptdunoizrlkqwdmcyi` |
| Cloud deployment environment only | `SUPABASE_ACCESS_TOKEN` | Supabase Management API token with access to this project, supplied securely in environment settings. Not a frontend variable. |
| Supabase Edge secrets | `GEMINI_API_KEY` | Google AI API key; required for reference analysis and Gemini generation. Set directly in Supabase's secrets UI. |
| Supabase Edge secrets | `STABILITY_API_KEY` | Stability API key, required only when selecting Stability generation. Set directly in Supabase's secrets UI. |
| Supabase Edge configuration | `IMAGE_PROVIDER` | `gemini` or `stability`. Defaults to Gemini when its key exists, otherwise Stability. Selection is explicit; failed inference is not automatically retried with a second paid provider. |
| Supabase Edge configuration | `GEMINI_IMAGE_MODEL` | Defaults to `gemini-2.5-flash-image`; select an image-capable model available to your account. Live availability remains unverified. |
| Supabase Edge configuration | `GEMINI_ANALYSIS_MODEL` | Configured/default `gemini-3.1-flash-lite`. Shared by both analysis endpoints; a real hosted workspace analysis passed. |
| Managed Edge runtime | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase supplies these for the deployed project. Do not copy service-role credentials to Vercel/Vite frontend variables. |

The application requires a public client key at startup, and the build refuses to run when it is absent. Copy `.env.example` to `.env.local` and confirm its public key belongs to this project. Only public client configuration can be committed; service-role/provider/management keys remain server-side. Vercel must receive both frontend variables and rebuild before a connection change takes effect.

Deployment from the repository root:

```sh
# Uses a securely supplied SUPABASE_ACCESS_TOKEN; does not need a database password.
python3 scripts/deploy-supabase.py
python3 scripts/deploy-supabase.py --apply
```

The first command performs a read-only preflight. The second verifies the project, checks for conflicting existing tables/buckets, applies the initial migration transactionally, records its version, deploys both functions through the Management API, verifies their active/JWT settings, and reports secret names/presence without printing values. It intentionally stops if existing Roomscape tables or a bucket have no matching migration history. Do not reset or drop a non-empty project to bypass this check.

The initial migration creates the four application tables, indexes, signup/profile and timestamp triggers, ownership/admin policies, and `room-images` storage bucket. Authentication is required for user records and uploads. Furniture administration requires trusted `app_metadata.role = admin`, set through a privileged backend/dashboard operation. User-editable metadata cannot grant administration. Normal clients cannot write generation status or result columns.

Image uploads use `<user-id>/<folder>/<filename>`. The bucket is public because the existing app and model-fetch flow use public image URLs. Storage writes are restricted to the caller's own folder, with PDF resources restricted to administrators. Making room images private requires signed-URL handling and corresponding backend changes; it is not accomplished by changing bucket visibility alone.

Both functions require JWT verification and additionally verify the caller with Supabase Auth. Generation checks project ownership, verifies the submitted original image against the project, and claims the project before contacting a provider. Analysis only accepts an asset in the caller's storage folder. Downloads have MIME, size, redirect, and timeout limits. Provider requests have timeouts. This synchronous flow is not a durable job queue; an interrupted process can require recovery of a project left in `processing`.

In Supabase Auth settings, set Site URL to `https://room-scape-omega.vercel.app`, and allow the exact production/local callback URLs you use. Local development runs on port 8080. Preview deployments need intentionally allowed callbacks if authentication is tested there. Email provider/SMTP settings and the complete password-recovery UI are separate outstanding checks.

Vercel uses the committed Vite configuration (`npm run build`, output `dist`) and SPA routing rewrite. Set the new project's two frontend variables before deploying this branch. Provider keys and management/service-role tokens belong only in server/deployment environments. No Neon database is required by this application.

Validation commands:

```sh
npm run typecheck
npm run build
npm run test:e2e
bash tests/backend/run-database-tests.sh
deno check --config supabase/functions/deno.json supabase/functions/generate-staged-room/index.ts supabase/functions/gemini-analyzer/index.ts
deno test --config supabase/functions/deno.json --allow-env tests/backend/security_test.ts
python3 -m unittest discover -s tests/backend -p 'test_*.py'
```

Database tests use an isolated PostgreSQL 17 container with test-only stand-ins for Supabase's managed auth/storage schemas. They exercise actual PostgreSQL policies and grants, not deployed Supabase services. Browser and Deno tests mock remote requests. Passing them does not prove that a remote deployment occurred or that live paid generation works.
