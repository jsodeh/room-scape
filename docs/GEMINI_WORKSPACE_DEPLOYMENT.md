# Gemini workspace deployment

The workspace adds saved design directions, immutable image versions, edit snapshots and portable editing context. Only an explicitly chosen, versioned style profile transfers preferences to another project. Supabase remains the source of truth when a model conversation expires.

## Verified deployment and remaining gate

Target: Supabase `fkptdunoizrlkqwdmcyi`. The three additive `20261024` migrations, `design-api`, `design-worker` and the two compatibility functions are deployed. A verified `roomscape-design-worker` cron job wakes the private worker every minute. Submission also requests an immediate wake-up through `pg_net`.

An authenticated hosted smoke check verified project initialization/reopening, reference registration/removal and profile creation. Temporary test accounts, records and storage files were removed. The account's model catalog, read inside Supabase with the existing key, reports:

| Preset | Visible model | Selection |
| --- | --- | --- |
| Pro, highest detail | `gemini-3-pro-image` | Workspace default pending quality evaluation |
| Nano Banana 2.1, newest | `gemini-nano-banana-2.1` | Explicit opt-in |
| Flash, faster iteration | `gemini-3.1-flash-image` | Explicit opt-in |

On 24 October 2026, one controlled 2K Pro request received **HTTP 429**. No image was returned. The evaluator stopped without automatic retry or alternative-model generation and cleaned up its test records/files. A 429 can indicate rate limiting, exhausted quota or unavailable paid-tier quota; the exact account-side cause is not established. Model listing does not prove inference access.

