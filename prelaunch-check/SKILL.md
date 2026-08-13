---
name: prelaunch-check
description: >
  Pre-launch codebase audit skill. Use when a developer is preparing to deploy
  to production and wants a comprehensive readiness check. Runs 97+ checks
  across secrets, security, code quality, tests, build/performance, reliability,
  accessibility, deploy config, SEO, PWA, and legal compliance. Dynamically
  detects the stack — no hardcoded framework lists. Saves two reports:
  prelaunch-report.md (for devs, with check IDs and code refs) and
  prelaunch-report-client.md (plain English for PM/client). Severity-weighted
  score out of 100. No live URL needed — codebase only.
  Do NOT use for post-launch monitoring, live site audits, or SEO rank tracking.
license: Apache-2.0
user-invocable: true
effort: high
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - AskUserQuestion
tags:
  - prelaunch
  - security
  - audit
  - deploy
  - performance
  - seo
  - qa
  - accessibility
  - code-quality
  - production-readiness
  - secrets
  - codebase
  - static-analysis
  - compliance
  - legal
  - pwa
  - reliability
  - hygiene
  - devops
  - pre-prod
metadata:
  author: priyalraj
  version: 1.0.1
  platforms:
    - claude-code
  triggers:
    - prelaunch check
    - check my codebase
    - is the code ready for prod
    - ready to deploy
    - pre-prod check
    - launch audit
    - deploy readiness
    - audit before launch
    - check before going live
    - production readiness check
    - is my app ready to launch
    - code review before launch
    - check code before deploy
---

# prelaunch-check

Pre-launch codebase audit. Stack-aware, severity-weighted, saves two reports. No live URL needed.

## Step 1 — Stack Detection (auto, fully dynamic)

Do NOT hardcode a fixed list of stacks. Instead, read the project files and infer everything:

1. List all files in root and one level deep
2. Read `package.json` (if exists) — check `dependencies`, `devDependencies`, `scripts`
3. Read `pyproject.toml` / `requirements.txt` / `Pipfile` (if exists)
4. Check for any config files: `*.config.*`, `*.toml`, `*.yaml`, `*.yml`, `Makefile`, `Dockerfile*`, `*.mod`
5. From what you find, infer: framework, language, runtime, DB, auth lib, build tool, deploy target, monorepo tool, process manager, reverse proxy

**Examples of what to infer (not a fixed list — use judgement):**
- `turbo.json` or `nx.json` → monorepo, run checks per workspace
- `bun.lockb` → Bun runtime
- `pnpm-workspace.yaml` → pnpm monorepo
- `nginx.conf` or `sites-available/` → Nginx present
- `ecosystem.config.*` → PM2
- `supervisord.conf` → Supervisor
- `fly.toml`, `render.yaml`, `railway.json`, `vercel.json`, `netlify.toml` → deploy target
- Any framework not listed above → detect from deps/config and apply common-sense checks

