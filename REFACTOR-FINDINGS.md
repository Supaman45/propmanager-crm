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
