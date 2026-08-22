# goshipit - Project Instructions

## Sync Rule (enforce after every change)

Source of truth: `goshipit/SKILL.md`

After any edit to `goshipit/SKILL.md`, auto-sync these fields without being asked:

| Field | Source | Targets |
|---|---|---|
| Check count | Sum `^| [A-Z][0-9]` rows across all `goshipit/references/checks-*.md` files | README.md headline + table intro + package.json `description` + SKILL.md header line |
| Version | `version:` in SKILL.md frontmatter | `package.json` `version` field |
| Category list | Categories A–O in SKILL.md | README.md `## What it checks` table (counts + coverage text) |
| Features | Steps/behavior in SKILL.md | README.md `## Key features` list |

### How to count checks
```bash
grep -c "^| [A-Z][0-9]" goshipit/references/checks-*.md
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

### Sync checklist (run after every reference file OR SKILL.md edit)
- [ ] Re-run grep count above; if total changed, update all four targets below
- [ ] `SKILL.md` header line: `NNN checks` matches total
- [ ] `SKILL.md` frontmatter description: `Runs NNN checks`
- [ ] `README.md` headline: `NNN checks` matches total
- [ ] `README.md` table: per-category counts match per-file grep counts
- [ ] `README.md` features: reflect current behavior
- [ ] `package.json` description: check count matches
- [ ] `package.json` version: matches SKILL.md frontmatter version

## Git commits
Never add `Co-Authored-By: Claude` or any AI co-author line to commit messages.

## package.json description format
```
Pre-launch codebase audit skill for Claude Code - NNN checks, stack-agnostic, no live URL needed.
```
