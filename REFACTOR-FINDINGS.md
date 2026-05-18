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
