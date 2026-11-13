# Bug Register

Single source of truth for known defects in this repo. Kiro maintains this file: it re-analyses the codebase and updates this register **before** fixing anything, so the list reflects reality rather than history.

- **Audited:** 2026-11-13 against `master` @ `15c3cf9`
- **Protocol:** `.kiro/steering/bug-workflow.md`

## Legend

| Severity | Meaning |
|---|---|
| **P0** | Live site is broken for all visitors |
| **P1** | Blocks contributors or CI; data loss |
| **P2** | Degrades UX, SEO, or offline behaviour |
| **P3** | Cosmetic, dead code, stale docs |

Status: `open` · `in-progress` · `fixed` · `wontfix`

---

## P0 — Live site broken

### BUG-001 · `data/links.json` is not valid JSON · open

**Symptom.** The tools list never renders. `loadLinks()` in `script.js` throws on `response.json()` and the catch block replaces `#main-content` with `Error loading links`. The entire directory — every tool, every category — is invisible to visitors.

**Scope.** Committed on `master`; working tree is clean, so this is what Vercel serves.

**Cause.** Conflict resolution in six back-to-back tool-addition merges dropped the `},` / `{` separators between adjacent link objects. Three regions are damaged, and nine tool entries have collapsed into three objects:

| Object starts | Entries merged into it | Tools silently lost |
|---|---|---|
| line 328 | `objekto.io`, `MakeImg`, `Lookslate`, `APPLORE` | 3 |
| line 614 | `AUTOMATER.ai`, `Aident Loadout` | 1 |
| line 758 | `RefVid`, `Seedance Now`, `AI Fruit Video` | 2 |

Missing separators sit at lines 332, 335, 338, 618, 762, 765.

**Trap.** Inserting the missing braces makes the file *parse*, but JSON duplicate-key semantics mean the last `title`/`url`/`description` in each merged object wins. A naive syntax fix therefore keeps the file broken-but-silent and drops six tools. Each object must be split back into its original entries, recovering the lost field values from the source branches (`add-makeimg`, `add-lookslate`, `add-applore`, `add-automater-ai`, `add-refvid`, `add-seedance-now`).

**Verify.** `npm run validate-json` passes, `npm run check-duplicates` passes, and the category/tool counts rise by 6 tools versus the broken file.

---

### BUG-002 · `data/contributors.json` is not valid JSON · open

**Symptom.** Same failure mode in `loadContributors()`: the contributors wall, its count, and the footer contributor stat all fail to populate.

**Cause.** Two distinct defects from the same merges:

1. **Merged objects.** The object starting at line 742 holds four `name` keys — `dnzg`, `Louis Chi`, `Zhijun Song`, `ViggoZ` — collapsed into one. Three contributors are silently lost; separators are missing at lines 752 and 766, and the `contributions` array of the `APPLORE` entry is closed inline (`"..."],`) instead of on its own line.
2. **Trailing commas** before a closing `}` at lines 771, 781, 791, 801 (`website` fields of `Frank-Masciopinto`, `ljhskyso`, `grades2018`, plus the malformed array above).

**Verify.** `node scripts/validate-contributors.js --quick` exits 0 and reports 73 contributors (70 currently counted, 3 recovered from the merged object).

---

## P1 — Blocks contributors or CI

### BUG-003 · Nothing validates `master` after a merge · open

**Symptom.** BUG-001 and BUG-002 reached production undetected. This is the root cause that let them land.

**Cause.** `check-duplicates.yml` and `validate-data.yml` trigger only on `pull_request`. They validate the *branch head*, never the *merge result*. The pre-commit hook (`.github/hooks/pre-commit`) checks staged files, so it does not run for a merge commit created by GitHub's UI. Conflict damage introduced during resolution therefore has no gate at all.

**Fix direction.** Add `push: branches: [master, production]` to the data-validation workflow so every merge result is parsed, and consider `merge_group` if merge queues are enabled later. Keep the PR triggers as they are.

**Verify.** Push a branch with deliberately broken JSON to a scratch branch and confirm the workflow fails.

---

### BUG-004 · Six contributors are missing the required `role` field · open

**Symptom.** Even once BUG-002 is fixed, `validate-contributors.js --quick` fails: `role` is in `REQUIRED_FIELDS`, and 64 of 70 entries have it.

**Cause.** The contributor examples in `README.md` and `docs/CONTRIBUTING.md` omit `role` entirely, so contributors copy an invalid template. `docs/CONTRIBUTOR_EXAMPLE.md` should be checked against the validator too.

**Fix direction.** Backfill `"role": "Contributor"` on the affected entries *and* add `role` to both documented examples, otherwise the problem returns with the next PR.

