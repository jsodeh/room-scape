Roomscape image generation and context implementation plan — 24 October 2026

This is a proposed implementation plan. It changes documentation only: no application behavior, schema, provider settings, or deployments are changed by this document. It builds on the deployed backend and the Gemini integration review, using main commit 0749e8a as the repository baseline.

The goal is a design workspace that remembers a room's editing history, lets users branch from any saved version, supports independent edits and deliberate reuse across projects, and uses reference photographs without confusing their purpose with the room being edited.

**The application database will own design memory.** Gemini conversation state will be an execution aid, with a recoverable copy of the intended context in Supabase. Each generation will have a durable parent version, a frozen brief, selected image roles, approved decisions, and a recorded model/configuration. A browser refresh, expired provider conversation, or a model change must not erase the user's project history.

**Cross-project sharing will be explicit.** A project's room geometry, raw conversation, generated images, and provider conversation ID will stay in that project. Users can save an approved look as a versioned style profile and deliberately apply its selected attributes/references to another project. This is the default design decision for preventing accidental context mixing.

| Context scope | What it contains | Inheritance rule |
| --- | --- | --- |
| Project | Original room photo, approved brief, architecture constraints, selected style-profile version | Persists across sessions; changes create a new brief revision. |
| Branch | Parent version, decisions and active references for one design direction | Continues only on that branch. Forking starts from the selected version's snapshot. |
| Turn | The current requested change, selected base image, explicit references, temporary exceptions | Each request declares whether an instruction is for this edit or should become a continuing preference. |
| Reusable style profile | Approved palette, materials, furniture/style choices, deliberately included references | Shared across projects only by explicit selection; no room geometry or full chat is copied. |
| Provider conversation | Model-specific interaction ID or preserved response parts/signatures | Bound to project, branch, model, API surface, and context revision. Never reused globally. |

An instruction's scope controls whether it remains guidance. It does not automatically remove its visual effect from an existing image. For example, a one-off change to a sofa remains visible in that output until the user changes it again, but it does not become a preference for every other project.

**First fix the production regressions.** The current refinement handler sends a generated image, while the backend accepts only an original image. Also, reference analysis currently writes directly into the user's notes field, replacing their text. Both must be corrected before the larger workflow is enabled.

- Accept an authorized project's recorded original or generated base image; retain user, project, storage, and request validation.
- Pass the selected version into Refine explicitly. Choosing an older displayed version must not silently refine the latest version instead.
- Keep reference analysis separate from user notes. Analysis produces suggestions and never overwrites the user's words.
- Add backend tests that reach the provider stub with a legitimate generated base, reject unrelated images, and cover historical-version selection. The previous browser mocks did not exercise the actual ownership guard.

**Every photograph will have a purpose for the current request.** Roles belong to an asset's use, not permanently to the file: the same authorized photograph can be a palette reference in one project and a furniture reference in another.

| Image role | Allowed influence | Excluded influence |
| --- | --- | --- |
| Edit canvas | The exact selected image to change; current composition and objects | It is not a style reference or an image to replace with another room. |
| Architecture anchor | The original room's walls, windows, doors, floor boundaries and viewpoint | Its empty furnishing state must not erase the current version's furniture. |
| Style reference | Selected visual style, mood, materials and finishes | Its room geometry, camera angle, text, and unrelated objects. |
| Palette/material reference | Selected colours, textures and finishes | Layout, furniture placement and architectural changes. |
| Furniture reference | Selected item's identity, form and finish | The reference room's surrounding geometry or unrelated decor. |
| Layout reference | Explicitly requested arrangement guidance | Structural changes remain excluded unless the user deliberately changes the architecture constraint. |

New references default to style-only influence. Users can choose narrower roles and attributes. Where two references disagree, assign which source controls which attribute or ask one focused clarification; do not silently average incompatible instructions. Use model-specific, validated limits for image count and output size. Never silently drop a selected reference to fit a limit.

**Analysis will return structured observations, not an authoritative replacement prompt.** Separate room analysis from reference analysis. A room analysis can describe visible geometry with uncertainty; it must not invent exact dimensions from an unscaled photograph. A style analysis extracts only attributes permitted by that reference's selected role.

The analysis schema will include asset ID/hash, assigned role, schema/model/prompt version, observed attributes, uncertainty, evidence associations, suggested attributes, and excluded influences. Validate the JSON response server-side with a versioned schema. Cache only when the asset content, role, analyzer configuration, and schema version all match.

