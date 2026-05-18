# Refactor Findings

Running log of bugs, orphans, and oddities spotted during the structural refactor of `src/App.jsx`. Per PROPLI-REFACTOR.md, findings are logged here and **not fixed inline** — fixes happen on their own branches after the refactor merges.

Entry format:

```
## [STATUS] Title
- Date: YYYY-MM-DD
- Phase: <phase when discovered>
- Details: <what and why it matters>
- Proposed fix: <when and how>
```

Statuses: `OPEN`, `RESOLVED`, `WONTFIX`, `NOTED`.

---

## [OPEN] node_modules/ is tracked in git

- Date: 2026-04-19
- Phase: Phase 0 cleanup
- Details: The repo had no `.gitignore` file until this refactor. `node_modules/` has been committed in history and is still in the current index. Massive bloat; every `npm install` on a new machine will produce diff churn. Not a security issue in the same way `.env` was, but still structural debt.
- Proposed fix: After the refactor merges, add `node_modules/` to `.gitignore`, run `git rm -r --cached node_modules/`, commit. Optional history scrub to shrink repo size — separate decision.

## [RESOLVED] Orphaned VITE_ANTHROPIC_API_KEY in .env

- Date: 2026-04-19
- Phase: Phase 0 cleanup
- Details: `.env` contained a duplicate `VITE_ANTHROPIC_API_KEY` line (same value, two lines) with a live Anthropic key. No source file referenced the variable — it was orphaned, likely residue from the removed AI Lease Analyzer feature. Because Vite only inlines `VITE_*` vars that are read by source, the key was not in the shipped bundle; the exposure was limited to git history.
- Resolution: Key rotated in the Anthropic console. New key set as `ANTHROPIC_API_KEY` in Supabase Edge Function secrets. Both lines deleted from local `.env`. `.env` added to `.gitignore` and untracked (`git rm --cached`). See commits `e21cd14`, `517302c`. Git history still contains the old key at `137d989`; history scrub skipped by decision (rotated key is dead, no browser bundle exposure).

## [NOTED] Repo history includes an unrelated project

- Date: 2026-04-19
- Phase: Phase 0 recon
- Details: `git log --all -- .env` surfaced commit `137d989 camping comparison site`. The message doesn't match this project, suggesting the repo was initialized from a template or an unrelated scratch project. Harmless on its own, but worth knowing when reading old history.
- Proposed fix: None. Informational only.

## [NOTED] Duplicate VITE_ANTHROPIC_API_KEY line in .env

- Date: 2026-04-19
- Phase: Phase 0 recon
- Details: `.env` had the same `VITE_ANTHROPIC_API_KEY=...` value on lines 1 and 2. Almost certainly a copy-paste slip rather than intentional. Resolved as part of the orphan cleanup above.
- Proposed fix: None. Informational only.

## [OPEN] owner_statements.property_id type mismatch with properties.id

- Date: 2026-05-16
- Phase: Demo data 500 scale-up
- Details: `add-owner-portal-migration.sql:23` declares `owner_statements.property_id UUID REFERENCES properties(id)`, but `properties.id` is `BIGINT` (`database-schema.sql:37`). The foreign key cannot resolve, so any insert into `owner_statements` with a real `property_id` will fail. The table is effectively unwritable until the column type is fixed. Discovered while building the 500-door demo generator — `owner_statements` was skipped entirely as a result.
- Proposed fix: Migration to change `owner_statements.property_id` from `UUID` to `BIGINT` and re-add the foreign key. Coordinate with whatever UI is supposed to write to this table (owner statement generation flow) before deploying.

## [OPEN] Tenant lateness definition mismatch