**Verify.** `node scripts/validate-contributors.js --quick` reports no missing fields; the docs examples validate when pasted in.

---

## P2 — Degraded UX, SEO, offline

### BUG-005 · Service worker caches the wrong asset set · open

**Symptom.** Offline and repeat visitors get a partially-styled page with no entrance animations.

**Cause.** `FILES_TO_CACHE` in `sw.js` lists `/style.css` and `/script.js` but omits `modern.css` and `animations.js`, both of which `index.html` loads. It also pre-caches Font Awesome **6.0.0** while `index.html` requests **6.4.0**, so the cached stylesheet is never used and the real one is never cached.

**Fix direction.** Add the two missing local files, align the Font Awesome URL to 6.4.0, and bump `CACHE_NAME` (currently `ai-tools-hub-v1.0.1`) so existing installs refresh.

**Verify.** DevTools → Application → Cache Storage lists all five local assets under the new cache name; the page renders correctly with the network throttled to offline.

---

### BUG-006 · Social preview images are SVG and will not render · open

**Symptom.** Links shared to X/Twitter, Facebook, LinkedIn, Slack, Discord and WhatsApp show no preview image.

**Cause.** `index.html` sets `og:image` and `twitter:image` to `/assets/og-image.svg`. No major social crawler supports SVG for Open Graph images; the declared `og:image:width/height` of 1200×630 is also meaningless for a vector file.

**Fix direction.** Render `assets/og-image.svg` to a 1200×630 PNG, commit it, and point both meta tags at it.

**Verify.** The PNG exists at the referenced path and loads over HTTPS from the deployed site.

---

### BUG-007 · `manifest.json` references a screenshot that does not exist · open

**Symptom.** 404 during PWA install; browsers drop the screenshot from the install prompt.

**Cause.** `screenshots[0].src` is `/assets/og-image.png`. `assets/` contains only `favicon.svg` and `og-image.svg`.

**Note.** Fixing BUG-006 creates exactly the PNG this entry expects, so handle the two together. The `icons` array also declares `sizes: "192x192"` and `"512x512"` for the same SVG, which is harmless but misleading.

**Verify.** Every `src` in `manifest.json` resolves to a committed file.

---

## P3 — Cosmetic, dead code, stale docs

### BUG-008 · `sitemap.xml` contains invalid entries · open

Fragment URLs (`/#tools`, `/#categories`, `/#contributors`, `/#about`) are not distinct pages and are ignored by crawlers, and the `github.com` entry points off-domain, which is invalid in a sitemap hosted on `ai-tool-collection.vercel.app`. Every `lastmod` is frozen at `2025-01-26`. Reduce to the single homepage URL with a current `lastmod`.

### BUG-009 · ~190 lines of commented-out AI chat widget in `index.html` · open

Two near-identical copies of an unreleased "AI Scout Agent" widget sit inside HTML comments at lines 1661–1802 and 1805–1854, each with its own markup, `<style>`, and `askAgent()` implementation. Both are inert — the duplicate `ai-window` / `ai-input` / `ai-messages` ids are not live — but they ship to every visitor and will cause real id collisions if either is ever uncommented. Delete both; the feature is recoverable from git history.

### BUG-010 · Documentation contradicts the repo · open

- `README.md` claims "100+ Free AI Tools" and "15+ Active Contributors"; actual counts are ~211 tools and 70 contributors.
- `README.md`'s project-structure block omits `modern.css` and `animations.js`.
- `docs/CONTRIBUTING.md`'s structure block lists `src/`, `tests/`, `check-duplicates.js` and root-level `links.json` / `contributors.json`, none of which exist.
- `docs/CONTRIBUTING.md` numbers two consecutive steps "8" (Commit & Push, Create Pull Request).
- `setup-hooks.sh` tells users to run `node validate-links.js`, but the script lives at `scripts/validate-links.js`.

### BUG-011 · `validate-links.js` reports every `http://` URL as unreachable · open

`checkReachability()` always calls `https.request()`, which throws `ERR_INVALID_PROTOCOL` for an `http://` URL; the `catch` turns that into `resolve(false)`. One such URL is currently in `links.json`, so `npm run validate` will always warn about it regardless of whether the host is up. Select the module from the parsed protocol. The destructured `hostname` on the same line is unused and can go.

### BUG-012 · Pagination comment contradicts the code · open

`script.js` sets `contributorsPerPage = 16` with the trailing comment `// 12 contributors per page (4x3 grid)`. Correct the comment to match the value, or the value to match the intended grid.

---

## Fixed

_Nothing yet. Move entries here with the commit SHA and date when they are resolved._
