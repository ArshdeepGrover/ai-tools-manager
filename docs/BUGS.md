# Bug Register

Single source of truth for known defects in this repo. Kiro maintains this file: it re-analyses the codebase and updates this register **before** fixing anything, so the list reflects reality rather than history.

- **Audited:** 2026-11-13 against `master` @ `67d7d45`
- **Protocol:** `.kiro/steering/bug-workflow.md`

## Legend

| Severity | Meaning                                |
| -------- | -------------------------------------- |
| **P0**   | Live site is broken for all visitors   |
| **P1**   | Blocks contributors or CI; data loss   |
| **P2**   | Degrades UX, SEO, or offline behaviour |
| **P3**   | Cosmetic, dead code, stale docs        |

Status: `open` · `in-progress` · `fixed` · `wontfix`

---

## Open

### BUG-013 · Social preview image shows stale counts and clipped text · P3 · open

**Symptom.** `assets/og-image.svg` (and the PNG rendered from it, now served to every social crawler) advertises **100+ AI Tools** and **10+ Categories**. Actual counts are 211 tools and exactly 10 categories. The `Open Source` label also overflows its rounded pill, visibly crossing the border.

**Cause.** The badge text is hard-coded in the SVG at the `<text>` nodes around line 58 and has not been updated as the directory grew. The overflow is a layout issue in the same file — the pill width was sized for shorter text.

**Why it is still open.** This is a design asset, and editing the text requires re-sizing the pill to avoid making the overflow worse. Left for a deliberate design pass rather than bundled into a bug sweep.

**Fix direction.** Update both badge labels, widen the `Open Source` pill, then re-render: `rsvg-convert -w 1200 -h 630 -o assets/og-image.png assets/og-image.svg`.

**Verify.** The regenerated PNG is 1200×630, the badges read the current counts, and no text crosses a pill border.

---

### BUG-014 · One tool URL uses `http://` and redirects · P3 · open

**Symptom.** `data/links.json` lists `http://pvid.app/`, which answers `301` and redirects. Every other entry is HTTPS, and `validate-contributors.js` already treats non-HTTPS as an error for contributor URLs.

**Fix direction.** Follow the redirect to its final HTTPS target and update the entry. Verify the destination is the intended tool before changing the stored URL.

**Verify.** `grep '"url": "http://' data/links.json` returns nothing, and `npm run validate` reports the entry reachable.

---

### BUG-015 · No formatter config, so format-on-save restyles whole files · P3 · open

**Symptom.** Editing one line of `sw.js` through an editor with format-on-save rewrote all 166 remaining lines, converting the file's single quotes to double quotes. The same risk applies to any file a contributor touches, which buries one-line changes in whole-file diffs and causes avoidable merge conflicts — the conditions that produced BUG-001 and BUG-002.

**Cause.** The repo has no `.prettierrc`, `.editorconfig`, or `.prettierignore`. Editors fall back to their own defaults, which disagree with the committed style: `sw.js` and `animations.js` use single quotes, while `script.js` and `scripts/*.js` use double.

**Fix direction.** Commit an `.editorconfig` and a `.prettierrc` that encode the dominant style (2-space indent, double quotes, semicolons, trailing commas), then reformat the stragglers in one isolated commit so future diffs stay minimal. Do not mix that reformat with a functional change.

**Verify.** Editing a single line in `sw.js` produces a single-line diff.

---

## Fixed

All entries below were fixed and verified on **2026-11-13**. Everything except BUG-003's event guard landed in commit `14bab45`.

### BUG-001 · `data/links.json` was not valid JSON · fixed

Six tool-addition merges dropped the `},`/`{` separators between adjacent link objects, fusing nine entries into three objects and leaving the file unparseable, so `loadLinks()` replaced the whole directory with `Error loading links`.

Because JSON duplicate-key semantics let the last `title`/`url`/`description` win, simply inserting the missing braces would have made the file parse while silently discarding six tools. Each object was split back into its original entries, with field values recovered from the commits that introduced them:

| Fused object                               | Entries restored | Recovered from                             |
| ------------------------------------------ | ---------------- | ------------------------------------------ |
| objekto.io + MakeImg + Lookslate + APPLORE | 4                | `3520b28`, `578cc5e`, `a3457c3`, `4bfe8a1` |
| AUTOMATER.ai + Aident Loadout              | 2                | `c7cc235`, `4bfe8a1`                       |
| RefVid + Seedance Now + AI Fruit Video     | 3                | `e616494`, `ccf5067`, `4bfe8a1`            |

