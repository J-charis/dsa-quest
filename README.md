# DSA Quest

A free, local-first DSA interview-prep tracker: roadmap, five-question batches, solving timer, spaced-repetition revisions, calendar, heatmap, weekly planner, analytics, and JSON/CSV backup. No accounts, API keys, servers, tracking, or paid services. LeetCode tracking is **manual**; every problem links to leetcode.com.

## Quick start
Requires Node 22.18+.
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pure-logic tests, no install needed beyond Node
npm run build      # type-check + production build into dist/
npm run preview
```
No `.env` is needed (there are no secrets or external services), so there is no `.env.example`.

## How it works
- **Storage:** IndexedDB via Dexie, in *this browser only*. Clearing site data, another browser/device, or private windows will not carry progress over. **Export a JSON backup regularly** (Settings).
- **Sessions are the source of truth.** Heatmap, calendar, streaks, weekly counts, analytics and the revision schedule are all computed from the session log. Editing or deleting a session therefore updates everything consistently.
- **Counting rules:** a *new* session = first solve of a problem (allowed once per problem). A *revision* counts toward the weekly target but never as a new unique problem. An *unsolved attempt* is recorded and its time counts as active time, but it does not count as a completed session. Saving uses one id per form, so double clicks cannot create duplicates.
- **Timer:** elapsed time is derived from timestamps (`accumulated + now - segmentStart`), so paused time never counts and it survives refreshes. A running timer shows in the sidebar/header; Stop lets you choose solved / revision / unsolved and edit the minutes before saving.
- **Revision scheduler:** default intervals 1, 3, 7, 14, 30 days (configurable). Again → due tomorrow, stage reset. Hard → stage kept, due in half the interval (min 2 days). Good → next interval. Easy → skips one stage. Past the last interval, spacing doubles (max 180 days). "Flag for extra revision" on a problem's notes makes it due now.
- **Mastery** is an estimate: solving alone is worth 30/100; independence, confidence ratings and passed revisions earn the rest. A topic is only marked reliable after 3+ solves and 1+ successful revision.
- **Unlocking:** a batch unlocks when the previous batch of its topic and the first batch of each prerequisite topic are complete. Turn on "flexible practice" to open everything.

## The catalog
`src/data/roadmap.ts` (phases, topics, prerequisites, tiers) and `src/data/catalog.ts` (31 batches × 5 problems = 155). Every entry is currently `verification: 'unverified'`: titles, slugs and difficulties were written from knowledge, **not checked against leetcode.com**. Before relying on it, open each link and confirm title and difficulty, fix any mismatch, then flip the entry to verified.

Adding problems: add a row `[slug, title, 'E'|'M'|'H', pattern]` to a batch. `npm test` enforces unique slugs, 5 rows per batch ordered E,E,M,M,H, correct URLs, and valid topic references. Batches marked `mixed-challenge` have a Hard that reinforces earlier patterns instead of a same-topic Hard. Phase 0 (concepts) and Phase 10 (simulation) have no fixed batches yet.

## Backup and restore
Settings → **Export JSON** (everything) or **Export CSV** (activity history). **Import** validates the whole file first and shows a preview (new / identical / conflicting / rejected). You choose merge (keep mine or use imported on conflicts) or replace. A backup of your current data downloads automatically before any import, replace or reset. Merge never deletes anything.

## Deploy free (GitHub Pages)
The app uses a hash router and relative asset paths, so it works under any repo path. Push to GitHub, then Settings → Pages → Source: **GitHub Actions**. The included workflow runs tests, builds, and deploys on pushes to `main`. Any static host (Netlify, Cloudflare Pages) also works: build command `npm run build`, publish `dist`.

## Known limitations
- Dark theme only (the theme setting is not implemented).
- No automatic LeetCode sync (by design).
- Phase 0 concept checklists and Phase 10 simulation rounds are not built; Phase 10 is described but has no timed-round generator.
- No offline service worker: the app works offline only if the page is already loaded or cached by the browser.
- UI has not been visually reviewed or browser-tested; see below.
