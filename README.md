# goshipit

> Pre-launch codebase audit skill for [Claude Code](https://claude.ai/code)

Runs **185 checks** across 14 categories before you go live. Stack-aware, severity-weighted scoring, interactive triage, and auto-fix suggestions.

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

| # | Category | Checks | Areas covered |
|---|----------|--------|---------------|
| A | Secrets & Environment | 9 | Hardcoded secrets, .env in git, multi-env drift, webhook URLs, test-mode payments |
| B | Code Quality | 16 | Debug logs, TODOs, dead code, complexity, memory leaks, unhandled promises, hallucinated packages |
| C | Security | 31 | SQLi, XSS, CORS, CSP, HSTS, rate limiting, CSRF, CVEs, BOLA/IDOR, mass assignment, edge runtime awareness |
| D | Tests | 4 | Test suite, coverage, skipped tests, E2E |
| E | Build & Performance | 15 | Build errors, TypeScript, bundle size, N+1 queries, images, compression, cache headers, hydration |
| F | Reliability | 19 | Runtime pinning, error boundaries, error monitoring, DB migrations, pooling, backups, email delivery |
| G | Hygiene | 13 | Merge conflicts, large files, .gitignore, README, linter, placeholder text, mobile responsiveness |
| H | Accessibility | 9 | Alt text, ARIA, form labels, contrast, focus visible, keyboard traps, touch targets (WCAG 2.2 AA) |
| I | Deploy Config | 9 | Docker (multi-stage, non-root), Vercel, Render/Fly, Nginx, PM2, custom domain |
| J | SEO & Meta | 14 | Favicon, robots.txt, sitemap, OG tags, canonical, JSON-LD, analytics, Google Consent Mode v2, llms.txt |
| K | PWA & Service Worker | 5 | Manifest, SW registration, offline fallback, cache busting *(auto-detected)* |
| L | E-commerce Tracking | 13 | GA4 + Meta Pixel events, purchase dedup, CAPI fallback *(auto-detected)* |
| M | Billing & Subscription | 9 | Webhook events, signature verification, idempotency, dunning, plan limits *(auto-detected)* |
| N | Legal & Compliance | 7 | Privacy policy, terms, cookie consent, refund policy, GDPR data export/deletion |

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
