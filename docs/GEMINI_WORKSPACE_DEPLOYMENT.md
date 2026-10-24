# Gemini workspace deployment

The workspace adds saved design directions, immutable image versions, edit snapshots and portable editing context. Only an explicitly chosen, versioned style profile transfers preferences to another project. Supabase remains the source of truth when a model conversation expires.

## Verified deployment and deferred live checks

On 24 October 2026, the owner approved finalizing PR #3 and enabling the production workspace despite the external image-generation quota block. Successful image output and live multi-turn quality remain unverified follow-up work. This decision changes the rollout gate; it does not establish that generation works or change Google billing/quota settings.

Target: Supabase `fkptdunoizrlkqwdmcyi`. The five additive `20261024` migrations, `design-api`, `design-worker` and the two compatibility functions are deployed. A verified `roomscape-design-worker` cron job wakes the private worker every minute. Submission also requests an immediate wake-up through `pg_net`.

An authenticated hosted smoke check verified project initialization/reopening, reference registration/removal and profile creation. Temporary test accounts, records and storage files were removed. The account's model catalog, read inside Supabase with the existing key, reports:

| Preset | Visible model | Selection |
| --- | --- | --- |
| Lite, free-tier 1K | `gemini-3.1-flash-lite-image` | Explicit default selection for the owner's free-tier setup; project quota still applies |
| Pro, highest detail | `gemini-3-pro-image` | Explicit opt-in with appropriate API quota |
| Nano Banana 2.1, newest | `gemini-nano-banana-2.1` | Explicit opt-in |
| Flash, faster iteration | `gemini-3.1-flash-image` | Explicit opt-in |

On 24 October 2026, controlled Pro requests received **HTTP 429**. The user's saved jobs independently confirm HTTP 429 for Pro, Nano Banana 2.1 and Flash. No image was returned. No automatic inference retry or alternative-model generation occurred. A 429 can indicate rate limiting, exhausted quota or unavailable paid-tier quota; the exact account-side cause is not established. Model listing does not prove inference access. See the [failure diagnosis](GEMINI_FAILURE_DIAGNOSIS.md).

Reference analysis has a separate verified repair: the former `gemini-2.5-flash` request returned 404, and Gemini 3.8 Flash returned 504 in controlled checks. The configured analyzer is now `gemini-3.1-flash-lite`, and an authenticated hosted synthetic-image analysis completed successfully with that model. This does not establish image-generation quota.

The owner requested the separate Nano Banana 2 Lite option after confirming free-tier billing. Its catalog visibility is verified. Controlled Lite requests through Interactions and the explicit generateContent adapter both returned 429. The generateContent response named free-tier input-token/minute, request/minute and request/day limits and suggested a retry delay of approximately 15 hours. Numeric quota allocations/usage were not returned. A successful free-tier image has **not** been verified; check the owner's AI Studio quota view to distinguish exhausted allowance from an unavailable allocation. No follow-up edit was dispatched after the initial render failed.