- Date: 2026-05-17
- Phase: Main Dashboard command center work
- Details: Two definitions for one concept.
  - `tenants` table has a `status` field with values 'current', 'late', 'past', 'prospect' (per the 500-door demo generator). 'late' is a top-level status.
  - The Tenants tab's Late filter (App.jsx:1645, 8098, 2866, 3741, 3850, etc.) treats "late" as a sub-state: `(t.status === 'current' || t.status === 'Current') && t.paymentStatus === 'late'`. Late is a property of a Current tenant who hasn't paid this month.
  - The 500-door demo generator writes `status='late'` AND `payment_status='late'` for the 98 "late" tenants, so the Tenants tab Late pill filter matches zero rows (`status='current'` excludes them), and the Late kanban column shows empty.
  - Main Dashboard counted late tenants by `t.status === 'late'` (the field as written by the generator), so the action item said "98 tenants late on rent" while the Tenants tab said "Late (0)".
- Resolution this commit: Main Dashboard `computeActionItems`, `computeMostImportantItem`, and `computeDueDates` now use the Tenants tab's `current + paymentStatus=late` convention so the count matches and the click-through lands on a populated list. With the current demo data the count drops to 0 and the action item correctly hides.
- Phase 10.5 candidate: pick one definition and align everything.
  - Option A: Fix the demo generator to write `status='current'` with `paymentStatus='late'` for late tenants. Lowest-risk, demo data update only.
  - Option B: Promote 'late' to a real top-level status across the app, update the Tenants tab kanban and filters. Higher-risk, touches many files.
  - Lean Option A.

## [OPEN] No back affordance from detail panels

- Date: 2026-05-17
- Phase: Main Dashboard command center work
- Details: Detail panels for tenant, maintenance, property, and owner have no "back" link or breadcrumb. A user who clicks into a tenant from the Main Dashboard's Due Dates panel and then closes the detail panel lands on the Tenants tab with no context of where they came from. This is a known AppFolio pain point worth solving well.
- Three approaches worth considering: (a) contextual "Back to Dashboard" link in panel header, (b) navigation history stack in app state, (c) URL routing per detail page with browser back-button support. Option (c) is the strongest UX but is also the largest change since the rest of the app is tab-state-routed.
- Defer to a dedicated mini-prompt between the current Prompt 2 (Main Dashboard) and Prompt 3 (visual design pass), or to Phase 9 refactor.

## [OPEN] Tenant detail panel redesign

- Date: 2026-05-17
- Phase: Main Dashboard command center work
- Details: The current tenant detail panel is functional but visually flat. Wanted for Prompt 3 (visual design language pass): activity timeline, lease progress bar, status badges, richer quick actions, better visual hierarchy.
- In scope for Prompt 3.

## [OPEN] Health Dashboard onNavigate uses legacy filter variable only

- Date: 2026-05-17
- Phase: Main Dashboard command center work
- Details: `App.jsx:11315` (the `onNavigate` handler passed to `HealthDashboard`) writes only `filterStatus`, which is the legacy filter variable on the Tenants tab. The visible filter pill UI reads from `tenantFilter` (different variable). Result: clicking an Action Item on the Health Dashboard routes to the right tab but the filter pill never highlights. Same root bug as the one fixed in the Main Dashboard's `onNavigate` tonight. Per the "don't touch Health Dashboard" rule for the Main Dashboard work, this was left untouched.
- Proposed fix: mirror the Main Dashboard's handler (set both `tenantFilter` and `filterStatus`). Single-file edit in `App.jsx`. Phase 10.5 candidate, or a quick standalone fix.
- Deeper Phase 10.5 candidate: collapse `filterStatus` and `tenantFilter` into a single source of truth on the Tenants tab.

## [OPEN] extract usePortfolioData base hook shared between dashboards

- Date: 2026-05-17
- Phase: Main Dashboard command center work
- Details: `src/features/dashboard/useMainDashboard.js` and `src/features/reports/useHealthDashboard.js` both fetch the same four tables (tenants, properties, maintenance_requests, tenant_applications) with identical filter and shape. The Main Dashboard work duplicates the fetch on purpose to keep the Reports surface untouched, but this is real duplication and a future second consumer (e.g. an owner-side dashboard) would triple it.
- Proposed fix: pull a shared `usePortfolioData` hook into `src/shared/hooks/` that returns the raw four-table snapshot, and let each feature hook layer derivations on top. Phase 9 candidate per PROPLI-REFACTOR.md.