**Guards — check these before proceeding:**
- If no recognizable project files found (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Makefile`, `Dockerfile`, `*.config.*`) → tell user "No codebase detected in this directory. Run `/prelaunch-check` from your project root." and stop.
- If no git repo (`.git` dir absent or `git log` returns nothing) → skip A2, A6, A7 silently, mark each `⏭️ No git history` in report. Continue with all other checks.

Report everything detected before showing the picker. All infra/config checks are **conditional** — only run if that tool/file is actually found. Never flag something as missing just because it's not present.

---

## Step 2 — Category Picker (AskUserQuestion)

Use the `AskUserQuestion` tool with these exact questions. Do NOT show a text menu — use the tool so the user gets proper checkboxes in the UI.

**Question 1** — `multiSelect: true`
- header: `Audit Areas`
- question: `Which areas do you want to audit?`
- options:
  - label: `Secrets & Security` — description: `Hardcoded keys, .env in git, input validation, rate limiting, CVE scan, CORS, cookies, CSP, HSTS, X-Frame-Options, security headers`
  - label: `Code Quality & Tests` — description: `Debug logs, TODOs, dead code, unused deps, test suite, coverage, E2E`
  - label: `Build & Performance` — description: `Bundle size, TypeErrors, N+1 queries, render-blocking scripts, image optimisation, cache headers, compression, service worker`
  - label: `Reliability, Hygiene & Deploy` — description: `Error boundaries, logging, migrations, .gitignore, README, Nginx, Docker, Vercel config, favicon, sitemap, robots.txt, SEO meta, legal pages, placeholder text, custom error pages, email setup`

**Question 2** — `multiSelect: false`
- header: `Accessibility`
- question: `Include accessibility checks? (alt text, ARIA, label associations in JSX/HTML files)`
- options:
  - label: `Yes, include` — description: `Scans .tsx .jsx .vue .html for missing alt, ARIA roles, form labels`
  - label: `Skip` — description: `Skip accessibility checks this run`

**Question 3** — `multiSelect: false`
- header: `Fix Mode`
- question: `How should issues be handled?`
- options:
  - label: `Audit only` — description: `Find issues, save report, nothing touched — you fix manually`
  - label: `Audit + auto-fix` — description: `After report, offer to apply safe fixes with diff preview before touching anything`

Map answers:
- Q1 `Secrets & Security` → run categories 1 (Secrets) + 3 (Security)
- Q1 `Code Quality & Tests` → run categories 2 (Code Quality) + 4 (Tests)
- Q1 `Build & Performance` → run category 5
- Q1 `Reliability, Hygiene & Deploy` → run categories 6 + 7 + 9 + 10 + 12
- Q1 all 4 selected → run everything (categories 1–7 + 9–12)
- Category 11 (PWA) runs automatically whenever `manifest.json`, `sw.js`, `next-pwa`, or workbox config is detected — regardless of picker selection
- Q2 `Yes` → also run category 8 (Accessibility)
- Q3 `Audit + auto-fix` → run Step 8 (--fix flow) after report
- User selects `Other` on any question → treat their typed text as a custom check to run

---

## Step 3 — Run Checks

Run selected categories. Skip checks marked *(stack-specific)* if stack not detected.

### 1 — Secrets & Environment

| ID | Check | P-level |
|---|---|---|
| A1 | Grep source for `sk_live`, `AIza`, `AKIA`, `ghp_`, `Bearer `, `password =`, `secret =`, `api_key =` (exclude `node_modules`, `.git`, tests) | P0 |
| A2 | `git ls-files .env .env.local .env.production` — flag if tracked | P0 |
| A3 | `.env.example` exists and has entry for every var in `.env` | P1 |
| A4 | Grep configs for `localhost`, `staging.`, `sandbox.`, `test.stripe.com` outside test files | P1 |
| A5 | README / `.env.example` explains each var | P2 |
| A6 | `git log --all -p --since=1.year.ago` grep for secret patterns — flag even if removed (key is compromised). Limit to 1 year to avoid hanging on large repos | P0 |
| A7 | **Multi-env drift** — diff vars in `.env.staging` vs `.env.production`. Flag vars present in one but not the other | P1 |
| A8 | **Webhook URLs pointing to localhost/ngrok** — grep all config, env files, and source for `localhost`, `127.0.0.1`, `ngrok.io`, `ngrok-free.app` in webhook/callback URL context | P0 |
| A9 | **Payment test mode in prod** — explicit check for `sk_test_`, `pk_test_`, `rk_test_`, `sandbox` prefixed payment keys in env/config. Flag if any test-mode key present | P0 |

### 2 — Code Quality

| ID | Check | P-level |
|---|---|---|
| B1 | Debug statements in prod paths (`console.log`, `debugger`, `print(`, `pdb.set_trace`) — flag in auth/payment/API routes | P1 |
| B2 | `TODO`, `FIXME`, `HACK` in auth, payment, form handlers, API routes | P1 |
| B3 | 3+ consecutive commented lines in prod files | P2 |
| B4 | Exported functions/components with zero imports across codebase | P2 |
| B5 | Packages in `package.json`/`requirements.txt` never imported in source | P2 |
| B6 | `test@example.com`, `admin@admin`, `123456`, hardcoded user IDs, seed imports outside migrations | P1 |
| B7 | **Cyclomatic complexity** — flag functions/files with complexity >15. Use file size + nesting depth as proxy if no tool available | P1 |
| B8 | **Duplicate code blocks** — flag copy-pasted blocks >10 lines that appear 2+ times | P2 |
| B9 | **CHANGELOG.md** exists and version in `package.json`/`pyproject.toml` is bumped from last git tag | P2 |
| B10 | **Memory leak patterns** — `useEffect`/`onMounted` missing cleanup return, `addEventListener` without matching `removeEventListener`, `setInterval`/`setTimeout` without clear on unmount in component files | P1 |

### 3 — Security

| ID | Check | P-level |
|---|---|---|
| C1 | User input passed directly to DB query (SQLi) or rendered as raw HTML (`dangerouslySetInnerHTML`, `innerHTML`, `v-html`) | P0 |
| C2 | `/login`, `/register`, `/forgot-password`, contact form API missing rate limiting middleware | P0 |
| C3 | API routes returning full `err.stack` to client | P0 |
| C4 | Protected pages/endpoints missing auth middleware | P0 |
| C5 | `npm audit` / `pip-audit` — flag high/critical CVEs with package name + CVE ID | P1 |
| C6 | Lock file (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) not committed | P1 |
| C7 | CORS wildcard `*` in prod API config | P1 |
| C8 | Webhook endpoints missing signature verification | P1 |
| C9 | Session/cookie config missing `httpOnly`, `secure`, `sameSite` | P1 |
| C10 | GPL/AGPL licensed packages in commercial codebase | P1 |
| C11 | `Content-Security-Policy` header set in middleware/nginx/config. Flag if missing. Flag if `default-src *` (too permissive). Check `object-src 'none'` and `upgrade-insecure-requests` present | P1 |
| C12 | `X-Frame-Options: DENY` or `SAMEORIGIN` set (or `frame-ancestors` in CSP) | P1 |
| C13 | `X-Content-Type-Options: nosniff` set | P1 |
| C14 | `Referrer-Policy` set — flag if `unsafe-url` or missing | P1 |
| C15 | `Permissions-Policy` header configured — camera, microphone, geolocation scoped to `(self)` or `()` | P2 |
| C16 | `Strict-Transport-Security` set with `max-age` ≥ 31536000, `includeSubDomains` | P1 |
| C17 | **CSRF protection** — state-changing endpoints (POST/PUT/DELETE/PATCH) use CSRF token middleware (`csurf`, `csrf-csrf`, Django CSRF, Rails `protect_from_forgery`), OR cookies are `SameSite=Strict/Lax` as mitigation. Flag if neither present | P1 |
| C18 | **Server-side input validation** — validation lib present (Zod, Joi, Yup, Pydantic, class-validator, Valibot). Flag if only client-side validation exists — client validation is trivially bypassed | P1 |

### 4 — Tests

| ID | Check | P-level |
|---|---|---|
| D1 | Run `npm test` / `pytest` / `go test ./...` — report X passed / Y failed | P0 (if fail) |
| D2 | Test files cover: auth flow, form submission, payment (if applicable), API error states | P1 |
| D3 | `it.skip`, `xit`, `pytest.mark.skip` in critical path tests | P1 |
| D4 | No Playwright/Cypress/Puppeteer for user-facing app (only unit tests) | P1 |

### 5 — Build & Performance

| ID | Check | P-level |
|---|---|---|
| E1 | Run the detected build command (`npm run build`, `go build`, `python -m py_compile <entrypoint>`, etc.) — flag errors + deprecation warnings | P0 |
| E2 | `tsc --noEmit` — flag type errors. Flag `any` casts in auth/payment paths | P1 |
| E3 | Main JS bundle >300kb gzipped. List top 5 largest deps | P1 |
| E4 | `<img>` tags without `width`/`height`. Check `next/image` / `loading="lazy"` used | P1 |
| E5 | Font imports missing `font-display: swap`. Render-blocking `@import url()` in CSS | P2 |
| E6 | `<script>` in `<head>` without `defer`/`async` | P1 |
| E7 | Upload endpoints missing max file size config | P1 |
| E8 | **N+1 query detection** — grep for DB calls (`.find(`, `.findOne(`, `SELECT`) inside loops (`for`, `forEach`, `.map(`). Flag each occurrence with file + line | P1 |
| E9 | Static assets (images, fonts, CSS, JS) have long-lived `Cache-Control: public, max-age=31536000, immutable` in headers config (Next.js `headers()`, nginx, CDN) | P1 |
| E10 | `robots.txt`, XML sitemaps, HTML responses have short cache / `must-revalidate` — not cached immutably by CDN | P1 |
| E11 | Compression enabled — `compress: true` (Next.js), `compression()` middleware (Express), `gzip on` (Nginx) | P1 |
| E12 | Modern image formats configured — webp/avif via framework (`formats: ["image/avif", "image/webp"]`), CDN, or build tool | P2 |

**Stack-specific build checks (dynamic — infer from Step 1 detection):**
Based on the framework/runtime detected, apply the most relevant framework-specific checks using judgement. Examples of what to look for per category — adapt to whatever stack is present:
- **Frontend frameworks**: check that prod build config doesn't expose sourcemaps, that image/asset handling is configured, and security headers are set
- **Backend frameworks**: check debug mode is off, CORS is configured, framework-specific security middleware is active
- **Compiled languages**: check that vet/lint passes and that tests use race detection if applicable
- **Any stack**: confirm prod config differs from dev config, no dev-only flags active in prod build scripts

### 6 — Reliability

| ID | Check | P-level |
|---|---|---|
| F1 | `.nvmrc` / `engines` in `package.json` / `runtime.txt` / `pyproject.toml` / `go.mod` specifies exact runtime | P1 |
| F2 | Top-level error boundary: `ErrorBoundary`, `+error.svelte`, Django 500 template, Go panic recover | P1 |
| F3 | Sentry / Datadog / equivalent in codebase | P1 |
| F4 | Server uses structured logger (Winston, Pino, `logging`, `slog`) not raw `console.log` | P2 |
| F5 | Unapplied DB migrations or edited applied migrations | P0 |
| F6 | `jest`, `nodemon`, `ts-node` in `dependencies` instead of `devDependencies` | P1 |
| F7 | Server missing `SIGTERM`/`SIGINT` handlers (Go: `signal.Notify`, Python: `signal.signal`) | P1 |
| F8 | No `/health`, `/ping`, or `/status` endpoint | P2 |
| F9 | `build`, `start`, `test` scripts missing from `package.json` / `Makefile` / `pyproject.toml` | P1 |
| F10 | Transactional email lib present (Resend, SendGrid, Postmark, Nodemailer, SES, Mailgun) — if app sends emails (auth, receipts, notifications) | P1 |
| F11 | "From" address configured as branded domain — flag if `@gmail.com`, `@hotmail.com`, or `@yahoo.com` in email config | P1 |
| F12 | **DB connection pooling** — pool config present in DB client (`connection_limit` in Prisma, `pool` in pg/mysql2, `pool_size` in SQLAlchemy). Flag if new connection opened per request | P1 |
| F13 | **DB backup** — automated backup configured: platform backup enabled (Supabase, PlanetScale, RDS), backup script in cron/Makefile, or backup service documented in README | P1 |
| F14 | **Uptime monitoring** — Pingdom, Better Uptime, UptimeRobot, Checkly, or equivalent configured. Check for monitoring service config or reference in deploy docs | P2 |

### 7 — Codebase Hygiene

| ID | Check | P-level |
|---|---|---|
| G1 | `<<<<<<<`, `=======`, `>>>>>>>` in any source file | P0 |
| G2 | Files >1MB outside `node_modules`/`.git` | P1 |
| G3 | `.gitignore` missing: `node_modules`, `dist`, `build`, `.env*`, `*.log`, `.DS_Store`, `__pycache__`, `*.pyc` | P1 |
| G4 | README missing setup / env vars / run locally / deploy steps, or has placeholder text | P2 |
| G5 | ESLint / Ruff / `go vet` errors. No linter configured | P1 |
| G6 | **OpenAPI/Swagger spec** — does `openapi.json`, `swagger.yaml`, or `/docs` route exist? If yes, spot-check 3 routes match actual implementation | P2 |
| G7 | Placeholder/lorem ipsum text — grep for `Lorem ipsum`, `Your Company Name`, `Acme Corp`, `placeholder@email.com`, `Coming soon`, `TODO:` in UI-facing source files (exclude tests, node_modules) | P1 |
| G8 | Custom 404 page exists — `pages/404.tsx`, `app/not-found.tsx`, `404.html`, or framework equivalent | P2 |
| G9 | Custom 500 / error page exists — `pages/500.tsx`, `app/error.tsx`, `500.html`, or framework equivalent | P2 |

### 8 — Accessibility (JSX/HTML in codebase)

| ID | Check | P-level |
|---|---|---|
| H1 | `<img>` tags in `.tsx`/`.jsx`/`.vue`/`.html` missing `alt` attribute | P1 |
| H2 | Interactive elements (`<div onClick`, `<span onClick`) missing `role` and `tabIndex` | P1 |
| H3 | Form `<input>` missing associated `<label>` or `aria-label` | P1 |
| H4 | Color contrast — grep hardcoded hex colors in CSS/Tailwind, flag common low-contrast combos (white on yellow, light grey on white) | P2 |
| H5 | Missing `<title>` in HTML templates / `metadata` in Next.js pages | P1 |
| H6 | `aria-hidden="true"` on focusable elements | P1 |

### 9 — Deploy Config

| ID | Check | P-level |
|---|---|---|
| I1 | **Dockerfile** *(if present)* — no `CMD ["node", "src/index.js"]` pointing to source, uses multi-stage build, runs as non-root user | P1 |
| I2 | **vercel.json** *(if present)* — no hardcoded env vars, `functions` timeout reasonable, no dev routes exposed | P1 |
| I3 | **render.yaml / railway.json / fly.toml** *(if present)* — prod env set, health check path configured, no dev command in prod | P1 |
| I4 | Deploy config file exists at all — flag if no `Dockerfile`, `vercel.json`, `render.yaml`, `fly.toml`, or equivalent found (undocumented deploy = risky) | P2 |
| I5 | No dev-only environment variables (e.g. `DEBUG=true`, `LOG_LEVEL=verbose`) hardcoded in deploy config | P1 |
| I6 | **Nginx** *(only if `nginx.conf` / `sites-available/` found)* — `server_tokens off`, gzip enabled, SSL redirect configured, no `root /var/www/html` pointing to wrong dir, rate limiting on API routes (`limit_req_zone`) | P1 |
| I7 | **Nginx** *(if found)* — `proxy_pass` points to correct upstream (not `localhost:3000` if app runs on different port in prod), `proxy_set_header` includes `X-Real-IP` and `X-Forwarded-For` | P1 |
| I8 | **PM2 / Supervisor** *(if `ecosystem.config.js` or `supervisord.conf` found)* — `instances` set to `max` or explicit number, `autorestart: true`, log paths configured, `NODE_ENV=production` set | P1 |
| I9 | **Custom domain** — deploy config not using free platform subdomain in prod (`.vercel.app`, `.netlify.app`, `.railway.app`, `.fly.dev`, `.onrender.com`). Flag if no custom domain configured | P1 |

### 10 — SEO & Meta

| ID | Check | P-level |
|---|---|---|
| J1 | Favicon — `favicon.ico` or `favicon.svg` in `public/` dir, OR `<link rel="icon">` in HTML `<head>` | P2 |
| J2 | `robots.txt` at root — check `Disallow: /` not accidentally blocking entire site | P0 (if blocking all) / P2 (if missing) |
| J3 | `sitemap.xml` exists at root or referenced via `Sitemap:` line in `robots.txt` | P1 |
| J4 | `<meta name="description">` present on index and key landing pages | P1 |
| J5 | OG tags (`og:title`, `og:description`, `og:image`) present on shareable pages | P2 |
| J6 | `<meta name="robots" content="noindex">` accidentally present on prod pages — would block all search indexing | P0 |
| J7 | `<html lang="...">` attribute set on root HTML element | P1 |
| J8 | `<link rel="canonical">` present on paginated or duplicate-URL pages | P2 |
| J9 | JSON-LD structured data (`@type: WebSite`, `Product`, `Article`, etc.) present on key page types | P2 |
| J10 | `<meta name="viewport" content="width=device-width, initial-scale=1">` present in HTML head | P1 |
| J11 | **Analytics** — analytics lib present (GA4, Plausible, Umami, PostHog, Mixpanel) and env-gated (`NODE_ENV === 'production'` guard) — not firing in dev/test, not missing in prod | P2 |
| J12 | **llms.txt** — `llms.txt` exists at root with structured site description, key URLs, and context for AI crawlers (ChatGPT, Claude, Perplexity). Also check `llms-full.txt` if content-heavy site | P2 |
| J13 | **Google Search Console** — GSC verification meta tag (`<meta name="google-site-verification">`) or `google*.html` file present | P2 |

### 11 — PWA & Service Worker *(only if intent detected — `manifest.json`, `sw.js`, next-pwa, workbox config found)*

| ID | Check | P-level |
|---|---|---|
| K1 | `manifest.json` or `site.webmanifest` present with `name`, `short_name`, `icons` array, `theme_color`, `background_color`, `display` | P1 |
| K2 | Service worker registered in app entry — `navigator.serviceWorker.register()` or framework equivalent (next-pwa, workbox) | P1 |
| K3 | Offline fallback page exists and is cached by service worker | P2 |
| K4 | Service worker does NOT intercept API routes or auth endpoints — would cause stale/cached login responses | P0 |
| K5 | Service worker versioned / cache busted on deploy — stale SW won't serve old assets | P1 |

### 12 — Legal & Compliance

| ID | Check | P-level |
|---|---|---|
| L1 | `/privacy-policy` or `/privacy` route/page exists | P1 |
| L2 | `/terms` or `/terms-of-service` route/page exists | P1 |
| L3 | Cookie consent / banner library present if analytics, tracking pixels, or ad scripts detected (GDPR/CCPA) | P1 |
| L4 | If payment processing detected — refund/cancellation policy page exists and is linked at checkout | P1 |
| L5 | Footer links to Privacy + Terms present in HTML layout | P2 |

---

## Step 4 — Custom Checks

If user selected "Other" on any AskUserQuestion and typed something, treat that text as a free-form custom check. Run it using judgement based on the codebase. Include findings in report under "Custom Checks". If no "Other" was selected, skip this step silently.

---

## Step 5 — Severity-Weighted Score

Calculate score out of 100:

```
Start at 100.
Each P0 issue found: -10 pts
Each P1 issue found: -3 pts
Each P2 issue found: -1 pt
Floor at 0.
```

Report breakdown:
```
Score: 74/100
  P0 issues: 1 found  ❌  (-10pts)
  P1 issues: 4 found  ⚠️   (-12pts)
  P2 issues: 4 found  ⚠️   (-4pts)
```

---

## Step 6 — Save Reports

### `prelaunch-report.md` (for devs)

```markdown
# Prelaunch Report
**Date**: YYYY-MM-DD
**Stack**: Next.js 16 · TypeScript · Prisma · Vercel
**Categories**: All
**Score**: 74/100  (P0: 1 · P1: 4 · P2: 4)

---

## ❌ P0 Blockers — fix before any deploy

- [ ] **A2** — `.env` tracked in git
  → `git rm --cached .env && echo ".env" >> .gitignore`

- [ ] **C1** — Raw user input in DB query · `src/api/users.ts:34`
  → Use parameterised query / Prisma `where: { id: userId }`

## ⚠️ P1 Warnings — fix within 24h

- [ ] **C7** — CORS wildcard `*` in `api/cors.ts:12`
- [ ] **E3** — Bundle 380kb (limit 300kb) → lazy-load chart.js
- [ ] **E8** — N+1 query in `src/lib/posts.ts:67` — `.find()` inside `.map()`
- [ ] **H1** — 3 `<img>` tags missing `alt` in `components/Gallery.tsx`

## 📝 P2 Notes — polish before launch

- [ ] **B9** — CHANGELOG.md missing
- [ ] **G6** — No OpenAPI spec found

## ✅ Passed (34 checks)
- A1 — No hardcoded secrets
- A6 — Git history clean
- C5 — No CVEs found
- D1 — 42/42 tests passing
- [...]

## ⏭️ Skipped (stack N/A)
- I1 — Dockerfile (not using Docker)

## 🔍 Custom Checks
> "check if Razorpay webhook is verified"
- [ ] Webhook endpoint at `api/payment/webhook.ts` missing `razorpay.webhooks.verify()` call · P1

---

**Verdict**: NOT READY — fix 2 P0 blockers first
**Re-run**: `/prelaunch-check` after fixes to see updated score
```

---

### `prelaunch-report-client.md` (for PM / client — no code jargon)

```markdown
# Website Launch Readiness Report
**Date**: YYYY-MM-DD
**Overall Score**: 74/100

---

## 🔴 Must Fix Before Launch (2 issues)

**Security: Private credentials exposed**
The configuration file containing secret keys was accidentally included in version control.
This means anyone with repo access could see live API keys.

**Security: User data vulnerability**
One part of the codebase passes user input directly to the database without sanitisation.
This is a known security risk (SQL injection).

## 🟡 Should Fix Soon (4 issues)

- Payment gateway security header missing
- Page loads slowly (too much JavaScript)
- Database making unnecessary repeated requests
- 3 images missing text descriptions (affects screen reader users)

## 🟢 Looking Good (34 checks passed)

- No secret keys or passwords in the code
- All automated tests passing (42/42)
- No known security vulnerabilities in dependencies
- [...]

---

**Recommendation**: Not ready to launch. Two security issues must be resolved first.
```

---

## Step 7 — Re-run Prompt (AskUserQuestion)

After saving reports, use `AskUserQuestion`:

**Question 1** — `multiSelect: false`
- header: `Next Step`
- question: `Reports saved (prelaunch-report.md + prelaunch-report-client.md). What next?`
- options:
  - label: `Done` — description: `Exit, fix issues manually using the report`
  - label: `Re-run specific checks` — description: `Re-run individual checks by ID after you've fixed them`

If user picks "Re-run specific checks", ask a follow-up:

**Question 2** — `multiSelect: true`
- header: `Check Groups`
- question: `Which checks to re-run? Select groups or use Other to type specific IDs (e.g. A2 C1 F5)`
- options:
  - label: `All P0 blockers` — description: `Re-run every P0 check from the report`
  - label: `All P1 warnings` — description: `Re-run every P1 check from the report`
  - label: `All P2 notes` — description: `Re-run every P2 check from the report`

If user types specific IDs via "Other", parse the IDs and re-run only those checks.

Re-run selected checks only, update both reports with new results.

---

## Step 8 — Auto-fix (only if user picked "Audit + auto-fix" in Q3)

After report saved, collect all auto-fixable issues. Use `AskUserQuestion`:

**Question 1** — `multiSelect: true`
- header: `Auto-fix`
- question: `These issues can be safely auto-fixed. Select which to apply:`
- options (dynamic — show only fixable issues found, max 4 at a time, no "All of the above"):
  - label: `A2 — Add .env to .gitignore`
  - label: `E6 — Add defer to script in index.html:12`
  - label: `B1 — Remove console.log in api/users.ts:34`
  - label: `H1 — Add alt="" to decorative images in Gallery.tsx`

For each selected fix, show diff before applying:
```
Fix A2 — .gitignore
+ .env
+ .env.local
Applying... ✅ Done
```

After fixes applied, re-run only fixed checks and update reports automatically. If more than 4 fixable issues exist, batch into multiple rounds of AskUserQuestion (4 at a time).

### What auto-fix will apply (safe, no logic change):

| Issue | Fix applied |
|---|---|
| A2 — `.env` in git | Add `.env*` lines to `.gitignore` |
| E6 — render-blocking script | Add `defer` to `<script>` tag |
| E4 — `<img>` missing dimensions | Add `width` and `height` from actual image if detectable |
| E5 — missing `font-display` | Add `font-display: swap` to `@font-face` blocks |
| H1 — `<img>` missing `alt` | Add `alt=""` (decorative) — flag for human to update if content image |
| B1 — `console.log` in prod | Remove line (shows diff, confirms before delete) |
| G3 — `.gitignore` incomplete | Append missing entries |
| F9 — missing npm scripts | Add stub `"test": "echo no tests"` to `package.json` if missing |

### What auto-fix will NOT touch (requires human judgement):

- SQL injection / input validation (logic change)
- Missing auth middleware (architecture decision)
- N+1 queries (refactor needed)
- CORS config (business decision)
- Bundle size (dependency choice)
- CVEs (dependency upgrade)
- Any fix where Claude is not 100% certain of correct value

---

## Constraints

- Read files + non-destructive commands only (`npm audit`, `tsc --noEmit`, `npm run build`, `go build`, `git ls-files`, `git log`)
- Do NOT run: `npm install`, `git push`, migrations, or any write operations
- Skip checks irrelevant to detected stack (mark ⏭️ SKIP in report)
- Monorepo: run checks per app/package, aggregate into one report
- If a check tool is unavailable (e.g. `pip-audit` not installed), note it and skip — don't error
