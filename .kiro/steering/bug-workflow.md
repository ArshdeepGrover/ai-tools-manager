# Bug-fixing protocol

`docs/BUGS.md` is the bug register for this repo. It is a living document, not an append-only log.

## When the user asks to fix bugs

Whenever the request is to fix a bug, fix "the bugs", or work through the register — including vague forms like "fix bugs" or "fix BUG-005" — run these phases in order. Never skip straight to editing code.

### Phase 1 — Analyse, then update the register

Do this **before** touching any source file.

1. Read `docs/BUGS.md` to load the current list.
2. Re-verify the entries in scope. An entry is only real if you reproduce it now: parse the JSON, run the validator, grep the line the entry cites. Line numbers drift as the data files grow, so confirm them rather than trusting the register.
3. Scan for defects the register is missing, at least:
   - `npm run validate-json` and `node scripts/validate-contributors.js --quick`
   - duplicate-key / merged-object damage in `data/*.json`, which parses cleanly but loses entries
   - asset paths in `index.html`, `manifest.json` and `sw.js` that point at files not in the repo
4. Rewrite `docs/BUGS.md` to match what you found: correct stale line numbers, add new entries with fresh IDs, mark entries that no longer reproduce as `fixed` or `wontfix` with a one-line reason, and re-sort by severity. Update the `Audited:` line with the date and the current commit SHA (`git rev-parse --short HEAD`).
5. Report what changed in the register and which entries you are about to fix. If the scope is larger than the user likely expected — several P0s, or a fix that needs data recovered from other branches — confirm the scope before proceeding.

### Phase 2 — Fix

- Work in severity order: P0, then P1, P2, P3. Stop and report after the P0s if the user asked for "the critical ones" or similar.
- One logical fix per commit, following the Conventional Commits format in `docs/COMMIT_GUIDELINES.md` (`fix(ui): ...`, `fix(tools): ...`).
- Keep each fix minimal. A bug fix is not an invitation to refactor the surrounding code or restyle the file.
- Never "fix" a data file by deleting entries to make it parse. Recover the intended content — check the merge commit and the source branch — or stop and ask.

### Phase 3 — Verify, then record

- Run the `Verify` step written in each entry. A command exiting 0 is not enough when the entry names a count or a rendered result: check the count, check the rendering.
- After data edits always run `npm run validate-json` and `npm run check-duplicates`.
- Move resolved entries to the `## Fixed` section of `docs/BUGS.md` with the date and commit SHA. Leave anything you could not verify in `open` with a note on what blocked verification — do not mark it fixed.

## When the user reports a new bug

Add it to `docs/BUGS.md` first, reproduced and with a severity assigned, then fix it under the phases above. A report is never resolved by reading the code and concluding it looks correct; reproduce it or say plainly that you could not.

## Entry format

Each entry carries: ID (`BUG-0NN`, never reuse a retired number), one-line title, status, symptom as a visitor or contributor experiences it, cause with file and line, fix direction, and a concrete `Verify` step.