The user can accept, edit, or discard suggested attributes. Accepted attributes are stored with provenance separately from their original text and project constraints. Unaccepted analysis remains advisory. Analysis may be optional when the user has already supplied a clear reference role; generating with a selected reference must not require secretly adopting an analyzer-generated paragraph.

Images, captions, OCR text, and analyzer output are data sources. They must not override application rules or become higher-priority instructions. Do not concatenate raw analysis responses into the user's brief. Present a readable resolved brief and the selected influences before generation, with conflicts highlighted when a user decision is needed.

**A server-side context compiler will build each provider request.** Its inputs are typed records: operation, parent version, brief revision, approved profile version, user edit, active constraints, accepted analysis fields, and role-assigned assets. The output is a frozen context manifest plus a provider-specific request.

Priority is: application ownership/operation rules; confirmed architectural constraints; the current user edit for mutable design choices; approved project/branch decisions; explicitly attached profile defaults; selected reference attributes; unaccepted suggestions, which are not applied. A newer explicit user choice replaces an older mutable preference. A request that conflicts with a locked architecture rule needs an explicit rule change rather than an automatic override. Preserve the original literal user instruction alongside its normalized interpretation.

An internal manifest could look like this. These roles are application metadata, not invented Gemini API role values:

```json
{
  "operation": "refine",
  "project_id": "project-a",
  "branch_id": "branch-2",
  "base_version_id": "version-3",
  "brief_revision": 4,
  "instruction_scope": "this_edit",
  "user_edit": "Make the sofa olive; keep the rug and layout",
  "constraints": { "preserve_architecture": true },
  "approved_decisions": { "keep_rug": true },
  "images": [
    { "asset_id": "render-v3", "role": "edit_canvas" },
    { "asset_id": "original-room", "role": "architecture_anchor" },
    { "asset_id": "reference-2", "role": "style_reference", "use": ["palette", "materials"] }
  ],
  "profile_version_id": "approved-profile-v2"
}
```

The compiler will place a clear label beside each image part and explicitly identify the single output canvas. It will deduplicate the original/canvas when they are the same asset. It will tell the model which reference attributes to borrow and which to ignore. Architecture remains anchored to the original photograph even if a previous render drifted. Generated imagery is not proof that its new geometry is a correct fact about the room.

**Stateful editing needs explicit reset rules.** Introduce a provider context revision for each branch. Continue an existing interaction only when the model/API, asset roles, active references, and approved context are compatible.

| Event | Required behavior |
| --- | --- |
| Continue an ordinary edit | Use the selected parent version and its compatible provider state. |
| Fork an older version | Inherit that version's context, without later sibling edits or references. |
| One-off edit | Use an explicit selected image and allowed project constraints; do not turn its instruction into global memory. Rebuild subsequent context when needed to exclude expired one-turn guidance. |
| Remove a reference, revoke its use, or reject an influencing suggestion | Start a fresh provider context containing only the permitted state. Omitting an image from the next prompt does not guarantee that an older interaction has forgotten it. |
| Change a reference's role, replace a profile, or change important constraints | Create a new context revision; rebuild when previous provider state could preserve conflicting guidance. |
| Change model or API surface | Rebuild from portable project state and the chosen canvas. Do not forward another model's opaque signatures or conversation IDs. |
| Provider context expires | Restore from saved snapshots/assets before dispatch; retain the design/version history. |
| Delete/revoke an asset | Its historical snapshot is not permission to use it again. Invalidate affected future contexts and follow the provider's documented deletion/retention behavior. |

Removing a reference stops its future guidance. Existing visual effects remain in the selected canvas unless the user asks to change them. Rejecting a candidate does not add its inferred preferences to the approved brief. Users can refine a selected candidate without a forced approval click, but only explicit approved choices become reusable memory.

**Persist versions and lineage rather than browser-only arrays.** The proposed entities below are logical schema deliverables; implementation will use additive migrations and appropriate foreign keys/indexes.

