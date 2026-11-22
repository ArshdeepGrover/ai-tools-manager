# Bug Register

Single source of truth for known defects in this repo. Kiro maintains this file: it re-analyses the codebase and updates this register **before** fixing anything, so the list reflects reality rather than history.

- **Audited:** 2026-11-22 against `master` @ `3fd6b38` (previous audit: 2026-11-13 @ `67d7d45`)
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

### BUG-019 · Red `Validate Data` runs do not block merges · P1 · open

**Symptom.** Four PRs (#269 Songluna AI, #270 Datacircle, #271 Twistavo, #272 PawMambo) were merged on 2026-11-17 to 2026-11-22 while both data files on their branches were unparseable, putting `master` back into the BUG-001/BUG-002 state five days after that was fixed (BUG-017, BUG-018).

**Cause.** BUG-003 added a `push` trigger so the merge result is _validated_, but validation only reports; nothing _prevents_ a merge. The breaking commits are contributor-side conflict resolutions — `9923477` ("Merge branch 'master' into feat/add-songluna-ai") broke `links.json` and `2629bdd` ("Merge branch 'master' into add-datacircle") broke `contributors.json` — step 1 of the BUG-003 chain. Every later merge carried the damage forward.

**Mitigated 2026-11-22 (uncommitted).** The damage can no longer slip through silently in two places, even when it still parses as JSON:

- `validate-links.js --duplicates-only` and `validate-contributors.js --quick` now fail when a raw `"title"`/`"github"` key has no parsed object of its own (fused entries), so CI fails on exactly this damage.
- The pre-commit hook now runs both structural checks on every branch, not only `production`, so the contributor's own commit is blocked. Contributors must re-run `./setup-hooks.sh`; the hook in this clone's `.git/hooks` is still the September 2025 copy.

**Why it is still open.** The root cause is a repository setting, which cannot be changed from the code. Whether `Validate Data` reported failure on these PRs also could not be checked from the audit session (no GitHub API access).

**Fix direction.** Settings → Branches → add a rule for `master` (and `production`): require status check `validate-data`, and require branches to be up to date before merging. Longer term, remove the shared-array conflict surface: one file per tool / contributor (`data/tools/<slug>.json`) assembled into `links.json` at build time.

**Verify.** A test PR that fuses two tools in `data/links.json` (valid JSON, missing `}, {`) shows the merge button blocked by the failing required check.

---

## Fixed

### Fixed 2026-11-22

BUG-014, BUG-017 and BUG-018 landed in `3fd6b38`. Everything else in this group is in the working tree on top of `3fd6b38`, **commit pending**. Suggested split, one logical change per commit (`docs/COMMIT_GUIDELINES.md`): formatting-only (BUG-015) first, then each fix on its own.

All page-level fixes were verified by rendering `index.html` and `offline.html` in headless Chrome before and after (desktop 1366 px, mobile 390 px) and diffing the screenshots pixel by pixel.

### BUG-017 · `data/links.json` was not valid JSON (recurrence of BUG-001) · P0 · fixed in `3fd6b38`

The live directory showed `Error loading links`: `JSON.parse` failed at line 795. The conflict resolution in `9923477` and each later merge dropped the `},`/`{` separators, fusing PawMambo, Twistavo, Songluna AI and GetYouTubeTranscript into one object. Only adding braces would have parsed but kept just the last tool, so the object was split back into four entries, each field compared against the commit that introduced it (`f2d7444`, `7fd7bc6`, `76fe27c`, `9bd01d6`).

**Verified.** `npm run validate-json` passes; 216 parsed tools match 216 raw `"title":` keys; `check-duplicates` reports 216 links across 10 categories with no duplicates; all tools render in headless Chrome.

### BUG-021 · Tailwind was loaded from the Play CDN in production · P2 · fixed

Every visit downloaded Tailwind's in-browser compiler (a large script) and generated CSS at runtime before the page was fully styled; `offline.html` used the same CDN, so the offline page was only styled if that third-party script happened to be cached.

**Fix.** The inline `tailwind.config` moved to `tailwind.config.js` (unchanged theme); `npm run build:css` compiles `tailwind.input.css` into a committed, minified `tailwind.css` (22 KB). Both pages link it, `sw.js` precaches `/tailwind.css` instead of the CDN, and `CACHE_NAME` is bumped to `ai-tools-hub-v1.0.3`. The `<link>` sits **last in `<head>`**: the Play CDN appended its styles there, so Tailwind won the cascade against Font Awesome's `line-height: 1`. An earlier placement lost that tie and shrank every icon line box by 8–10 px.

**Verified.** Screenshots before vs. after: identical page heights; mobile pixel-identical; desktop differs only in anti-aliasing on one 17 px icon. Rebuilding produces a byte-identical `tailwind.css`.

### BUG-022 · GitHub stats undercounted issues and hit the unauthenticated rate limit · P2 · fixed

**Symptom.** The footer showed **22** open issues when the repo had **31**: `/issues?state=open` returns only the first 30 items and includes pull requests, so the count could never exceed 30. Every page load also spent two of the visitor IP's 60 unauthenticated GitHub API requests per hour, so shared networks saw `-`.

**Fix.** `loadGitHubStars()` (`script.js`) now uses the search API's `total_count` for an exact issue count, caches all three numbers in `localStorage` for an hour (wrapped in `try/catch` for private mode), checks `response.ok`, and falls back to the last cached values on failure instead of `-`. A star count of `0` is no longer shown as `-` (`??` instead of `||`).

**Verified.** Live API: old method 22, search `total_count` 31; the rendered footer shows `Issues: 31`.

### BUG-024 · Mobile pages were wider than the screen · P2 · fixed

**Found during this pass.** At a 390 px phone width the page laid out at **422 px**: the `reveal-right` cards in the "Created by / Community" section start 48 px off-canvas (`modern.css`) until scrolled into view. Phones zoomed the whole page out to fit, shrinking all text, and the fixed back-to-top button sat partly off-screen.

**Fix.** `html, body { overflow-x: clip; }` next to the reveal rules in `modern.css`. `clip` does not create a scroll container (unlike `hidden`), so sticky and fixed elements are unaffected; browsers without support behave as before.

**Verified.** Mobile emulation at 390 px: `innerWidth` and `scrollWidth` 422 → 390; horizontal scrolling no longer possible; footer and cards render at full width.

### BUG-018 · `data/contributors.json` was not valid JSON (recurrence of BUG-002) · P2 · fixed in `3fd6b38`

The contributors section failed to load (parse error at line 848). The conflict resolution in `2629bdd` fused five contributors — `PawMambo Team`, `AZERIA IT`, `Datacircle`, `Tover Wu`, `pushkarsingh32` — into one object and dropped the required `role` from three. Split back into five entries with `role` restored as in `f2d7444`, `7fd7bc6` and `76fe27c`.

`3fd6b38` also collapsed one-item `contributions` arrays onto one line and moved `alvabillwu` to the end of the list. Its message says "Remove alvabillwu", but the entry is still present and unchanged — only its position moved.

**Verified.** `validate-contributors.js --quick` reports 75 valid contributors; 75 parsed objects match 75 raw `"github":` keys.

### BUG-014 · One tool URL used `http://` and redirected · P3 · fixed in `3fd6b38`

`http://pvid.app/` → `https://pvid.app/`. The HTTPS page returns `200` and is the same product ("Photo AI Video Generator", Kling 3.0). Recurrence is now blocked: `validate-links.js` rejects any non-`https://` tool URL (BUG-020).

**Verified.** `grep '"url": "http://' data/links.json` returns nothing; the full `npm run validate` run does not list PVID as unreachable.

### BUG-013 · Social preview image showed stale counts and clipped text · P3 · fixed

Badges now read **200+** AI Tools (216 actual; a rounded figure so the image does not go stale with every addition) and **10** Categories. The `Open Source` pill was widened from 180 to 230 px with the label at 26 px, so no text crosses a border. The ✨ tile rendered blank wherever no emoji font is installed, so the sparkle is now drawn as SVG paths. Re-rendered with `rsvg-convert -w 1200 -h 630`.

**Verified.** `assets/og-image.png` is 1200×630 and was inspected visually.

### BUG-015 · No formatter config, so format-on-save restyled whole files · P3 · fixed

Added `.editorconfig`, `.prettierrc.json` (2 spaces, double quotes, semicolons, trailing commas, LF) and `.prettierignore`, plus `npm run format` / `format:check` with `prettier` as a dev dependency. Every JS, CSS, JSON, YAML and Markdown file was reformatted once — **formatting only**, to be committed on its own. `index.html` and `offline.html` are ignored deliberately: reformatting them would rewrite about 2,000 lines of whitespace-sensitive markup. `.kiro/` is ignored because Kiro maintains it. The data files already matched.

**Verified.** `prettier --check .` passes. Editing one line of `sw.js` (even typed with single quotes) and formatting produces a one-line diff.

### BUG-020 · The 60-character description limit was documented but not enforced · P3 · fixed

101 of 216 descriptions exceed 60 characters (median 58, longest 191), so enforcing the rule on everything would fail the existing data. `validate-links.js --duplicates-only` now takes `--base <git-ref>` and **errors** only for tools that are new or whose description changed relative to that ref; existing long descriptions produce one summary warning. CI passes `--base origin/<base branch>` (checkout now uses `fetch-depth: 0`), the pre-commit hook passes `--base HEAD`. The same check now also errors on missing `title`/`url`/`description` and non-HTTPS URLs, and the README guideline says the rule is enforced for new and edited tools.

**Verified.** In a scratch repo, a change that added a tool with a 75-character description and an `http://` URL, lengthened an existing description, and fused two tools into one valid-JSON object produced four errors and exit code 1; the real data passes. The updated hook blocked the fused-object commit.

### BUG-023 · Offline page loaded a Font Awesome version the service worker does not cache · P3 · fixed

**Found during this pass.** `offline.html` requested Font Awesome **6.0.0** while `sw.js` precaches **6.4.0** (the BUG-005 alignment covered `index.html` only), so the offline page's icons failed exactly when the visitor was offline. Now requests 6.4.0.

**Verified.** Both versions of the offline page render identically online apart from the expected glyph-level icon differences between the two versions.

### BUG-025 · Page text and structured data still said "100+" tools · P3 · fixed

**Found during this pass.** Three meta descriptions, the JSON-LD description, the hero subtitle and `manifest.json` advertised "100+" tools (216 actual). JSON-LD also had `"numberOfItems": "100+"`; schema.org requires an integer there, so the property was invalid. Text updated to "200+"; `numberOfItems` removed, since it is optional and a hard-coded integer would go stale.

**Verified.** No `100+` remains in `index.html` or `manifest.json`; every JSON-LD block parses; the hero renders "200+".

### Fixed 2026-11-13

All entries in this group were fixed and verified on **2026-11-13**. Everything except BUG-003's event guard landed in commit `14bab45`.

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