Inspect the Google Cloud project owning this AI Studio key: usage/rate limits, billing/paid-tier status and the selected model's quota. Google's [rate-limit](https://ai.google.dev/gemini-api/docs/rate-limits) and [billing](https://ai.google.dev/gemini-api/docs/billing) guides describe those controls. Successful images, live continuation, actual resolution/latency, reference fidelity and a Pro/2.1 quality comparison remain acceptance gates. Production rollout stays disabled until those pass.

## Environment inventory

| Location | Variable | Purpose/default |
| --- | --- | --- |
| Vercel Preview/local | `VITE_WORKSPACE_V2` | `true` enables the workspace; unset/`false` retains the existing studio. Enable the implementation branch Preview first. |
| Vercel Production | `VITE_WORKSPACE_V2` | Keep unset/`false` until live acceptance; changing a Vite variable requires a deployment. |
| Vercel/local | `VITE_SUPABASE_URL` | `https://fkptdunoizrlkqwdmcyi.supabase.co` |
| Vercel/local | `VITE_SUPABASE_ANON_KEY` | This project's public client key; already set for Production and Preview. |
| Supabase Edge secret | `GEMINI_API_KEY` | Existing AI Studio key, never exported to Vite or evaluation reports. |
| Supabase Edge configuration | `GEMINI_ANALYSIS_MODEL` | Structured photograph analysis; default `gemini-2.5-flash`. |
| Supabase Edge configuration | `GEMINI_QUALITY_MODEL`, `GEMINI_NEXT_MODEL`, `GEMINI_FAST_MODEL` | Optional catalog-validated overrides of the corresponding workspace preset. |
| Supabase Edge configuration | `GEMINI_WORKFLOW_API` | Default `interactions`; explicit `generateContent` selects fresh portable snapshots. No automatic API fallback. |
| Edge secret / Supabase Vault | `ROOMSCAPE_WORKER_TOKEN` / `roomscape_worker_token` | Matching private worker credential, already generated/configured. Rotate both together. Never commit or print it. |
| Supabase runtime | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Managed server variables; never frontend credentials. |
| Deployment environment | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `VERCEL_TOKEN` | Existing management bindings and exact project ref. |

`IMAGE_PROVIDER`, `GEMINI_IMAGE_MODEL` and `STABILITY_API_KEY` control the **legacy synchronous endpoint**. Its Gemini default remains `gemini-2.5-flash-image`. They do not select the workspace model or enable cross-provider fallback. The legacy endpoint refuses to edit projects migrated to workspace history, preventing older browser tabs from bypassing version/job controls.

## API and context behavior

The backend pins `@google/genai@2.31.0` and the Gemini Developer API. Interactions uses labelled image inputs, a compatible `previous_interaction_id`, and `response_format: { type: 'image', image_size: '2K', mime_type: 'image/jpeg', delivery: 'inline' }`. Deprecated Interactions `response_modalities`/`image_config` are omitted. The explicit generateContent adapter uses that API's `responseModalities` and `imageConfig` fields instead. Both configured and returned model IDs are stored.

Response parsing handles current `output_image`, older output envelopes and generateContent candidates. Thought images are excluded. Actual JPEG/PNG/WebP signatures and dimensions are checked before storing the correct MIME type and extension.

Inputs have separate roles: edit canvas, original geometry anchor, and up to three style/palette/material/furniture/layout references. Analysis returns structured observations and uncertainty. Only user-selected attributes become textual guidance; analysis never overwrites room notes. Each purpose permits one primary reference. A specific primary materials source overrides generic style-material suggestions. The applied-influences panel shows the saved brief and selected guidance before generation.

Continuation requires the same branch, context epoch, references/roles/scopes, model, resolution and API. Manual brief changes, reference removal/replacement, profile application, forks, one-off inputs, incompatible settings or expired history force a fresh conversation. Compatible conversations reset after eight turns. Saved branch instructions rebuild context independently of Google history; one-off instructions are omitted from later instruction history. Existing visible image changes remain in the canvas. A fresh direction can omit previous instructions while retaining the selected image, brief and references.

Portable instructions are bounded to 64 entries / 30,000 characters. Exceeding that limit explicitly requests a fresh direction rather than silently discarding constraints; all earlier saved turns remain. Architectural locks constrain the model request but do not guarantee pixel-perfect geometry.

“Delete model conversations” immediately disables reuse for the room, changes context epochs and queues Google Interactions deletion. Safe deletion retries continue in the worker; not-found/expired results count as removed. Saved images/snapshots/instructions remain. The action is refused while generation/recovery is active. It does not erase visible image effects or promise immediate deletion from all provider retention systems.

## Queue, limits and recovery

Submission freezes the selected base, context and model settings. A repeated client action UUID returns the existing job; different inputs with that UUID conflict. One unresolved job per branch, transactional claims, optimistic context revisions and a four-minute lease handle concurrent tabs/workers. Late results remain reviewable but cannot replace a changed branch head.

Inference uses one SDK attempt and a 110-second timeout. Interrupted leases become `needs_recovery`, with no blind paid retry. If an interaction ID arrived, recovery retrieves its existing output. Otherwise, end the uncertain job before explicitly requesting another render. Cancellation after dispatch cannot promise that inference or billing stopped. Cancellation and claim races are handled under a database row lock.

Current inputs are inline. Browser originals/references are normalized to JPEG, max 2048px and under 4 MB, then validated server-side. Total provider inputs above 14 MB and individual editing inputs above 20 MB are rejected with an actionable message. Outputs support actual JPEG/PNG/WebP up to 50 MB. Larger editing inputs need a future Files API/downsampling path. The existing public image-URL model remains: project/history rows are private, while anyone possessing a public image URL can fetch that image.

## Deploy, verify and roll back

```sh
python3 scripts/deploy-design-workflow.py          # read-only preflight
python3 scripts/deploy-design-workflow.py --apply  # additive migrations/functions
python3 scripts/configure-design-worker.py        # credential/schedule/catalog probe
npm run typecheck
VITE_WORKSPACE_V2=true npm run build
npm run test:e2e
npx playwright test --config playwright.workspace.config.ts
bash tests/backend/run-workflow-tests.sh
deno test --config supabase/functions/deno.json --allow-env --allow-read --allow-net tests/backend/security_test.ts tests/backend/workflow_test.ts tests/backend/worker_test.ts
python3 scripts/evaluate-design-workflow.py        # hosted smoke, zero image generations
python3 scripts/evaluate-design-workflow.py --generate  # operator-only, at most three 2K attempts
```

The live evaluator uses the repository's synthetic room fixture. It attempts Pro generation, Pro refinement and a Nano Banana 2.1 comparison from the same original/brief, stopping on failure. It never runs in CI. Reports contain status/model metadata, not keys. Its attempt count is not a billing receipt. Assess geometry, edit adherence, reference leakage, consistency, latency and provider-reported cost before choosing the final default.

Local PostgreSQL 17 tests exercise real constraints/RLS with Auth/Storage stand-ins. Browser/backend fixtures verify behavior/wire contracts, not live image quality. The hosted smoke establishes deployed API/database connectivity separately.

Validate the feature-branch Preview and exact commit, then complete live acceptance. Merge the reviewed PR before enabling `VITE_WORKSPACE_V2=true` in Production and redeploying. Roll back by setting it to `false` and redeploying; preserve all additive tables/assets/jobs. Compatibility result fields keep saved workspace results viewable, while full version editing requires re-enabling the workspace. UI rollback, disabling the worker and deleting provider conversations are separate operations.