| Entity | Main responsibility |
| --- | --- |
| Existing staging_projects | Authoritative original asset, current branch/version pointers and approved brief revision; retain legacy URL fields temporarily as compatibility projections. |
| design_assets | Owner, origin project, storage bucket/path, content hash, actual MIME type, dimensions and provenance for uploaded/generated media. |
| design_branches | Project, fork point, selected/head versions and context revision. |
| design_versions | Immutable output asset, parent version, originating turn, context snapshot, model/output settings and accepted/rejected state. Multiple candidates are sibling versions. |
| design_turns | Literal user edit, operation/scope, source version, resolved brief, reference bindings and analysis versions used. |
| reference bindings and asset analyses | Per-use roles, permitted attributes, scope, analysis provenance and user-approved overrides. Historical bindings are immutable snapshots. |
| style_profiles and style_profile_versions | Named, user-owned reusable looks with immutable versions and explicitly selected reference assets. Existing projects stay pinned until the user adopts an update. |
| generation_jobs | Idempotency key, request hash, branch/base version, lifecycle, leases, provider request identifier, output persistence and safe client-visible status. |
| Provider context records | Server-only interaction IDs or relevant raw response parts/signatures, bound to one branch/model/context revision. Never exposed as editable client state. |

Enforce same-owner/project relationships with database constraints where possible and RLS on every user-facing entity. Provider state and privileged status/result fields need service-only access or safe views; row isolation alone does not hide privileged columns. Client requests submit authorized IDs rather than arbitrary URLs or provider conversation IDs. A profile-reference attachment across two owned projects is an explicit permission-bearing link, not an exception that permits all images owned by that user.

Backfill existing projects with their original assets and current saved render. Label imported versions accurately: session-only history cannot be reconstructed if it was never stored. Do not invent missing conversation history. Keep old clients readable during rollout, and maintain compatibility projections from the new authoritative version records rather than two independent sources of truth.

Asset records will use storage paths rather than permanent provider-facing URLs. The backend can read authorized bytes directly, and the new UI can use signed display URLs. If introducing private storage for new assets, use a separate bucket and compatibility adapter; do not suddenly make the existing public bucket private and break saved designs. Existing public originals require an explicit migration before any claim that all historical images are private.

The logical API contracts will be explicit; these are proposed backend actions, not new Vercel routes already present in the app:

| Action | Contract |
| --- | --- |
| AnalyzeReference | Project/asset IDs, selected role and analysis goal produce validated suggestions with a schema/provenance version. No project brief is mutated automatically. |
| SubmitDesignTurn | Project/branch/base-version IDs, operation, instruction scope, brief revision, selected reference bindings, allowed quality preset and idempotency key produce a durable job ID. The server derives authorized files and provider state. |
| GetGenerationJob | An owned job ID returns safe lifecycle/error information and result-version IDs. It never returns keys or privileged provider context. |
| LoadProjectHistory | An owned project/branch returns saved versions, visible conversation, approved state and applied-reference summaries for restoration. |
| SaveOrApplyStyleProfile | Explicit attribute/reference selection creates a profile version or attaches a selected version to an owned project, with a visible change summary. |

An operation such as refine, restyle, fresh design, or independent edit must be declared rather than inferred solely from free-form text. Legacy requests remain supported through a compatibility adapter until the version-based client is deployed.

**Use durable jobs to survive navigation and slow image generation.** The request endpoint validates ownership, freezes the manifest, and creates or returns a job for a unique user action. A database-backed queue and worker claim the job atomically. Use Supabase Queues where supported, with an explicit scheduling/worker setup verified against the project's capabilities.

Persist lifecycle states such as queued, running, saving, succeeded, failed, cancelled-before-dispatch, and needs-recovery. Browser polling/subscriptions report persisted state; switching rooms or closing the tab must not abandon or misattribute a result. Use optimistic branch/base-version checks to avoid overwriting concurrent edits. A completed job for Project A must never replace the canvas while the user is viewing Project B.

A duplicate click or reconnect must return the existing job. Reusing an idempotency key with different inputs is a conflict. Store outputs under deterministic job/candidate paths so storage/commit retries do not create duplicate versions. Commit the result/version and branch transition transactionally after validating and persisting the image.

Application idempotency does not guarantee exactly-once billing at Google. Do not blindly retry an inference whose outcome is unknown after a timeout. Recover provider outputs by interaction/request ID where supported, retry only safe persistence steps, and surface an ambiguous job for recovery if necessary. Cancellation after provider dispatch must not promise that inference or billing stopped. Validate actual Supabase execution limits and model latency before selecting timeouts; use a suitable worker or provider-supported asynchronous mode if the chosen image operation cannot fit. Do not assume an agent's background mode also supports image generation.

