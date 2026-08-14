# goshipit - Project Instructions

## Sync Rule (enforce after every change)

Source of truth: `goshipit/SKILL.md`

After any edit to `goshipit/SKILL.md`, auto-sync these fields without being asked:

| Field | Source | Targets |
|---|---|---|
| Check count | Count lines matching `^  - [A-Z][0-9]+:` in SKILL.md | README.md headline + table intro + package.json `description` |
| Version | `version:` in SKILL.md frontmatter | `package.json` `version` field |
| Category list | Categories A–N in SKILL.md | README.md `## What it checks` table (counts + coverage text) |
| Features | Steps/behavior in SKILL.md | README.md `## Key features` list |

### How to count checks
```bash
grep -c "^  - [A-Z][0-9]\+:" goshipit/SKILL.md
```

### Sync checklist (run mentally after every SKILL.md edit)
- [ ] `README.md` headline: `**NNN checks**` matches grep count
- [ ] `README.md` table: per-category counts match SKILL.md
- [ ] `README.md` features: reflect current behavior
- [ ] `package.json` description: check count matches
- [ ] `package.json` version: matches SKILL.md frontmatter version

## Git commits
Never add `Co-Authored-By: Claude` or any AI co-author line to commit messages.

## package.json description format
```
Pre-launch codebase audit skill for Claude Code - NNN checks, stack-agnostic, no live URL needed.
```
