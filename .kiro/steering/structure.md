# Structure and conventions

## Layout

```
index.html        single page: head/SEO/JSON-LD, Tailwind inline config, all markup,
                  and ~12 inline <script> blocks (search UI, misc widgets)
script.js         main app logic (~1700 lines, global functions + PWAManager class)
animations.js     scroll progress and entrance animations; self-contained IIFE,
                  gated on a `js-ready` class so content survives if it fails to load
style.css         base styling
modern.css        newer styling layer, loaded after style.css
sw.js             service worker: static cache + network-first for data files
offline.html      offline fallback page
manifest.json     PWA manifest
data/
  links.json          the tools database — the file most PRs touch
  contributors.json   contributor profiles
scripts/
  validate-links.js         duplicates + reachability; `--duplicates-only` for the fast path
  validate-contributors.js  field/format checks; `--quick` for the no-network path
docs/             CONTRIBUTING, COMMIT_GUIDELINES, CONTRIBUTOR_EXAMPLE
assets/           favicon.svg, og-image.svg
.github/          workflows, issue templates, pre-commit hook
setup-hooks.sh    installs .github/hooks/pre-commit into .git/hooks
```

The `README.md` project-structure block is slightly out of date (it omits `modern.css` and `animations.js`); `docs/CONTRIBUTING.md` is more out of date still (it lists `src/`, `tests/`, and root-level JSON paths that do not exist). Trust the tree above.

## Data schemas

`data/links.json` — exactly these keys, no extras:

```json
{
  "categories": [
    {
      "name": "AI Writing & Content",
      "icon": "✍️",
      "links": [
        { "title": "ChatGPT", "url": "https://chat.openai.com", "description": "Free AI chat with daily limits" }
      ]
    }
  ]
}
```

Titles and URLs must be unique across *all* categories, not just within one. New categories need a single emoji icon and at least three tools.

`data/contributors.json`:

```json
{
  "contributors": [
    {
      "name": "Full Name",
      "github": "username",
      "avatar": "https://github.com/username.png",
      "contributions": ["Added Tool Name to Category"],
      "role": "Contributor",
      "linkedin": "username-slug",
      "tagline": "short descriptor",
      "website": "https://example.com",
      "featured": true
    }
  ]
}
```

- Required by the validator: `name`, `github`, `avatar`, `contributions`, `role`. The README and `docs/CONTRIBUTING.md` examples omit `role` — follow the validator, and expect contributor PRs to be missing it.
- `linkedin` is a bare username, not a URL; a URL is a hard validation failure.
- `github` is a bare username too; `avatar` must be an HTTPS URL.
- `featured` is used by the first entry only; the validator warns on it as an unknown field.
- Names and GitHub usernames must be unique (case-insensitive).

## Code conventions

- Prettier-style formatting: 2-space indent, double quotes, semicolons, trailing commas in JS.
- `script.js` defines plain global functions called from inline `onclick` handlers in generated markup. Keep that pattern when extending rendering code rather than introducing listeners halfway.
- Escaping helpers at the top of `script.js` (`escapeHtml`, `escapeJsString`, `safeUrl`, `safeHostname`) must wrap every value that reaches HTML or an inline handler.
- Theme state lives in `localStorage.theme` and a `data-theme` attribute on `<html>`.
- Favicons for tools come from Google's s2 service via `faviconUrl()`.
- Respect `prefers-reduced-motion` — `animations.js` already does.
- Mobile-first: verify changes at narrow widths before calling them done.

## Git conventions

- Commit messages follow Conventional Commits with a scope: `feat(tools): add X to Y category`, `fix(ui): ...`. Types: feat, fix, docs, style, refactor, perf, test, chore. Scopes: tools, ui, docs, config, assets, analytics, seo. Imperative mood, lowercase subject, no trailing period, ≤50 chars.
- Branch per contribution, named for the change (`add-<tool-name>`, `fix/<thing>`).
- The remote is named `public`, not `origin`. Default branch is `master`; `production` is a separate branch that gates the deeper pre-commit validation.
- Tool additions arrive as many small PRs merged into `master`. Merge conflicts in `data/links.json` are common and have produced malformed JSON in the past — always re-run `npm run validate-json` after resolving one.