**The model adapter will make the quality upgrade explicit.** Keep the current generation and analysis responsibilities separate. Run non-generating catalog checks inside the backend using the existing AI Studio key; do not export it into the browser or require another copy for the audit. Catalog visibility does not establish billing/quota: verify those with a small, bounded live evaluation when implementation reaches that gate.

| Setting | Planned decision |
| --- | --- |
| Quality model | Validate Nano Banana Pro and the exact GA/preview identifier supported by the intended API. Compare Nano Banana 2.1 on representative rooms before choosing the final default. |
| Output | Explicit 2K quality mode; optional 4K generation where supported. A later 4K re-render is a new version and may change details; it is not presented as a lossless download/upscale. |
| Stateful API | Prefer the current Google GenAI SDK Interactions workflow for new compatible branches after verifying support for the selected model. Retain a documented generateContent adapter for compatibility or fresh-context reconstruction. |
| Provider outputs | Handle the actual API response shape, preserve MIME type, ignore thought-only images, retain needed opaque context, validate output bytes/dimensions, and classify safety/finish/error outcomes. |
| Parameters | Validate resolution, aspect ratio, sampling settings, limits and timeouts against the selected model. Do not carry every 2.5 setting into a new model unchanged. |
| Fallback | No silent switch to a cheaper/different model or another paid provider. An unavailable model produces an actionable configuration error. |

Pin the SDK/API contract and store the configured and returned model version where available. Preserve request metadata for auditability without promising bit-identical rerenders. Keep provider keys in Supabase. Existing GEMINI_IMAGE_MODEL, GEMINI_ANALYSIS_MODEL and IMAGE_PROVIDER settings remain relevant. Any additional resolution, API-mode, queue or timeout settings are proposed configuration to implement and document, not variables the current code already reads.

**The workspace UI will expose the decisions users need.** Add a persistent per-project edit timeline with version selection, a visible editing-base label, branch/fork controls, saved project briefs, reference cards with purpose/scope, and a concise applied-influences summary. Continue design, start a fresh direction, and make an independent edit must be distinct actions.

Use project/user/branch keys for server data and local drafts. Replace global session notes/context as the source of truth. Hydrate the correct branch on reopen, clear cached context on logout/account change, and prevent stale requests from painting results into another project's view. Save this look creates a profile from selected approved attributes; applying it elsewhere shows the included preferences and references. A profile update does not silently alter every project using an older version. Related rooms can use the same approved profile while keeping separate room geometry and conversations.

A user can review/edit the final readable brief, but ordinary flows will not expose raw provider payloads, internal IDs or signatures. Uncertain or conflicting analysis should result in a focused choice, not another long prompt that the user must debug.

**Deliver in independently reviewable steps.** Each step needs its own validation and must retain a working compatibility path until the next step is ready.

| Order | Deliverable | Exit condition |
| --- | --- | --- |
| 0. Contract checkpoint | Verify the intended SDK/API surface, model identifiers/capabilities, provider context retention, and hosted execution constraints | The proposed adapter is based on current contracts and account metadata; unresolved model/billing assumptions are explicit before substantial implementation. |
| 1. Immediate fixes | Authorized refinement of the selected saved image; analysis no longer overwrites user notes; MIME-aware output extraction | Backend regression tests reach a provider stub for valid edits and reject invalid sources; browser tests exercise selected-version behavior. |
| 2. Durable foundation | Assets, versions, branches, turn snapshots, job queue/status and ownership policies; migration/backfill | History survives refresh and login; two users/projects remain isolated; legacy saved designs still open; duplicate jobs cannot create duplicate versions. |
| 3. References and context compiler | Structured analysis, user-approved attributes, role/scope controls, deterministic context assembly and conflict handling | Multiple references reach the provider with explicit purposes; manual instructions survive analysis; excluded inputs are absent from the compiled request. |
| 4. Stateful provider adapter | Validated model catalog, Pro/2.1 evaluation, Interactions or compatible continuation, context resets, resolution controls and recovery | Multi-turn edits continue correctly; forks use their selected parent; removed references/model changes create fresh provider contexts; expired state can be rebuilt. |
| 5. Persistent workspace and reuse | Project timelines, branch UI, independent edits, reusable versioned style profiles and explicit cross-project attachment | A user can resume a room later and apply an approved look to another room without importing its layout or conversation. |
| 6. Evaluation and rollout | Reliability cases, bounded real-model checks, preview validation, documentation and staged release | Acceptance cases below pass; deployment/build checks pass; feature flags allow rollback without losing version data. |

