# Product

AI Tools Collection (package name `ai-tools-hub`, repo `ArshdeepGrover/ai-tools-manager`) is a community-maintained directory of free and freemium AI tools. It is a single static page that reads two JSON files and renders them as searchable, filterable category sections.

- Live site: https://ai-tool-collection.vercel.app/
- License: MIT. Creator/maintainer: Arshdeep Singh (`ArshdeepGrover`).

## What the site does

- Lists ~200 tools across 10 categories from `data/links.json`.
- Search across titles and descriptions, plus category filtering (dropdown + chips).
- Contributors wall from `data/contributors.json` (~70 entries) with paging, modal detail, and tooltips.
- Live GitHub stats (stars, forks, issues) fetched from the public GitHub API.
- Installable PWA with offline support and a light/dark theme.
- Google Analytics (`G-JFKHKKYC5B`) tracks tool clicks, contributor clicks, and category filtering.

## Who it serves

Two audiences, and both matter when changing anything:

1. **Visitors** looking for a free AI tool. Fast load, works on mobile, no sign-up.
2. **Contributors**, mostly first-time open-source contributors, who open a PR adding one tool and one contributor entry. The contribution path must stay low-friction: edit JSON, no build step, no local tooling required.

## Inclusion rules for tools

These are product decisions, not style preferences. Reject contributions that violate them.

- Must be free or have a real free tier.
- Must be AI-related and genuinely useful.
- Must not duplicate an existing title or URL.
- Description should be short and concrete; the documented ceiling is 60 characters, though many existing entries run longer.
- URL must work.

Full guidance lives in `docs/CONTRIBUTING.md`; commit format in `docs/COMMIT_GUIDELINES.md`.
