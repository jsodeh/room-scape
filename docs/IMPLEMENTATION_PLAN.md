# Roomscape product redesign

## Goal

Turn the staging form into an approachable, image-led design studio while retaining the existing Supabase generation pipeline.

## Implementation

- [x] Define a warm neutral/olive visual system, consistent Roomscape branding, responsive navigation, accessible theme switching, and compact footer.
- [x] Replace the three-tab wizard with a room canvas and visual controls for room type, style, palette, furnishing density, and instructions.
- [x] Support one room photo per design, validate/prepare uploads, retain settings through sign-in, and clearly distinguish inspiration from generated output.
- [x] Add original/design comparison, fullscreen viewing, version selection, and reliable image download.
- [x] Connect a searchable/filterable Projects dashboard; fix project routing, profile navigation, polling, and visible feedback.
- [x] Validate production build, TypeScript, desktop/mobile layouts, keyboard controls, upload errors, mocked generation and saved project journeys.

## Later backend work

- Region masking and object-level edits.
- Consistent staging across multiple camera views.
- Durable version history, project sharing, and client collaboration.
- Provider/model upgrades, architecture-preservation evaluation, and live inference validation.

## Verification boundaries

Browser mocks may verify authenticated UI and API contracts without accessing or changing a real user's projects. They do not validate the deployed Supabase policies, credentials, or AI image quality. No deployment or database migration is part of this change.

## Verified implementation

- `npm run typecheck`: passed.
- `npm run build`: passed. The existing large-bundle advisory remains; furniture administration is now loaded separately.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e -- --workers=3`: 11 passed.
- Desktop (1440 px), mobile (390 px), and dark-theme screenshots inspected; no horizontal overflow or runtime errors on the studio.
- Full lint: 38 pre-existing errors and 14 warnings. Comparing failing edited files to HEAD found no new lint errors. Most remaining errors concern existing `any` types and UI utility definitions outside this redesign.

## Behavior implemented

- One room photo per design, validated and normalised to JPEG before upload.
- Room type, visual style, palette, furnishing density, notes and preservation preferences feed the generation brief.
- Studio preferences survive browser-session navigation; the room photo survives sign-in within the current tab.
- Before/after slider, integrated fullscreen/zoom, session revision selection, refinement and typed image downloads.
- Backend-backed Projects search/status filters, loading/error/empty states, fixed detail routing and legacy profile redirects.
- Visible notifications, non-overlapping polling, generation failure recovery and project cache refresh.
- Admin UI checks trusted application role metadata; deployed database/storage policies remain a separate backend validation requirement.

The existing live AI and Supabase integration was retained but was not exercised with real credentials or paid model calls. Image quality, project permissions and provider compatibility are not established by mocked browser tests.
