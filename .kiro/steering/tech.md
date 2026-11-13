# Tech stack and commands

## Stack

Plain static site. **No build step, no bundler, no framework, no transpiler.** Browsers load the source files as written.

- Vanilla HTML/CSS/JS (ES2017+ browser syntax, no modules — scripts share the global scope)
- Tailwind via CDN (`cdn.tailwindcss.com`) with an inline config block in `index.html`
- Hand-written CSS in `style.css` and `modern.css`, both loaded in that order
- Font Awesome 6 and Inter from CDN
- Service worker (`sw.js`) for PWA/offline; `manifest.json`; `offline.html` fallback
- Node.js (18 in CI) only for the validation scripts in `scripts/` — these use `fs`, `https`, `url` and nothing else
- `package.json` declares **zero dependencies**. Keep it that way unless the user explicitly asks to add one.
- Deployed to Vercel as static files

## Commands

```bash
npm run validate-json           # JSON syntax check on both data files — run this after ANY data edit
npm run check-duplicates        # duplicate titles/URLs in links.json (offline, fast)
npm run validate                # full links check: duplicates + HTTPS HEAD reachability on every URL (slow, network)
npm run validate-contributors   # full contributors check (network)
node scripts/validate-contributors.js --quick   # structure only, no network — what CI runs
```

Serving locally (ask the user to run long-lived servers themselves):

```bash
npx serve .      # or open index.html directly; VS Code Live Server is configured on port 5501
```

## Validation gates

- **CI** (`.github/workflows/`): on PRs touching `data/links.json` or `data/contributors.json`, runs `validate-links.js --duplicates-only` and `validate-contributors.js --quick`, then comments pass/fail on the PR. Other workflows post a welcome comment on PR open and a deploy notice when a `deployed` label is added.
- **Pre-commit hook** (`.github/hooks/pre-commit`, installed by `./setup-hooks.sh`): JSON syntax check on every branch; the heavier duplicate/contributor validation only on the `production` branch.
- Reachability checks are advisory — unreachable URLs are warnings, duplicates are hard failures.

## Hard constraints

- Invalid JSON in `data/` breaks the live site silently (the page falls back to an error state). Always parse-check after editing data.
- `sw.js` caches by version string (`CACHE_NAME`, `DATA_CACHE_NAME`). Bump those when changing cached assets, or returning visitors keep stale files. Note `FILES_TO_CACHE` currently omits `modern.css` and `animations.js`.
- No secrets in this repo. The GA ID and GitHub API calls are public and unauthenticated.
- User-supplied strings from the JSON data are rendered into HTML. Route them through the existing `escapeHtml` / `escapeJsString` / `safeUrl` helpers in `script.js`; never interpolate raw values into markup.