**Verified.** `npm run validate-json` passes. 211 parsed tool objects exactly match the 211 `"title":` occurrences in the raw text, confirming zero loss. `npm run check-duplicates` reports 211 links across 10 categories with no duplicates. In headless Chrome all 211 tools render, including all 9 restored entries.

### BUG-002 · `data/contributors.json` was not valid JSON · fixed

Same failure mode plus trailing commas: four contributors (`dnzg`, `Louis Chi`, `Zhijun Song`, `ViggoZ`) were fused into one object, and four `}` closers were preceded by a stray comma. All four entries were reconstructed from `f5c89f4`, `e616494`, `eaec35d` and `4edcd43`.

**Verified.** `node scripts/validate-contributors.js --quick` passes with 70 contributors; 70 parsed objects match 70 `"name":` occurrences. All four restored contributors render in the browser across the five contributor pages.

### BUG-003 · No validation gate on the merge result · fixed

**Correction to the original analysis.** This entry first claimed the damage "had no gate at all". The CI logs disprove that. The PR runs _did_ catch it: `Validate Data` on `add-objekto`, `add-transcribe-video-to-the-text`, `add-refvid` and `add-automater-ai` all failed with `SyntaxError: Unexpected string in JSON at position 13474` — the same byte offset reproduced locally.

The actual failure chain:

1. Resolving a conflict while merging `master` into a contributor branch dropped the object separators. The first bad commit is `b7c0307`.
2. CI ran on the branch and correctly failed.
3. The step that posts the explanatory comment crashed with a `TypeError` before commenting (BUG-016), so the PR showed no explanation of what broke.
4. The PRs were merged while red.
5. No `push` gate existed, so `master` carried the breakage with no further signal.

Step 5 is what this entry fixes; step 3 is BUG-016. Added a `push` trigger for `master` and `production` scoped to the two data paths, so the merge result itself is validated. Both PR-comment steps needed guarding with `github.event_name == 'pull_request'` — they read `context.issue.number` and the `pull_request` payload, neither of which exists on a push event, so without the guard every push run would throw and report failure even when validation passed.

**Verified end-to-end on GitHub.** Run `43380433249`: workflow `Validate Data`, branch `master`, event `push`, result **success** in 15s. The trigger fires and the event guard holds.

### BUG-016 · Validation failures never reached contributors · P1 · fixed

**Found during this pass, from the CI logs — not previously recorded.**

**Symptom.** Both comment steps in `validate-data.yml` crashed instead of commenting:

```
TypeError: changedFiles.includes is not a function
##[error]Unhandled error: TypeError: changedFiles.includes is not a function
```

So a contributor whose PR failed validation saw a red check with no explanation, and a passing PR got no confirmation either. This is why the broken-JSON PRs were merged: the failure was never surfaced in the conversation.

**Cause.** `context.payload.pull_request.changed_files` is an **integer count** of changed files, not an array of filenames. Calling `.includes()` on a number throws.

**Fix.** Fetch the real filenames with `github.rest.pulls.listFiles` and map to `f.filename`. Also added the missing `await` on both `createComment` calls so future failures surface as step errors rather than unhandled rejections.

**Verified.** Workflow YAML parses with all 5 steps intact; both embedded `github-script` blocks pass `node --check`. The comment path itself will be exercised by the next pull request that touches a data file — the type fix is confirmed against the documented payload shape and the observed `TypeError`, not yet by a green comment in a PR.

### BUG-004 · Contributors were missing the required `role` field · fixed

`role` is in the validator's `REQUIRED_FIELDS`, but the contributor templates in `README.md` and `docs/CONTRIBUTING.md` omitted it, so contributors copied an invalid shape. Backfilled `"role": "Contributor"` on the three affected entries (the other three arrived with the BUG-002 recovery, which restored their original `role` values) and added `role` to both documented examples, each now stating which fields are required and that `linkedin` must be a bare username.

**Verified.** `validate-contributors.js --quick` reports no missing fields across all 70 entries.

### BUG-005 · Service worker cached the wrong asset set · fixed

