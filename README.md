# goshipit

[![npm version](https://img.shields.io/npm/v/goshipit)](https://www.npmjs.com/package/goshipit)
[![npm downloads](https://img.shields.io/npm/dm/goshipit)](https://www.npmjs.com/package/goshipit)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Node.js](https://img.shields.io/node/v/goshipit)](https://nodejs.org)

**Pre-launch codebase audit for [Claude Code](https://claude.ai/code).** 196 checks across 14 categories — secrets, security, tests, SEO, billing, legal, and more. No live URL needed.

```bash
npx goshipit
```

Then in Claude Code:

```
/goshipit
```

or just say: `is my app ready?` · `can I deploy now?` · `prelaunch check`

---

## What it checks

| #   | Category               | Checks | Coverage                                                                                                                                      |
| --- | ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Secrets & Environment  | 9      | Hardcoded secrets, `.env` in git, multi-env drift, webhook URLs, test-mode payment keys                                                       |
| B   | Code Quality           | 18     | Debug logs, TODOs, dead code, complexity, memory leaks, unhandled promises, hallucinated packages, TS strict mode, env var access             |
| C   | Security               | 35     | SQLi, XSS, CORS, CSP, HSTS, rate limiting, CSRF, CVEs, BOLA/IDOR, mass assignment, SSRF, path traversal, eval injection, upload MIME          |
| D   | Tests                  | 4      | Test suite pass/fail, coverage gaps, skipped tests, missing E2E                                                                               |
| E   | Build & Performance    | 15     | Build errors, TypeScript errors, bundle size, N+1 queries, image optimization, compression, cache headers, SSR hydration                      |
| F   | Reliability            | 21     | Runtime pinning, error boundaries, monitoring, DB migrations, connection pooling, backups, email delivery, lockfile conflicts, listener leaks |
| G   | Hygiene                | 14     | Merge conflicts, large files, `.gitignore`, README gaps, linter errors, placeholder text, mobile responsiveness, CI config secrets            |
| H   | Accessibility          | 9      | Alt text, ARIA roles, form labels, contrast, focus-visible, keyboard traps, touch targets (WCAG 2.2 AA)                                       |
| I   | Deploy Config          | 11     | Docker multi-stage + non-root, Vercel, Render/Fly, Nginx, PM2, custom domain, Kubernetes resource limits and probes                           |
| J   | SEO & Meta             | 14     | Favicon, robots.txt, sitemap, OG tags, canonical URLs, JSON-LD, analytics, Google Consent Mode v2, llms.txt                                   |
| K   | PWA & Service Worker   | 5      | Manifest, SW registration, offline fallback, cache busting _(auto-detected)_                                                                  |
| L   | E-commerce Tracking    | 13     | GA4 + Meta Pixel events, purchase deduplication, server-side CAPI fallback _(auto-detected)_                                                  |
| M   | Billing & Subscription | 9      | Webhook events, signature verification, idempotency, dunning, plan enforcement _(auto-detected)_                                              |
| N   | Legal & Compliance     | 7      | Privacy policy, terms, cookie consent, refund policy, GDPR data export/deletion                                                               |

Runs all 14 categories in parallel. Stack-aware — detects your framework, runtime, DB, and tooling dynamically. Categories K, L, M only trigger when relevant files are found.

---

## Scoring

Score starts at 100 and deducts per violation. Can go negative.

| Severity      | Deduction |
| ------------- | --------- |
| P0 — critical | −10       |
| P1 — high     | −3        |
| P2 — medium   | −1        |

| Score  | Result                 |
| ------ | ---------------------- |
| 90–100 | 🟢 Ship it             |
| 75–89  | 🟡 Minor fixes needed  |
| 50–74  | 🟠 Several gaps        |
| 1–49   | 🔴 Not ready           |
| ≤ 0    | 🚨 Critical violations |

Outputs `prelaunch-report.md` with every finding, file references, and fix steps. Safe auto-fixes (headers, config flags, `.gitignore` entries) are offered with diff preview before applying.

---

## Requirements

- [Claude Code](https://claude.ai/code)
- Node.js ≥ 18

---

## Contributing

Open an [issue](https://github.com/Capta1nRaj/goshipit/issues) or PR. To add a check: pick the right file in `goshipit/references/`, add a table row, and update the count in `SKILL.md`, `README.md`, and `package.json`. Tag [@Capta1nCodes](https://x.com/Capta1nCodes) on X with feedback.

---

## License

[Apache-2.0](LICENSE) © [Capta1nRaj](https://github.com/Capta1nRaj)
