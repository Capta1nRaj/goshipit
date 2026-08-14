# goshipit

> Pre-launch codebase audit skill for [Claude Code](https://claude.ai/code)

Runs **170+ checks** across 14 categories before you go live. Stack-aware, severity-weighted scoring, two report outputs, and auto-fix suggestions.

## Install

```bash
npx goshipit
```

Updates automatically — always pulls the latest SKILL.md:

```bash
npx goshipit@latest
```

Installs to `~/.claude/skills/goshipit/SKILL.md`.

## Usage

In Claude Code, say any of:

```
goshipit
prelaunch check
check my codebase
is the code ready
ready to deploy
pre-prod check
code ready for prod
launch audit
deploy readiness
```

## What it checks

| # | Category | Checks |
|---|----------|--------|
| A | Secrets & Environment | Hardcoded secrets, .env in git, multi-env drift, test-mode payments |
| B | Code Quality | Debug logs, TODOs, dead code, complexity, memory leaks |
| C | Security | SQLi, XSS, CORS, CSP, HSTS, rate limiting, CSRF, CVEs |
| D | Tests | Test suite, coverage, skipped tests, E2E |
| E | Build & Performance | Build errors, TypeScript, bundle size, images, compression, cache headers |
| F | Reliability | Runtime pinning, error boundaries, logging, DB migrations, DB pooling, backups |
| G | Hygiene | Merge conflicts, large files, .gitignore, README, linter, placeholder text |
| H | Accessibility | Alt text, ARIA, form labels, contrast, page title |
| I | Deploy Config | Docker (multi-stage, non-root), Vercel, Render/Fly, Nginx, PM2, custom domain |
| J | SEO & Meta | Favicon, robots.txt, sitemap, OG tags, canonical, JSON-LD, analytics |
| K | PWA & Service Worker | Manifest, install prompt, offline fallback (auto-detected) |
| L | E-commerce | Cart, checkout, inventory, payment flow (auto-detected) |
| M | Billing | Stripe/webhook events, subscription lifecycle (auto-detected) |
| N | Legal & Compliance | Privacy policy, terms, cookie consent, refund policy |

## Scoring

- **P0** (critical): -10 pts each
- **P1** (high): -3 pts each
- **P2** (medium): -1 pt each
- No floor — score can go negative on severe violations

| Score | Grade |
|---|---|
| 90–100 | 🟢 Ship it |
| 75–89 | 🟡 Minor fixes |
| 50–74 | 🟠 Several gaps |
| 1–49 | 🔴 Not ready |
| 0 | 🚨 Stop |
| < 0 | ☠️ Critical violations |

## Output

- `prelaunch-report.md` — dev report with check IDs, severity, code refs, and fix steps
- `prelaunch-report-client.md` — plain-English PM/client version

## Key features

- **Fully dynamic stack detection** — reads your project files, infers framework/runtime/DB/tooling. No hardcoded lists.
- **Parallel sub-agents** — each audit category runs simultaneously for fast results
- **Stack Intelligence Resolution** — MCP-first → WebSearch → built-in knowledge, builds a Stack Profile before running checks
- **DESIGN.md generation** — generates a Google/Stitch-spec design system file from your codebase tokens
- **Interactive category picker** — choose which checks to run
- **Auto-fix** — safe, no-logic-change fixes with diff preview before applying
- **No live URL needed** — codebase-only audit

## Contributing

Found a bug or want a new check? Two ways to help:

- **GitHub Issues** — [open an issue](https://github.com/Capta1nRaj/goshipit/issues) for feature requests or bug reports
- **X / Twitter** — tag [@Capta1nCodes](https://x.com/Capta1nCodes) with suggestions or feedback

## License

Apache-2.0