`FILES_TO_CACHE` omitted `modern.css` and `animations.js`, so offline visitors got a partially-styled page, and it pre-cached Font Awesome 6.0.0 while `index.html` requests 6.4.0 — the cached copy was never used and the real one never cached. Added both local files, aligned the CDN URL to 6.4.0, and bumped `CACHE_NAME` to `ai-tools-hub-v1.0.2` so existing installs refresh.

**Verified.** Every local path in `FILES_TO_CACHE` resolves to a committed file; `node --check sw.js` passes. The edit is a 12-line diff — an earlier attempt through the editor restyled all 166 lines of the file and was reverted (see BUG-015).

### BUG-006 · Social preview images were SVG · fixed

No major social crawler renders SVG for `og:image`, so shared links showed no preview. Rendered `assets/og-image.svg` to a 1200×630 PNG with `rsvg-convert` and pointed `og:image` and `twitter:image` at it.

**Verified.** `assets/og-image.png` exists at 1200×630 with 8,669 distinct colours (not blank) and was inspected visually. Note the rendered image carries the stale counts tracked as BUG-013.

### BUG-007 · `manifest.json` referenced a missing screenshot · fixed

`screenshots[0].src` pointed at `/assets/og-image.png`, which did not exist. Fixed by BUG-006 creating exactly that file; no manifest edit was needed.

**Verified.** Every `src` in `manifest.json` — icons, screenshots, shortcut icons, and the offline fallback — resolves to a committed file.

### BUG-008 · `sitemap.xml` contained invalid entries · fixed

Four fragment URLs that crawlers ignore, one off-domain `github.com` URL that is invalid in a sitemap served from this host, and a `lastmod` frozen at 2025-01-26. Reduced to the single homepage URL with a current `lastmod` and a comment explaining why.

**Verified.** XML parses; one `<url>` entry with `lastmod` 2026-11-13.

### BUG-009 · 195 lines of dead AI chat widget in `index.html` · fixed

Two near-identical copies of an unreleased "AI Scout Agent" widget sat inside HTML comments, each with its own markup, `<style>` block and `askAgent()` implementation, shipping to every visitor. Before deleting, confirmed all 26 references to its ids and functions were inside the dead block and that no live asset referenced them. Removed lines 1662–1856; the feature remains in git history.

**Verified.** `index.html` went from 1,924 to 1,729 lines; zero residual references; comment markers balanced at 56 open / 56 close; the page still renders correctly in headless Chrome.

### BUG-010 · Documentation contradicted the repo · fixed

- Stats refreshed: 200+ tools and 70+ contributors, replacing "100+" and "15+".
- Nine links to the nonexistent `ai-tools-collection` repo corrected to `ai-tools-manager` across `README.md` and `docs/CONTRIBUTING.md`.
- `README.md`'s structure block now lists `modern.css`, `animations.js`, `sw.js`, `offline.html`, `robots.txt`, `sitemap.xml`, `setup-hooks.sh` and `docs/BUGS.md`.
- `docs/CONTRIBUTING.md`'s structure block no longer lists `src/`, `tests/`, `check-duplicates.js` or root-level JSON paths, and now shows the real `data/`, `docs/`, `scripts/` and `assets/` layout.
- The duplicate step "8" is now correctly numbered 9.
- `setup-hooks.sh` points at `scripts/validate-links.js` rather than a root-level path.

The stale counts baked into the OG image are tracked separately as BUG-013.

### BUG-011 · `validate-links.js` reported every `http://` URL as unreachable · fixed

`checkReachability()` always called `https.request()`, which throws `ERR_INVALID_PROTOCOL` on an `http://` URL; the surrounding `catch` turned that into "unreachable". Now selects `http` or `https` from the parsed protocol. The unused `hostname` destructure was removed.

**Verified.** Against the one `http://` entry in the data, the old logic returned `ERR_INVALID_PROTOCOL` and the new logic returns `301`. The URL itself is tracked as BUG-014.

### BUG-012 · Pagination comment contradicted the code · fixed

`contributorsPerPage = 16` was annotated `// 12 contributors per page (4x3 grid)`. Comment corrected to `4x4 grid`.

**Verified.** The browser reports 70 contributors across 5 pages at 16 per page, matching the corrected comment.
