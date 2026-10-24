# Gemini workflow implementation status

Implemented on `feat/gemini-context-workflow`, against the approved [plan](GEMINI_IMAGE_WORKFLOW_PLAN.md).

- [x] Verify the account model catalog inside Supabase without exporting the Gemini key.
- [x] Repair legacy saved-image refinement/MIME handling and separate reference guidance from user notes.
- [x] Add assets, immutable versions/turn snapshots, branches, versioned profiles, structured analyses and leased jobs with ownership policies.
- [x] Add role-aware context compilation, portable remembered instructions, continuation/reset rules and explicit provider-conversation deletion.
- [x] Deploy the authenticated API, private scheduled worker, idempotency and recovery.
- [x] Add the workspace: reopening projects, selected-version forks, reference roles/scopes, analysis selection and explicit cross-project style reuse.
- [x] Validate PostgreSQL transactions/RLS, backend contracts, browser flows, TypeScript and production builds.
- [ ] Complete live image generation, multi-turn quality evaluation and Pro versus Nano Banana 2.1 comparison. One controlled Pro request returned HTTP 429; no retry or model substitution occurred.
- [ ] Enable production rollout after live acceptance. The feature-branch Preview uses the new workspace; production retains the existing studio until the gate passes.

See [deployment and operating instructions](GEMINI_WORKSPACE_DEPLOYMENT.md) and the [failure diagnosis](GEMINI_FAILURE_DIAGNOSIS.md). Model catalog visibility and live structured reference analysis are verified; successful image generation with this key remains unverified.

Verification on 24 October 2026:

- Five workflow migrations are recorded and match the local SQL; all 11 new tables have RLS enabled. Four Edge functions are ACTIVE, the private worker schedule is active, and worker readiness is verified. Provider diagnostics are private at the column-grant boundary.
- TypeScript, build, targeted lint and four Edge function type checks pass. There are 29 backend tests, 21 browser tests and four deployment-safety tests, plus real PostgreSQL policy/transaction checks. CI runs these without paid inference. A storage failure after successful inference explicitly enters recovery and preserves the received provider ID.
- Authenticated hosted smoke passes. Independent cleanup verification found zero temporary evaluation accounts remaining.
- Desktop/mobile browser renders were visually inspected with synthetic fixtures; neither viewport overflows. They are UI verification fixtures, not proof of a successful new Gemini render.
- [PR #3](https://github.com/jsodeh/room-scape/pull/3) has a READY Vercel Preview with the workspace flag enabled for its branch. Cloud egress blocks direct browser access to the generated Vercel hostname; deployment state is verified through Vercel's API. Local browser flows and hosted Supabase checks are verified separately.
- Production retains its previous deployment and has no workspace feature flag enabled. PR #3 remains draft because the controlled live render returned HTTP 429.
- The analysis model/configuration and error handling are repaired and deployed. An authenticated synthetic-image analysis succeeded with Gemini 3.1 Flash Lite. Old-model 404, replacement-model 504, generation 429 and browser disconnection are documented as separate cases; the app preserves manual notes on failure and shows the model associated with the last failed generation.
- At the owner's request, Nano Banana 2 Lite is an explicit 1K free-tier option and the visible initial selection. Other models are retained. Lite's generateContent adapter uses saved portable context; no request silently substitutes a model/API. Both attempted Lite API surfaces returned 429; the native response identifies free-tier minute/day quotas and a roughly 15-hour suggested delay. Live image output and follow-up editing remain unverified while quota is refused.
