# goshipit

[![npm version](https://img.shields.io/npm/v/goshipit)](https://www.npmjs.com/package/goshipit)
[![npm downloads](https://img.shields.io/npm/dm/goshipit)](https://www.npmjs.com/package/goshipit)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Node.js](https://img.shields.io/node/v/goshipit)](https://nodejs.org)

**Pre-launch codebase audit for AI coding tools.**  
188 checks · 14 categories · 9 platforms · no live URL needed.

Say `goshipit` — your AI tool runs a full secrets, security, quality, performance, accessibility, SEO, billing, and legal audit. Severity-weighted score out of 100. Saves `prelaunch-report.md` with every finding, file reference, and fix step.

```bash
npx goshipit
```

> [!CAUTION]
> **Token hungry.** goshipit runs 188 checks and writes a full dev report. Use the category picker to stay lean — or feed the beast and ship.

---

## Supported AI tools

| Tool | Install location | Trigger |
|------|-----------------|---------|
| [Claude Code](https://claude.ai/code) | `~/.claude/skills/goshipit/` | `/goshipit` or say it |
| [Cursor](https://cursor.com) | `~/.cursor/rules/goshipit.mdc` | say it in Agent |
| [Windsurf](https://windsurf.com) | `~/.codeium/windsurf/memories/goshipit.md` | say it in Cascade |
| [OpenAI Codex CLI](https://github.com/openai/codex) | `~/.codex/goshipit.md` | say it |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `~/.gemini/GEMINI.md` (appended) | say it |
| [Zed](https://zed.dev) | `~/.config/zed/prompts/goshipit.md` | say it in Agent |
| [Cline](https://github.com/cline/cline) | VS Code `settings.json` (`cline.customInstructions`) | say it |
| [GitHub Copilot](https://github.com/features/copilot) | VS Code `settings.json` (`github.copilot.chat.codeGeneration.instructions`) | say it |
| [Continue.dev](https://continue.dev) | `~/.continue/prompts/goshipit.prompt` | `/goshipit` |

The installer auto-detects which tools you have and installs to all of them at once.

---

## Install

```bash
npx goshipit
```

Interactive picker — select which AI tools to install. Installs shared check references to `~/.goshipit/references/` (read by all platforms).

```bash
npx goshipit -y          # skip picker, install all detected tools
```

---

## Commands

```bash
npx goshipit                # install (interactive picker)
npx goshipit --uninstall    # remove (interactive picker)
npx goshipit --status       # show detected + installed status with paths
npx goshipit --version      # local version + npm latest check
npx goshipit --dry-run      # preview what would install/remove, touch nothing
npx goshipit -y             # skip picker (CI / scripting)
npx goshipit@latest         # update to latest version
```

---

## How it works

Once installed, say any trigger phrase in your AI tool:

> `goshipit` · `is my app ready?` · `can I deploy now?` · `prelaunch check` · `review before launch` · `production readiness check` · `should I merge to main?`

The AI runs a structured audit in up to 11 steps:

| Step | What happens |
|------|-------------|
| 1 | **Stack detection** — reads project files, infers framework, runtime, DB, auth, deploy target, monorepo tool. No hardcoded lists. |
| 1.5 | **Stack intelligence** — resolves framework-specific security patterns via context7 MCP, web search, or built-in knowledge. Builds a Stack Profile used by all checks. |
| 2 | **Category picker** — choose which of the 14 categories to audit. Accessibility, fix mode, and DESIGN.md generation are asked separately. |
| 3 | **Parallel checks** — one sub-agent per category runs simultaneously (Claude Code). Other platforms run sequentially. |
| 4 | **Custom checks** — any free-form check typed in the picker is also run. |
| 5 | **Score** — severity-weighted from 100. Can go negative. Score block printed inline. |
| 6 | **Report** — `prelaunch-report.md` saved with every finding grouped by severity, file:line evidence, and fix steps. |
| 7 | **Issue triage** — pick which issues to fix right now, directly from the report. |
| 8 | **Auto-fix** — safe, reversible fixes applied with diff preview and confirmation. Unsafe fixes (SQLi, auth, N+1) explained with code snippets instead. |
| 9 | **Package update check** — detects outdated deps, flags major-version breaks separately. |
| 10 | **Build verification** (optional) — runs your production build command, flags compile errors as P0. |
| 11 | **DESIGN.md generation** (optional) — inspects your design tokens and writes a Google DESIGN.md spec file. |

> Steps 9 and 10 always run. Steps 11 runs only if no `DESIGN.md` exists and user opts in. On **Claude Code**, categories run in parallel via sub-agents — full audit in minutes, not hours.

---

## What it checks

| # | Category | Checks | Coverage |
|---|----------|--------|----------|
| A | Secrets & Environment | 9 | Hardcoded secrets, `.env` in git, multi-env drift, webhook URLs, test-mode payment keys |
| B | Code Quality | 18 | Debug logs, TODOs, dead code, complexity, memory leaks, unhandled promises, hallucinated packages, TS strict mode |
| C | Security | 35 | SQLi, XSS, CORS, CSP, HSTS, rate limiting, CSRF, CVEs, BOLA/IDOR, mass assignment, SSRF, path traversal, eval injection, upload MIME |
| D | Tests | 4 | Test suite pass/fail, coverage gaps, skipped tests, missing E2E |
| E | Build & Performance | 15 | Build errors, TypeScript errors, bundle size, N+1 queries, image optimization, compression, cache headers, SSR hydration |
| F | Reliability | 21 | Runtime pinning, error boundaries, monitoring, DB migrations, connection pooling, backups, email delivery, lockfile conflicts, listener leaks |
| G | Hygiene | 14 | Merge conflicts, large files, `.gitignore`, README gaps, linter errors, placeholder text, mobile responsiveness, CI config secrets |
| H | Accessibility | 9 | Alt text, ARIA roles, form labels, contrast, focus-visible, keyboard traps, touch targets (WCAG 2.2 AA) |
| I | Deploy Config | 15 | Docker multi-stage + non-root, Vercel, Render/Fly, Nginx, PM2, custom domain, Kubernetes resource limits and probes |
| J | SEO & Meta | 14 | Favicon, robots.txt, sitemap, OG tags, canonical URLs, JSON-LD, analytics, Google Consent Mode v2, llms.txt |
| K | PWA & Service Worker | 5 | Manifest, SW registration, offline fallback, cache busting _(auto-detected)_ |
| L | E-commerce Tracking | 13 | GA4 + Meta Pixel events, purchase deduplication, server-side CAPI fallback _(auto-detected)_ |
| M | Billing & Subscription | 9 | Webhook events, signature verification, idempotency, dunning, plan enforcement _(auto-detected)_ |
| N | Legal & Compliance | 7 | Privacy policy, terms, cookie consent, refund policy, GDPR data export/deletion |

Categories K, L, M only trigger when relevant files are found. All others always run.

---

## Scoring

Score starts at 100 and deducts per violation. Can go negative.

| Severity | Deduction |
|----------|-----------|
| P0 — critical | −10 |
| P1 — high | −3 |
| P2 — medium | −1 |

| Score | Result |
|-------|--------|
| 90–100 | 🟢 Ready to launch |
| 75–89 | 🟡 Launch with P1 fixes queued |
| 50–74 | 🟠 Fix P1s before launch |
| 1–49 | 🔴 Not ready |
| 0 | 🚨 DO NOT LAUNCH |
| < 0 | ☠️ Severely broken |

The score block is printed inline with a filled progress bar. Output example:

```
┌─────────────────────────────────────────────────┐
│  🚀 GOSHIPIT PRELAUNCH SCORE                    │
│                                                 │
│   74 / 100                              🟡      │
│   ████████████████████░░░░░░░░░  74%            │
│                                                 │
│   ❌  P0 Blockers    1    −10 pts               │
│   ⚠️   P1 Warnings   4    −12 pts               │
│   📝  P2 Notes       4     −4 pts               │
│   ✅  Passed        34                          │
│   ⏭️   Skipped        3   (stack N/A)           │
│                                                 │
│   VERDICT: NOT READY - fix 1 P0 blocker first  │
└─────────────────────────────────────────────────┘
```

`prelaunch-report.md` is saved to project root with every finding, file references, and fix steps — grouped by severity, ready to paste into a PR description or ticket.

---

## Auto-fix

After the audit, the issue triage step lets you pick which findings to address immediately. For safe, reversible issues goshipit applies the fix with a diff preview and confirmation. For issues that require human judgment it shows exactly what to change and where — with a code snippet — without touching the file.

**Auto-fixable:** `.env` in git, missing `alt` attributes, `console.log` in prod paths, missing TS `strict`, render-blocking scripts, `.gitignore` gaps, missing viewport meta, missing `lang` on `<html>`.

**Never auto-touched:** SQL injection, auth middleware, N+1 queries, CORS config, CVEs, bundle size — anything where the correct value requires judgment.

---

## Requirements

- Node.js ≥ 18
- At least one supported AI tool (see table above)

---

## Contributing

Open an [issue](https://github.com/Capta1nRaj/goshipit/issues) or PR.

To add a check: pick the right file in `goshipit/references/`, add a table row following the existing format, then re-run the count sync:

```bash
grep -c "^| [A-Z][0-9]" goshipit/references/checks-*.md
```

Update the total in `SKILL.md`, `README.md`, and `package.json`. The CLAUDE.md in this repo enforces this automatically.

Tag [@Capta1nCodes](https://x.com/Capta1nCodes) on X with feedback or bug reports.

---

## License

[Apache-2.0](LICENSE) © [Capta1nRaj](https://github.com/Capta1nRaj)
