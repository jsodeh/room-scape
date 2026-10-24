# Gemini failure diagnosis — 24 October 2026

The user's screenshots show several distinct failure paths. Diagnosis used saved generation-job metadata and controlled requests with the repository's synthetic fixture. User photographs and room instructions were not sent again for diagnosis.

| Operation | Evidence | Status/action |
| --- | --- | --- |
| Pro (`gemini-3-pro-image`) generation | User job and fresh controlled request rejected by Google with HTTP 429 | Google quota/rate-limit refusal; no image returned. |
| Nano Banana 2.1 generation | User job rejected with `provider_quota`, the HTTP-429 classification | Same category of provider refusal; no successful image returned. |
| Flash (`gemini-3.1-flash-image`) generation | User job rejected with the HTTP-429 classification | Same category of provider refusal; switching among these three has not resolved it. |
| Requested free-tier Lite (`gemini-3.1-flash-lite-image`) | Catalog-visible; controlled 1K requests through both Interactions and generateContent returned 429 | Native response reported `RESOURCE_EXHAUSTED` for free-tier input tokens/minute, requests/minute and requests/day, plus a 53,308-second retry suggestion at the time of checking. No image or follow-up edit was produced. |
| Original reference analysis | Controlled request to the former configured/default `gemini-2.5-flash` returned provider HTTP 404 | The old handler exposed unhandled SDK errors as a generic HTTP 500. Model listing still included this identifier; listing alone does not prove inference access. Do not infer retirement from this observation. |
| Gemini 3.8 Flash analysis evaluation | Both initial and bounded requests returned upstream HTTP 504 | Not treated as a quota/billing error or a successful repair. |
| Repaired reference analysis | Explicit `gemini-3.1-flash-lite` configuration; authenticated hosted analysis completed and persisted valid structured output | Verified on the synthetic furniture reference. User approval of guidance remains required. |
| Browser `ERR_NETWORK_CHANGED` / `ERR_INTERNET_DISCONNECTED` | Browser console in the supplied screenshots | Connection interruption is separate from a provider HTTP response. Screenshots do not identify the underlying network cause. |

## Implemented repair

- Both analysis endpoints use the explicit shared `GEMINI_ANALYSIS_MODEL`, defaulting to `gemini-3.1-flash-lite`. Workspace requests use `v1beta`, a 4,096-token ceiling, MINIMAL reasoning for Flash Lite and bounded structured observations/uncertainty. No request silently switches models or retries paid inference.
- Upstream 429, 404, 504 and malformed responses are distinguished. The workspace returns actionable errors and correlation IDs rather than a generic 500 for an unhandled SDK error. Compatibility analysis uses the same model/request settings and safe error classification.
- Operator diagnostics contain allowlisted status/quota facts. Raw SDK error bodies, keys, headers, prompts and photographs are excluded. The additional job diagnostic column is not selectable by ordinary clients.
- Browser connection errors preserve the typed edit and recommend checking saved job state before another submission. Explicit retries retain the same client action UUID. The failed-generation banner names the model/settings from the actual failed job, independent of the current dropdown selection.
- Regression tests cover both SDK error envelopes, redaction, response schemas, purpose-limited guidance, 429 propagation, 504 classification, compatibility analysis, preserved notes, interrupted connections and action-ID reuse. The PostgreSQL suite verifies diagnostic-column privacy.
- Nano Banana 2 Lite is now an explicit fourth option and the visible initial selection at 1K. Pro, Nano Banana 2.1 and full Flash remain selectable. Lite's 1K limit is enforced in the client, request schema and database. Lite uses an explicitly configured generateContent adapter with the saved canvas and portable editing context; no job changes APIs automatically after a failure.

## Remaining external requirement

Google's HTTP 429 does **not** by itself establish that billing is disabled, that every quota is zero, or that the key is invalid. The fresh Pro diagnostic established HTTP 429 but supplied no structured quota-limit detail that could safely establish the exact account-side cause. Successful text/vision analysis does not establish quota for image-generation models.

The owner subsequently confirmed the **free tier** and requested a separate Lite option. Google's official Nano Banana cookbook documents `gemini-3.1-flash-lite-image` with a free tier and recommends billing for access to other models/higher limits. It documents 1K for all models, while higher-resolution support is described for Nano Banana 2/Pro. Lite is therefore restricted to 1K here. Source: [Google Nano Banana cookbook](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Get_Started_Nano_Banana.ipynb).

The actual Lite request was still refused for this project. The named minute/day quotas and retry suggestion do **not** reveal the numerical allocation or usage, so do not assert that the allocation is zero, promise that waiting will fix it, or claim the Lite render works. The owner needs to check the Lite daily-request limit and current usage. If a positive daily allowance is exhausted, respect Google's suggested reset; if the allocation is zero/unavailable, resolve eligibility/quota or billing with Google. Repeated requests, switching models or merging code cannot grant that quota.

In Google AI Studio, select the **Google Cloud project owning the API key** and inspect its API billing tier, per-model request/token/image limits, current usage and any spending cap. This is separate from Supabase and Vercel billing. If paid billing is already active, inspect the actual image-model quotas and usage rather than assuming that recreating the key or merging the PR will resolve the refusal.

Google's [rate-limit guide](https://ai.google.dev/gemini-api/docs/rate-limits) and [billing guide](https://ai.google.dev/gemini-api/docs/billing) describe the provider controls. Google AI Pro family membership does not itself enable paid Gemini API billing/quota for this key. After quota is available, run one deliberate 1K Lite render and a follow-up edit; higher-resolution models require their own available API quota. Image quality, actual image resolution/latency and multi-turn fidelity remain unverified until rendering succeeds.

All diagnostic accounts/projects/storage objects were removed after their checks. No user jobs were retried or altered to manufacture a success. The new model setting and backend fixes are deployed. On 24 October 2026, the owner explicitly approved finalizing PR #3 and proceeding with the production workspace while image generation remains quota-blocked. The former draft/production hold is therefore removed; successful image output and live multi-turn quality remain deferred follow-up checks, not claimed successes.