Inspect the Google Cloud project owning this AI Studio key: usage/rate limits, billing/paid-tier status and the selected model's quota. Google's [rate-limit](https://ai.google.dev/gemini-api/docs/rate-limits) and [billing](https://ai.google.dev/gemini-api/docs/billing) guides describe those controls. Google AI Pro family membership is a consumer subscription; Gemini API billing and quota for the key's Cloud project are separate. Successful images, live continuation, actual resolution/latency, reference fidelity and a Pro/2.1 quality comparison remain deferred acceptance checks under the owner's release decision.

## Environment inventory

| Location | Variable | Purpose/default |
| --- | --- | --- |
| Vercel Preview/local | `VITE_WORKSPACE_V2` | `true` enables the workspace; unset/`false` retains the existing studio. Enable the implementation branch Preview first. |
| Vercel Production | `VITE_WORKSPACE_V2` | Set `true` for the owner-approved rollout; unset/`false` rolls back the UI. Changing a Vite variable requires a deployment. |
| Vercel/local | `VITE_SUPABASE_URL` | `https://fkptdunoizrlkqwdmcyi.supabase.co` |
| Vercel/local | `VITE_SUPABASE_ANON_KEY` | This project's public client key; already set for Production and Preview. |
| Supabase Edge secret | `GEMINI_API_KEY` | Existing AI Studio key, never exported to Vite or evaluation reports. |
| Supabase Edge configuration | `GEMINI_ANALYSIS_MODEL` | Configured/default `gemini-3.1-flash-lite`. The workspace's structured reference-analysis path passed a real hosted check. |
| Supabase Edge configuration | `GEMINI_LITE_MODEL`, `GEMINI_QUALITY_MODEL`, `GEMINI_NEXT_MODEL`, `GEMINI_FAST_MODEL` | Optional catalog-validated overrides of the corresponding workspace preset. |
| Supabase Edge configuration | `GEMINI_WORKFLOW_API` | Default `interactions` for Pro/2.1/Flash; explicit `generateContent` selects fresh portable snapshots. No automatic API fallback. |
| Supabase Edge configuration | `GEMINI_LITE_API` | Default `generateContent` for Lite. Can explicitly select `interactions`; there is no failure-triggered API switching. The chosen API is frozen in each turn manifest. |
| Edge secret / Supabase Vault | `ROOMSCAPE_WORKER_TOKEN` / `roomscape_worker_token` | Matching private worker credential, already generated/configured. Rotate both together. Never commit or print it. |
| Supabase runtime | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Managed server variables; never frontend credentials. |
| Deployment environment | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `VERCEL_TOKEN` | Existing management bindings and exact project ref. |

`IMAGE_PROVIDER`, `GEMINI_IMAGE_MODEL` and `STABILITY_API_KEY` control the **legacy synchronous endpoint**. Its Gemini default remains `gemini-2.5-flash-image`. They do not select the workspace model or enable cross-provider fallback. The legacy endpoint refuses to edit projects migrated to workspace history, preventing older browser tabs from bypassing version/job controls.

## API and context behavior

The backend pins `@google/genai@2.31.0` and the Gemini Developer API. Interactions uses labelled image inputs, a compatible `previous_interaction_id`, and `response_format: { type: 'image', image_size: '2K', mime_type: 'image/jpeg', delivery: 'inline' }`. Deprecated Interactions `response_modalities`/`image_config` are omitted. The explicit generateContent adapter uses that API's `responseModalities` and `imageConfig` fields instead. Both configured and returned model IDs are stored.

Lite selects generateContent before dispatch, reconstructing each edit from the saved canvas, architecture anchor, branch instructions and approved references. It does not fabricate an Interactions conversation. Lite is restricted to 1K in the UI, request validation and database constraints; other modes retain 1K/2K/4K controls. Switching from Lite to another model creates fresh provider context. Free-tier eligibility is not a guarantee of an unused/nonzero quota. Native generateContent has no retrievable Interactions ID, so a lost response may require ending the uncertain job and explicitly requesting another render.

Response parsing handles current `output_image`, older output envelopes and generateContent candidates. Thought images are excluded. Actual JPEG/PNG/WebP signatures and dimensions are checked before storing the correct MIME type and extension.

Inputs have separate roles: edit canvas, original geometry anchor, and up to three style/palette/material/furniture/layout references. Analysis returns structured observations and uncertainty. Only user-selected attributes become textual guidance; analysis never overwrites room notes. Each purpose permits one primary reference. A specific primary materials source overrides generic style-material suggestions. The applied-influences panel shows the saved brief and selected guidance before generation.

Analysis uses an explicit `v1beta` request, a 4,096-token output ceiling, bounded observation arrays and a model-appropriate reasoning setting: MINIMAL for Flash Lite, LOW for other Gemini 3 models, or a small thinking budget for an explicitly configured 2.5 model. Both analysis endpoints share the model/configuration helper. The workspace distinguishes upstream quota (429), model availability (503 with provider status 404), provider timeout (504), malformed output (502) and browser transport failures. These causes are not presented as interchangeable billing errors. Provider failures carry a request ID; logs and the private `design_jobs.provider_error` column retain allowlisted status/quota facts, excluding raw SDK messages, headers, prompts and keys. Client column grants exclude the diagnostic column.

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
deno test --config supabase/functions/deno.json --allow-env --allow-read --allow-net tests/backend/security_test.ts tests/backend/workflow_test.ts tests/backend/worker_test.ts tests/backend/provider_errors_test.ts
python3 scripts/evaluate-design-workflow.py        # hosted smoke, zero image generations
python3 scripts/evaluate-design-workflow.py --generate  # operator-only, at most three 2K attempts
python3 scripts/evaluate-design-workflow.py --analyze   # one explicit analysis of the synthetic reference
python3 scripts/evaluate-design-workflow.py --single-generation # one Pro request with safe failure diagnostics
python3 scripts/evaluate-design-workflow.py --two-turn --quality lite --turn-delay-seconds 60 # at most two explicit 1K Lite requests, stopping on failure
```

The live evaluator uses the repository's synthetic room fixture. It attempts Pro generation, Pro refinement and a Nano Banana 2.1 comparison from the same original/brief, stopping on failure. It never runs in CI. Reports contain status/model metadata, not keys. Its attempt count is not a billing receipt. Assess geometry, edit adherence, reference leakage, consistency, latency and provider-reported cost before choosing the final default.

Local PostgreSQL 17 tests exercise real constraints/RLS with Auth/Storage stand-ins. Browser/backend fixtures verify behavior/wire contracts, not live image quality. The hosted smoke establishes deployed API/database connectivity separately.

Verify the final PR head's CI and Vercel Preview checks before merging. Under the owner's 24 October release decision, merge PR #3 and deploy the merged main commit with `VITE_WORKSPACE_V2=true` in Production, without making further quota-blocked generation attempts. Verify the production deployment's exact commit, compiled flag and browser loading; do not describe those checks as live image acceptance. When quota becomes available, use the bounded two-turn evaluation above and review the actual output before closing the deferred checks.

Roll back by setting `VITE_WORKSPACE_V2=false` in Production and redeploying; preserve all additive tables/assets/jobs. Compatibility result fields keep saved workspace results viewable, while full version editing requires re-enabling the workspace. UI rollback, disabling the worker and deleting provider conversations are separate operations.
