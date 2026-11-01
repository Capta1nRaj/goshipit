# goshipit - Project Instructions

## Sync Rule (enforce after every change)

Source of truth: check IDs in `skills/goshipit/references/checks-*.md`; flow + version in `skills/goshipit/SKILL.md`.

After any edit to `skills/goshipit/SKILL.md`, `skills/goshipit/assets/template.md`, or any `skills/goshipit/references/checks-*.md`, auto-sync these fields without being asked:

| Field | Source | Targets |
|---|---|---|
| Check rows | IDs in `skills/goshipit/references/checks-*.md` (in order) | `skills/goshipit/assets/template.md` rows (`- [x] <ID> · <short title>`, same order, per section) |
| Check count | Sum of reference rows | `skills/goshipit/assets/template.md` section `(N)` counts + `# goshipit checks (210)` header · README.md headline + table + config snippet · package.json `description` · SKILL.md header line + frontmatter `Runs NNN checks` + Categories table |
| Version | `metadata.version` in SKILL.md frontmatter | `package.json` `version` field |
| Category list | Categories A–O | README.md `## What it checks` table (counts + coverage text) · SKILL.md Categories table |
| Features | Steps/behavior in SKILL.md (Steps 0–8) | README.md `## How it works` + `## Configure with goshipit.md` |

Layout follows the Agent Skills spec (agentskills.io): `skills/goshipit/{SKILL.md,scripts/,assets/,references/}`. Frontmatter top-level keys only `name, description, license, compatibility, metadata, allowed-tools` (verify enforces). `bin/install.js` copies the whole folder into each tool's skills dir - no per-tool adapters.

### Verify
```bash
node skills/goshipit/scripts/config.js verify
```
Checks template ids == reference ids per section (in order), section counts, `(210)` header, `<total> checks` in SKILL.md / README.md / package.json, and package.json version == SKILL.md version. Exit 1 on any mismatch - fix and re-run until clean.

Fallback (no Node):
```bash
grep -c "^| [A-Z][0-9]" skills/goshipit/references/checks-*.md
```
Sum the per-file counts. Checks live in reference files, NOT in SKILL.md.

### Per-category counts (current baseline — update when reference files change)
| Cat | File | Checks |
|-----|------|--------|
| A | checks-a-secrets.md | 9 |
| B | checks-b-quality.md | 18 |
| C | checks-c-security.md | 35 |
| D | checks-d-tests.md | 4 |
| E | checks-e-build.md | 15 |
| F | checks-f-reliability.md | 21 |
| G | checks-g-hygiene.md | 14 |
| H | checks-h-accessibility.md | 9 |
| I | checks-i-deploy.md | 15 |
| J | checks-j-seo.md | 14 |
| K | checks-k-pwa.md | 5 |
| L | checks-l-ecommerce.md | 13 |
| M | checks-m-billing.md | 9 |
| N | checks-n-legal.md | 7 |
| O | checks-o-agent.md | 22 |
| **Total** | | **210** |

### Sync checklist (run after every reference, template, or SKILL.md edit)
- [ ] `node skills/goshipit/scripts/config.js verify` passes
- [ ] `template.md`: new/removed rows mirrored, section `(N)`, `(NNN)` header
- [ ] `SKILL.md` header line `NNN checks` + frontmatter `Runs NNN checks` + Categories table counts
- [ ] `README.md` headline, category table counts, config snippet `(NNN)`
- [ ] `README.md` How it works / Configure sections reflect current behavior
- [ ] `package.json` description count + version matches SKILL.md

## Git commits
Never add `Co-Authored-By: Claude` or any AI co-author line to commit messages.

## package.json description format
```
Pre-launch codebase audit skill for Claude Code - NNN checks, stack-agnostic, no live URL needed.
```