## [OPEN] checklist PDF upload sometimes writes wrong storage path / skips DB update

- Date: 2026-05-17
- Phase: Checklists v1 walkthrough work
- Details: During end-to-end testing of the walkthrough → PDF flow, the PDF file downloads to disk correctly via `src/utils/generateChecklistPDF.js`, but the new `src/features/checklists/pdfGenerator.js` upload-to-storage path is inconsistent. On at least one test run the upload landed in a folder for a different `checklist_id` than the row being signed, and the subsequent `inspection_checklists.pdf_storage_path` update never landed for the current row. One row (`ee824857`) has a path written; the row from the most recent walkthrough (`52d20519`) still shows NULL. Not a blocker for the prospect demo since the PDF still downloads from the jspdf path, but the durable copy in `checklist-pdfs` is incomplete.
- Suspected cause: the closure inside `generateAndUploadWalkthroughPDF` captures the checklist row at the moment the PDF JSX is constructed, while the PM signature `setStatus('signed')` + the `setPdfPath` update may race against each other. Worth instrumenting both writes with a `console.log` of `checklist.id` to confirm.
- Proposed fix: add explicit `[pdfGenerator]` logs around the upload `storagePath` and the `setPdfPath` call so we can see which checklist id each write targets, then either pass the id explicitly through the call chain or `await` `setPdfPath` before kicking off the next status transition.

## [RESOLVED] inspection_checklists.status dropdown writes invalid value

- Date: 2026-05-17
- Phase: Checklists v1 walkthrough work
- Details: `src/components/checklists/ChecklistForm.jsx` exposed a status dropdown with values `draft`, `in_progress`, `completed`. The actual `inspection_checklists.status` check constraint in production is `status::text = ANY (ARRAY['draft', 'completed', 'signed'])` so any save with `in_progress` selected fails with `inspection_checklists_status_check`. `src/components/checklists/ChecklistList.jsx` had the same `in_progress` value as a filter option, which never matched any row. Pre-existing bug on `main` before tonight's walkthrough work; the walkthrough code only ever wrote `completed`, but did so at the wrong point in the state machine.
- Resolution: Replaced `in_progress` with `signed` in both the form dropdown and the list filter. Walkthrough state machine now writes `draft` during inspection (default), `completed` when the PM finishes the room walk and arrives at the summary screen, and `signed` after both signatures plus PDF upload. Added a strict allowlist guard in `useWalkthrough.setStatus` so future code can't silently write invalid values.

## [OPEN] properties.owner_id type mismatch with owners.id

- Date: 2026-05-16
- Phase: Demo data 500 scale-up
- Details: `add-owner-portal-migration.sql:17` declares `ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES owners(id);`, but in production `properties.owner_id` is `BIGINT`. Inserting any UUID into the column fails with `invalid input syntax for type bigint`. Since `owners.id` is `UUID`, no valid value can be written — the column is effectively unusable for its declared purpose. The existing 35-tenant loader masks this by leaving `owner_id` null and relying on the `owner_name`/`owner_email` text columns to surface the owner in the UI. Discovered when the 500-door generator tried to populate `owner_id`.
- Workaround in 500-door loader: skip `owner_id` on properties insert, populate `owner_name`/`owner_email` instead, and create rows in the `owner_properties` junction table (whose `property_id BIGINT` / `owner_id UUID` types are consistent) so owner → property lookups still work in the Owners tab.
- Proposed fix: Migration to change `properties.owner_id` from `BIGINT` to `UUID` to match the original migration's intent, or drop the column entirely if the junction table is the canonical link. Audit any code that reads `properties.owner_id` before deciding which direction to take.
