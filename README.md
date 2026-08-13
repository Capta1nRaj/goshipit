# prelaunch-check

> Pre-launch codebase audit skill for [Claude Code](https://claude.ai/code)

Runs **97+ checks** across 12 categories before you go live. Stack-aware, severity-weighted scoring, two report outputs, and auto-fix suggestions.

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
| I | Deploy Config | Docker, Vercel, Render/Fly, Nginx, PM2, custom domain |
| J | SEO & Meta | Favicon, robots.txt, sitemap, OG tags, canonical, JSON-LD, analytics |
| K | PWA & Service Worker | Manifest, install prompt, offline fallback (auto-detected) |
| L | Legal & Compliance | Privacy policy, terms, cookie consent, refund policy |

## Scoring

- **P0** (critical): -10 pts each
- **P1** (high): -3 pts each
- **P2** (medium): -1 pt each
- Score floor: 0 / out of 100

## Usage

In Claude Code, just say:

```
prelaunch check
```

or any of:

```
check my codebase
is the code ready
ready to deploy
pre-prod check
code ready for prod
launch audit
deploy readiness
```

## Output

- `prelaunch-report.md` — dev report with check IDs, severity, code refs, and fix steps
- `prelaunch-client-report.md` — plain-English PM/client version

## Key features

- **Fully dynamic stack detection** — reads your project files, infers framework/runtime/DB/tooling. No hardcoded lists.
- **Interactive category picker** — choose which checks to run via Claude's UI
- **Auto-fix** — offers safe, no-logic-change fixes with diff preview before applying
- **No live URL needed** — codebase-only audit

## Install via mcpmarket

Search `prelaunch-check` on [mcpmarket.com](https://mcpmarket.com) or install directly from the [skill page](https://app.mcpmarket.com/priyalraj/skills/prelaunch-check).

## License

Apache-2.0