Primary code areas: stagingHandlers.ts, ResultsDisplay.tsx and staging context for the immediate selected-version fix; DesignStudio.tsx and the reference uploader/analyzer for separate inputs; new context/compiler and provider-adapter modules; Supabase migrations/RPCs and queue worker; project/detail services for durable history; backend policy/contract and browser integration tests. Keep the old entrypoint as an adapter during migration instead of forcing existing tabs to switch atomically.

**Acceptance must test context semantics, not just a successful image response.**

| Scenario | Required result |
| --- | --- |
| Generate a first room | Original geometry is the anchor; the explicit brief and selected references are recorded with the result. |
| Refine the current render | The selected owned render reaches Gemini; unchanged choices are retained unless the user asks otherwise. |
| Branch from version 2 after creating version 5 | The branch inherits version 2's permitted snapshot, never versions 3–5's instructions or references. |
| Analyse a reference after writing notes | Notes remain unchanged; suggestions have separate provenance and require selection before becoming persistent guidance. |
| Use one photo for colours and another for a chair | Each source affects its selected attributes; neither becomes the room's architectural source. |
| Remove a reference or let a turn-only reference expire | A later request cannot inherit the removed image through an old provider interaction; the current canvas's existing visual effects are handled explicitly. |
| Reopen a project or lose provider history | The database restores versions and a usable design state; a new provider context can be constructed when needed. |
| Open another project | No raw conversation, room geometry or temporary preference carries over automatically. |
| Apply an approved profile to a second room | Only selected approved attributes/references transfer; each room retains its own architecture and version tree. |
| Receive conflicting geometry/style suggestions | Locked architecture is retained; a required decision is surfaced instead of silently changing constraints. |
| Duplicate clicks, two tabs, network loss or storage failure | Results remain attached to the intended job/branch; no blind duplicate inference or lost/overwritten version. |
| Manipulate asset, project, profile or provider IDs | Ownership validation rejects the request before provider dispatch. |
| Switch models or API surfaces | A fresh provider context uses the selected version's portable state; incompatible signatures are not forwarded. |

Test layers: real PostgreSQL RLS/constraint tests with at least two users and projects; adapter fixtures for both response shapes, MIME types, blocked responses and context expiry; compiler tests for source precedence, excluded assets and malicious embedded reference instructions; browser flows that reopen projects, fork history and change reference scope; and a limited operator-triggered live quality comparison using the actual AI Studio project. Paid generations must not run automatically in CI.

Quality evaluation should compare Pro and Nano Banana 2.1 using identical room inputs, briefs and supported output sizes. Score architecture retention, requested edit adherence, selected-reference fidelity, unrelated-reference leakage, consistency over multiple turns, latency and actual cost. Automated geometry checks can flag potential drift with uncertainty; they cannot guarantee that walls/windows are preserved. Do not automatically accept the model's own quality assessment as proof of correctness.

Deploy additive migrations and compatibility endpoints first, then the worker/provider adapter, then the new UI behind feature flags. Validate Preview before production. Rollback must preserve assets, versions and job records, and use a previously validated adapter/model path; it must not reset the database. Context reset and feature rollback are separate from deleting a user's saved designs. Explain provider retention/expiry and implement deletion where supported without promising that omitting an image instantly erases third-party history.

This release includes multi-turn editing, persisted single-project history, independent edits, multiple purpose-labelled references, and explicit style reuse across projects. Automatic geometry reconstruction across multiple camera views, object masks, unrestricted global memory, collaboration permissions, and an unrelated Neon migration are outside this implementation's first release.

Documentation baselines to recheck at implementation time:

- Google Nano Banana cookbook: https://github.com/google-gemini/cookbook/blob/main/quickstarts/Get_Started_Nano_Banana.ipynb
- Google GenAI SDK and Interactions examples: https://github.com/googleapis/js-genai/blob/main/README.md
- Google generateContent image examples: https://github.com/google-gemini/cookbook/blob/main/quickstarts-js/Image_out.js
- Nano Banana 2.1 model-selector update: https://github.com/google-gemini/cookbook/commit/79e2983cb5c72f7ef6ed9ed8ebaa53b746220dab

Google's examples currently include both GA and preview Pro identifiers. Model visibility, API support, quotas and billing must be verified with the project's existing key before fixing the production selection. The implementation must not guess an identifier or treat a documentation example as an account-access test.
