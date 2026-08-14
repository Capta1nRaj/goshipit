---
name: goshipit
description: >
  Pre-launch codebase audit skill. Use when a developer is preparing to deploy
  to production and wants a comprehensive readiness check. Runs 170+ checks
  across secrets, security, code quality, tests, build/performance, reliability,
  accessibility, deploy config, SEO, PWA, and legal compliance. Dynamically
  detects the stack — no hardcoded framework lists. Saves prelaunch-report.md
  with check IDs and code refs. Severity-weighted score out of 100.
  No live URL needed — codebase only.
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
  - WebSearch
  - WebFetch
  - Agent
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
  - goshipit
metadata:
  author: priyalraj
  version: 0.0.3
  npm: goshipit
  platforms:
    - claude-code
  triggers:
    - goshipit
    - go ship it
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

# goshipit

Pre-launch codebase audit. Stack-aware, severity-weighted, saves prelaunch-report.md. No live URL needed.
Install: `npx goshipit` | Repo: https://github.com/Capta1nRaj/goshipit

## Step 1 — Stack Detection (auto, fully dynamic)

Do NOT hardcode stacks. Read project files and infer:

1. List root + one level deep
2. Read `package.json` — deps, devDeps, scripts
3. Read `pyproject.toml` / `requirements.txt` / `Pipfile` if present
4. Check `*.config.*`, `*.toml`, `*.yaml`, `*.yml`, `Makefile`, `Dockerfile*`, `*.mod`
5. Infer: framework, language, runtime, DB, auth lib, build tool, deploy target, monorepo tool, process manager, reverse proxy

**Inference examples (not exhaustive):**
- `turbo.json`/`nx.json` → monorepo, check per workspace
- `bun.lockb` → Bun runtime
- `pnpm-workspace.yaml` → pnpm monorepo
- `nginx.conf`/`sites-available/` → Nginx
- `ecosystem.config.*` → PM2
- `supervisord.conf` → Supervisor
- `fly.toml`, `render.yaml`, `railway.json`, `vercel.json`, `netlify.toml` → deploy target

**Guards:**
- No recognizable project files → tell user "No codebase detected. Run `/goshipit` from project root." and stop.
- No git repo → skip A2, A6, A7, mark `⏭️ No git history`. Continue all other checks.

Report detected stack before picker. Conditional infra checks only run if tool/file found. Never flag missing = absent.

**Monorepo:** final score = lowest workspace score. One broken app blocks launch.

---

## Step 1.5 — Stack Intelligence Resolution

Resolve framework-specific knowledge **once** before checks → builds **Stack Profile** used by all Step 3 checks.

**Resolution order per detected technology:**
1. **MCP first** — scan MCP tools for tech name. If found, query for prod-readiness patterns + security conventions.
2. **WebSearch + WebFetch** — if no MCP: search `"[technology] production security checklist"`, fetch top official/community page.
3. **Built-in knowledge** — baseline; MCP/web overrides.

**Stack Profile fields:**

| Field | What to resolve |
|---|---|
| `debug_patterns` | Framework debug statements forbidden in prod source |
| `test_command` | Exact test command for stack + pkg manager |
| `lockfile` | Lockfile produced by detected pkg manager |
| `linter` | Idiomatic linter + config filename |
| `shutdown_handler` | SIGTERM/SIGINT graceful shutdown pattern |
| `env_validation_pattern` | Startup env var validation pattern |
| `auth_route_patterns` | Auth endpoint naming conventions |
| `dev_only_deps` | Tool categories not to ship in prod deps |
| `gitignore_required` | Build artifacts, caches, IDE files, secrets for stack |
| `build_command` | Full prod build command |
| `security_middleware` | CSRF, rate-limit, session middleware idioms |
| `edge_runtime_files` | Files on edge runtime (Next.js `middleware.ts`, Vercel Edge Fns, CF Workers) — Node.js-only rate-limit libs (`express-rate-limit`, `ioredis`, `node:*`) crash here; use `@upstash/ratelimit` + `@upstash/redis` instead |

**Output:** Print Stack Profile before category picker. Mark each field source: `[MCP]`, `[web]`, or `[inferred]`.

---

## Step 2 — Category Picker (AskUserQuestion)

Use `AskUserQuestion` tool — do NOT show text menu.

**Q0 — MONOREPO ONLY** *(only if `turbo.json`, `nx.json`, `pnpm-workspace.yaml`, or `packages/`+`apps/` found)*
`multiSelect: true` · header: `Monorepo Scope` · question: `Monorepo detected. Which workspaces to audit?`
Options: list all detected workspaces + `All workspaces`. Score = lowest workspace.

**Q1** `multiSelect: true` · header: `Audit Areas` · question: `Which areas to audit?`
- `All areas` — full audit (recommended)
- `Secrets & Security` — keys, .env, validation, rate limiting, CVEs, CORS, cookies, CSP, HSTS
- `Code Quality & Tests` — debug logs, TODOs, dead code, unused deps, tests, coverage, E2E
- `Build & Performance` — bundle, types, N+1, render-blocking, images, cache, compression, SW
- `Reliability, Hygiene & Deploy` — errors, logging, migrations, .gitignore, README, Nginx, Docker, Vercel, SEO, legal

**Q2** `multiSelect: false` · header: `Accessibility` · question: `Include accessibility checks?`
- `Yes, include` — scans .tsx .jsx .vue .html for alt, ARIA, labels
- `Skip`

**Q3** `multiSelect: false` · header: `Fix Mode` · question: `How to handle issues?`
- `Audit only` — find + report, you fix manually
- `Audit + auto-fix` — offer safe fixes with diff preview

**Q4 — DESIGN.md** *(only if `DESIGN.md` does NOT exist at project root)*
`multiSelect: false` · header: `DESIGN.md` · question: `Generate a DESIGN.md (Google design.md spec) after audit?`
- `Yes, generate` — after audit completes, inspect codebase and write DESIGN.md
- `Skip` — skip design system generation

If `DESIGN.md` already exists at project root → skip Q4 entirely, skip Step 11.

**Mapping:**
- Q1 `All areas` → cats 1–10 + 14 (+ 11/12/13 auto when detected)
- `Secrets & Security` → cats 1, 3
- `Code Quality & Tests` → cats 2, 4
- `Build & Performance` → cat 5
- `Reliability, Hygiene & Deploy` → cats 6, 7, 9, 10, 14
- All 4 specific selected → same as `All areas`
- Cat 11 (PWA) **auto-runs** if `manifest.json`, `sw.js`, `next-pwa`, or workbox detected
- Cat 12 (E-commerce) **auto-runs** if payment lib, cart routes, product schema, or checkout detected
- Cat 13 (Billing) **auto-runs** if any payment/billing SDK in deps or source
- Cat 14 (Legal) **always runs**
- Step 9 **always runs** — Step 10 (build) is optional, user is asked before running
- Q2 `Yes` → also cat 8
- Q3 `Audit + auto-fix` → Step 7 triage can auto-apply safe fixes (Step 8 reference)
- `Other` typed → treat as custom check

---

## Step 3 — Parallel Sub-Agent Dispatch

Spawn one sub-agent per selected category simultaneously (`run_in_background: true`). All parallel. Aggregate after all complete.

### Sub-agent briefing template

```
Caveman ultra mode active. You are a prelaunch audit sub-agent.

Working dir: {CWD}
Stack Profile: {STACK_PROFILE}

Run every check in the table below. For each:
- Use Read/Grep/Bash/Glob as needed. Never open .env* files.
- Return ONLY a JSON array, no prose:

[
  {
    "id": "A1",
    "status": "FAIL",
    "severity": "P0",
    "evidence": "found sk_live_xxx in src/config.js:12",
    "fix": "move to env var, never commit"
  }
]

Status: PASS | FAIL | SKIP (with reason)
PASS = no issues. SKIP = stack not applicable.

Category: {CATEGORY_NAME}
Checks:
{CHECKS_TABLE}
```

### Dispatch rules

Single message, all agents simultaneously:

| Selected area | Agents for categories |
|---|---|
| `All areas` | 1, 2, 3, 4, 5, 6, 7, 8 (if Q2=Yes), 9, 10, 14 + auto: 11/12/13 |
| `Secrets & Security` | 1, 3 |
| `Code Quality & Tests` | 2, 4 |
| `Build & Performance` | 5 |
| `Reliability, Hygiene & Deploy` | 6, 7, 9, 10, 14 |
| Accessibility (Q2=Yes) | 8 |
| PWA auto | 11 |
| E-commerce auto | 12 |
| Billing auto | 13 |

Cat 14 + Steps 9+10 always spawn. Agent error → mark its checks `SKIP (agent error)` P1, continue.

---

## Step 3 — Category Check Definitions

### Category 1 — Secrets & Environment

| ID | Check | P |
|---|---|---|
| A1 | Grep src for `sk_live`, `AIza`, `AKIA`, `ghp_`, `Bearer `, `password =`, `secret =`, `api_key =` (exclude `node_modules`, `.git`, tests) | P0 |
| A2 | `git ls-files .env .env.local .env.production` — flag if tracked | P0 |
| A3 | `.env.example` exists (check via `ls`/`git ls-files` only, never read contents) | P1 |
| A4 | Grep config files (not `.env*`) for `localhost`, `staging.`, `sandbox.`, `test.stripe.com` outside test files | P1 |
| A5 | README explains each required env var | P2 |
| A6 | `git log --all -p --since=1.year.ago` grep secret patterns — flag even if removed (key compromised). Limit 1yr to avoid hang | P0 |
| A7 | `ls`/`git ls-files` confirms both `.env.staging` + `.env.production` exist. Never read contents — note manual drift review required | P1 |
| A8 | Grep config + src (not `.env*`) for `localhost`, `127.0.0.1`, `ngrok.io`, `ngrok-free.app` in webhook/callback URL context | P0 |
| A9 | Grep src + config (not `.env*`) for hardcoded test-mode keys: Stripe `sk_test_`/`pk_test_`, Razorpay `rzp_test_`, PayPal sandbox IDs, Paddle sandbox vendor ID, generic `sandbox`/`test_` prefixes | P0 |

### Category 2 — Code Quality

| ID | Check | P |
|---|---|---|
| B1 | Debug stmts in prod paths — use `debug_patterns` from Stack Profile. Flag matches in auth/payment/API routes | P1 |
| B2 | `TODO`, `FIXME`, `HACK` in auth, payment, form handlers, API routes | P1 |
| B3 | 3+ consecutive commented lines in prod files | P2 |
| B4 | Exported fns/components with zero imports across codebase | P2 |
| B5 | Packages in manifest never imported in src | P2 |
| B6 | `test@example.com`, `admin@admin`, `123456`, hardcoded user IDs, seed imports outside migrations | P1 |
| B7 | Cyclomatic complexity >15 — use file size + nesting depth as proxy if no tool | P1 |
| B8 | Copy-pasted blocks >10 lines appearing 2+ times | P2 |
| B9 | `CHANGELOG.md` exists + version in manifest bumped from last git tag | P2 |
| B10 | `useEffect`/`onMounted` missing cleanup return; `addEventListener` without `removeEventListener`; `setInterval`/`setTimeout` without clear on unmount | P1 |
| B11 | `async` fns without `try/catch`; `.then(` without `.catch(`; `Promise.all(` without `.catch(`; Go goroutines missing err return; Rust `.unwrap()` in non-test code | P1 |
| B12 | Route handlers returning collections without `limit`/`page`/`offset`/`cursor`/`take` — `.findMany(`, `SELECT *`, `.filter(`, `.all(`, `GET /api/*s` | P1 |
| B13 | Grep for `env_validation_pattern` from Stack Profile. Flag if absent — missing vars → silent runtime failures | P1 |
| B14 | Feature flag checks (`featureFlags.X`, `isEnabled(`, `FLAG_`) hardcoded `true`/`false` (not read from config/env) → dead or always-on code path | P2 |
| B15 | Every package in manifest present in lockfile. Flag if not — AI hallucination/typo → silent runtime fail. If no lockfile: skip, rely on C20 | P0 |
| B16 | *(only if `package.json` scripts found)* Grep scripts for Unix-only: `rm -rf`, `cp -r`, `mkdir -p`, `&&`, `export VAR=`, `touch` — breaks silently on Windows. Fix: `rimraf`, `mkdirp`, `cross-env`, `cpy-cli` | P2 |

### Category 3 — Security

| ID | Check | P |
|---|---|---|
| C1 | User input direct to DB query (SQLi) or raw HTML (`dangerouslySetInnerHTML`, `innerHTML`, `v-html`) | P0 |
| C2 | Auth + sensitive endpoints missing rate-limit middleware — use `auth_route_patterns` from Stack Profile. Flag contact form + payment endpoints too. **Edge:** if file in `edge_runtime_files` → flag Node.js-only libs (`express-rate-limit`, `ioredis`) as incompatible, recommend `@upstash/ratelimit`+`@upstash/redis`. If NOT edge → flag `@upstash/ratelimit` without `export const runtime = 'edge'` | P0 |
| C3 | API routes returning full `err.stack` to client | P0 |
| C4 | Protected pages/endpoints missing auth middleware | P0 |
| C5 | Run stack audit tool: `npm audit` / `pip-audit` / `cargo audit` / `govulncheck ./...` — flag high/critical CVEs with pkg name + CVE ID | P1 |
| C6 | Lockfile not committed — use `lockfile` from Stack Profile. Flag manifest without lockfile | P1 |
| C7 | CORS wildcard `*` in prod API config | P1 |
| C8 | Webhook endpoints missing signature verification *(skip if billing SDK detected — M2 covers it)* | P1 |
| C9 | Session/cookie config missing `httpOnly`, `secure`, `sameSite` | P1 |
| C10 | GPL/AGPL licensed packages in commercial codebase | P1 |
| C11 | `Content-Security-Policy` header missing; or `default-src *`; or missing `object-src 'none'`/`upgrade-insecure-requests` | P1 |
| C12 | `X-Frame-Options: DENY`/`SAMEORIGIN` or `frame-ancestors` in CSP — flag if absent | P1 |
| C13 | `X-Content-Type-Options: nosniff` — flag if absent | P1 |
| C14 | `Referrer-Policy` — flag if `unsafe-url` or missing | P1 |
| C15 | `Permissions-Policy` for camera/microphone/geolocation scoped to `(self)` or `()` | P2 |
| C16 | `Strict-Transport-Security` with `max-age` ≥ 31536000 + `includeSubDomains` | P1 |
| C17 | State-changing endpoints (POST/PUT/DELETE/PATCH) use CSRF token middleware (`security_middleware.csrf` from Stack Profile) OR `SameSite=Strict/Lax` cookies. Flag if neither | P1 |
| C18 | Server-side validation lib present (Zod, Joi, Yup, Pydantic, class-validator, Valibot). Flag if only client-side — trivially bypassed | P1 |
| C19 | Unvalidated redirect targets in route handlers + middleware: `res.redirect(req.query.`, `redirect(searchParams.get(`, `window.location = req.`, `Location: ${req.` — flag any redirect from user input without allowlist/same-origin check | P0 |
| C20 | Lockfile `resolved:` URLs outside official registry; lockfile absent with manifest present; `.npmrc`/`.yarnrc` private registry scope without auth token placeholder → dependency confusion | P0 |
| C21 | *(only if GraphQL detected)* `introspection: true` without env-gate; no query depth/complexity limit lib; WebSocket subscriptions without `connectionParams` auth | P1 |
| C22 | `md5(`/`sha1(`/`sha256(` used for passwords. Only `bcrypt` with no `argon2`/`scrypt` alternative | P0 |
| C23 | TLS config allows TLS 1.0/1.1; TLS 1.3 not enabled — grep `nginx.conf`, `apache2.conf`, `ssl.conf`, `.htaccess` | P1 |
| C24 | CI config missing SAST tool (CodeQL, Semgrep, Bandit, gosec, Trivy, Snyk, Gitleaks); missing `npm audit`/`pip-audit`/`cargo audit` in pipeline | P1 |
| C25 | DB schema fields `ssn`, `dob`, `card_number`, `bank_account`, `passport`, `tax_id` present without encryption decorator (`@Encrypted`, `pgcrypto`, `attr_encrypted`, `vault`) | P1 |
| C26 | *(only if multi-tenant: `tenantId`/`orgId`/`workspaceId` in schema)* DB queries missing tenant filter on shared tables; no RLS in migrations; no per-tenant rate limiting in middleware | P0 |
| C27 | Resource lookups by user-supplied ID without ownership filter: `findById(req.params.id)`, `WHERE id = $1`, `.findUnique({ where: { id } })` — flag if no `AND user_id = req.user.id` / `AND org_id = session.orgId` | P0 |
| C28 | `req.body`/`request.json()` passed directly to DB write: `Object.assign(record, req.body)`, `Model.update(req.body)`, `create(data: body)`, `**kwargs` in Python model constructors without field whitelist/`pick()`/schema parse | P0 |
| C29 | Sourcemaps enabled in prod: `devtool: 'source-map'` in webpack prod, `GENERATE_SOURCEMAP=true`, `productionBrowserSourceMaps: true`, `sourcemap: true` in Vite/Rollup prod | P1 |
| C30 | Server-only env vars (`DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET`, `STRIPE_SECRET`) in client components without `NEXT_PUBLIC_`/`VITE_`/`PUBLIC_` prefix. Server-only modules (`prisma`, `pg`, `mysql2`, `redis`) imported in `'use client'`/`.client.ts` files | P0 |
| C31 | >20% of non-auth routes missing rate-limit middleware (`limiter(`, `rateLimit(`, `@throttle`, `Throttle`). Flag WebSocket handlers missing connection-count limits. **Edge:** flag Node.js-only rate-limit lib in edge file; flag `@upstash/ratelimit` in Node.js route without `export const runtime = 'edge'` | P1 |

### Category 4 — Tests

| ID | Check | P |
|---|---|---|
| D1 | Run `test_command` from Stack Profile — report X passed / Y failed | P0 (if fail) |
| D2 | Test coverage includes: auth flow, form submission, payment (if applicable), API error states | P1 |
| D3 | `it.skip`, `xit`, `pytest.mark.skip` in critical path tests | P1 |
| D4 | No E2E framework (Playwright, Cypress, Puppeteer, Selenium) in deps — flag for apps with auth, checkout, or multi-step flows | P1 |

### Category 5 — Build & Performance

| ID | Check | P |
|---|---|---|
| E1 | Run build command — flag errors + deprecation warnings | P0 |
| E2 | *(only if TypeScript)* `tsc --noEmit` — flag type errors; flag `any` casts in auth/payment paths | P1 |
| E3 | Main JS bundle >300kb gzipped — list top 5 largest deps | P1 |
| E4 | `<img>` without `width`/`height`; `next/image`/`loading="lazy"` not used | P1 |
| E5 | Font imports missing `font-display: swap`; render-blocking `@import url()` in CSS | P2 |
| E6 | `<script>` in `<head>` without `defer`/`async` | P1 |
| E7 | Upload endpoints missing max file size config | P1 |
| E8 | DB calls (`.find(`, `.findOne(`, `SELECT`) inside loops (`for`, `forEach`, `.map(`) — N+1, flag with file:line | P1 |
| E9 | Static assets missing `Cache-Control: public, max-age=31536000, immutable` | P1 |
| E10 | `robots.txt`, sitemaps, HTML responses cached immutably — should have short cache / `must-revalidate` | P1 |
| E11 | Compression enabled: `compress: true` (Next.js), `compression()` (Express), `gzip on` (Nginx) | P1 |
| E12 | Modern image formats not configured (webp/avif via `formats: ["image/avif", "image/webp"]`, CDN, or build tool) | P2 |
| E13 | Sync heavy work in event handlers (`onclick`/`addEventListener`/`onKeyDown` with DB calls, large loops, blocking `while`/`for` without `requestAnimationFrame`) | P1 |
| E14 | Dynamic content above fold without reserved space: ads/banners without fixed dims, `height: auto` on above-fold containers, images without `width`+`height` | P1 |
| E15 | *(only if SSR framework)* `Math.random()`/`Date.now()`/`new Date()` outside `useEffect`/`onMounted`; browser APIs (`localStorage`, `navigator`, `document`) at module/render level → hydration mismatch | P1 |

**Stack-specific build checks:** based on detected framework — no hardcoded lists. Apply judgement:
- Frontend: prod build doesn't expose sourcemaps, image/asset handling configured, security headers set
- Backend: debug off, CORS configured, framework security middleware active
- Compiled: vet/lint passes, race detection in tests
- Any: prod config differs from dev, no dev-only flags in prod build scripts

### Category 6 — Reliability

| ID | Check | P |
|---|---|---|
| F1 | Runtime version pinned: `.nvmrc`, `engines` in `package.json`, `runtime.txt`, `pyproject.toml`, `go.mod` | P1 |
| F2 | Top-level error boundary: `ErrorBoundary`, `+error.svelte`, Django 500 template, Go panic recover | P1 |
| F3 | Sentry/Datadog/Bugsnag/Rollbar present + initialised in app entry; Sentry DSN not placeholder; `Sentry.init()` env-gated (not in dev/test) | P1 |
| F4 | Structured logger (Winston, Pino, `logging`, `slog`) not raw `console.log` | P2 |
| F5 | Unapplied DB migrations or edited applied migrations | P0 |
| F6 | *(only if manifest with dev/prod dep separation)* Dev-only tools in prod deps — use `dev_only_deps` from Stack Profile | P1 |
| F7 | Graceful shutdown handlers absent — use `shutdown_handler` from Stack Profile | P1 |
| F8 | No `/health`, `/ping`, or `/status` endpoint | P2 |
| F9 | `build`, `start`, `test` scripts missing from `package.json`/`Makefile`/`pyproject.toml` | P1 |
| F10 | Email-send patterns found but no transactional email lib (Resend, SendGrid, Postmark, Nodemailer, SES, Mailgun) in deps | P1 |
| F11 | "From" address uses `@gmail.com`, `@hotmail.com`, or `@yahoo.com` in email config | P1 |
| F12 | No DB connection pool config (`connection_limit` in Prisma, `pool` in pg/mysql2, `pool_size` in SQLAlchemy) — new connection per request | P1 |
| F13 | No automated DB backup: platform backup, backup script in cron/Makefile, or documented backup service | P1 |
| F14 | No uptime monitoring configured (Pingdom, Better Uptime, UptimeRobot, Checkly) | P2 |
| F15 | Contact/form handlers with only `console.log` or `res.json({ ok: true })` and no DB write or email send — silent form delivery failure | P1 |
| F16 | *(non-billing webhooks only — skip if billing SDK, M3 covers it)* No idempotency key check in webhook handler: event ID stored in DB, `processedEvents` table, Redis SET NX. Flag if heavy sync work without queue offload | P0 |
| F17 | *(relational DB only)* FK columns (`REFERENCES`, `@relation`, `ForeignKey`) without corresponding index (`CREATE INDEX`, `@@index`, `index: true`) → full-table scans on cascade delete + JOIN | P1 |
| F18 | *(only if transactional email detected)* Sending domain uses `@gmail.com`/`@hotmail.com`/`@yahoo.com` — cannot have custom SPF/DKIM. Check DKIM enabled in provider config | P1 |
| F19 | Node.js missing `process.on('uncaughtException'` + `process.on('unhandledRejection'`; Browser missing `window.onerror`/`window.addEventListener('error'` — silent crash with no log/alert | P1 |

### Category 7 — Codebase Hygiene

| ID | Check | P |
|---|---|---|
| G1 | `<<<<<<<`, `=======`, `>>>>>>>` in any src file | P0 |
| G2 | Files >1MB outside `node_modules`/`.git` | P1 |
| G3 | `.gitignore` missing entries — use `gitignore_required` from Stack Profile | P1 |
| G4 | README missing setup / env vars / run locally / deploy steps, or has placeholder text | P2 |
| G5 | Linter errors or no linter config — use `linter` from Stack Profile, run it | P1 |
| G6 | No `openapi.json`/`swagger.yaml`/`/docs` — if present, spot-check 3 routes match implementation | P2 |
| G7 | Grep UI-facing src for `Lorem ipsum`, `Your Company Name`, `Acme Corp`, `placeholder@email.com`, `Coming soon` (exclude tests, node_modules) | P1 |
| G8 | Custom 404: `pages/404.tsx`, `app/not-found.tsx`, `404.html`, or framework equivalent | P2 |
| G9 | Custom 500: `pages/500.tsx`, `app/error.tsx`, `500.html`, or framework equivalent | P2 |
| G10 | *(only if app has articles/invoices/receipts/reports)* No `@media print` in any CSS/style file | P2 |
| G11 | *(only if dark mode in README/config or `prefers-color-scheme` detected)* No `@media (prefers-color-scheme: dark)` or `dark:` Tailwind variants → OS dark mode ignored | P2 |
| G12 | *(only if i18n lib detected)* User-facing string literals not wrapped in translation call (`t(`, `__()`, `<Trans>`); `new Date().toLocaleDateString()` without locale param; hardcoded date format strings outside i18n config | P1 |
| G13 | Mobile responsiveness: Tailwind detected → grep for `sm:`/`md:`/`lg:` variants — flag if none found. CSS/SCSS detected → grep for `@media` with `max-width`/`min-width` in layout files — flag if absent. Both absent → skip | P1 |

### Category 8 — Accessibility (WCAG 2.2 AA, static grep)

| ID | Check | P |
|---|---|---|
| H1 | `<img` without `alt=` — flag with file:line | P1 |
| H2 | `<div`/`<span`/`<a` without `href` + click handler but missing `role` + `tabIndex` | P1 |
| H3 | `<input>`/`<select>`/`<textarea>` without `<label>`, `aria-label`, or `aria-labelledby` | P1 |
| H4 | Hardcoded low-contrast color combos in CSS (white-on-yellow, light-grey-on-white, light-blue-on-white) | P2 |
| H5 | Missing `<title>` in HTML templates / `metadata` export / framework `head()` | P1 |
| H6 | `aria-hidden="true"` on focusable elements (`<button`, `<a`, `<input`, `tabIndex` ≥ 0) | P1 |
| H7 | `:focus { outline: none/0 }` without `:focus-visible` replacement → fails WCAG 2.2 SC 2.4.11 | P1 |
| H8 | Modal/dialog/drawer without `Escape` handler, focus trap lib (`focus-trap`, `@radix-ui`, `headlessui`), or `onKeyDown` managing Tab/Shift+Tab | P1 |
| H9 | Interactive elements with explicit size <24×24px (`width: 16px`, `h-3 w-3`, `size-3`) → WCAG 2.2 SC 2.5.8 | P2 |

### Category 9 — Deploy Config

| ID | Check | P |
|---|---|---|
| I1a | *(if Dockerfile)* Single `FROM` line with no `AS` alias → ships dev deps + build tools | P1 |
| I1b | *(if Dockerfile)* No `USER` instruction or `USER root` → container escape = host root | P0 |
| I1c | *(if Dockerfile)* `COPY . .` before `COPY package.json`+lockfile → dep install cache invalidated on every code change | P1 |
| I1d | *(if Dockerfile)* `CMD` points to raw source (`node src/index.js`) not compiled output | P1 |
| I1e | *(if Dockerfile)* No `.dockerignore` or missing `node_modules`, `.env*`, `.git`, `dist` — wrong-arch binaries or secrets in image | P1 |
| I2 | *(if `vercel.json`)* Hardcoded env vars; unreasonable `functions` timeout; dev routes exposed | P1 |
| I3 | *(if `render.yaml`/`railway.json`/`fly.toml`)* Prod env not set; no health check path; dev command in prod | P1 |
| I4 | No deploy config file found (`Dockerfile`, `vercel.json`, `render.yaml`, `fly.toml`) → undocumented deploy | P2 |
| I5 | Dev-only env vars (`DEBUG=true`, `LOG_LEVEL=verbose`) hardcoded in deploy config | P1 |
| I6 | *(if Nginx)* `server_tokens` not off; gzip not enabled; no SSL redirect; wrong root dir; no `limit_req_zone` on API routes | P1 |
| I7 | *(if Nginx)* `proxy_pass` wrong upstream; `proxy_set_header` missing `X-Real-IP`/`X-Forwarded-For` | P1 |
| I8 | *(if PM2/Supervisor)* `instances` not `max` or explicit; `autorestart: true` absent; no log paths; `NODE_ENV=production` not set | P1 |
| I9 | Free platform subdomain in prod (`.vercel.app`, `.netlify.app`, `.railway.app`, `.fly.dev`, `.onrender.com`) → no custom domain | P1 |

### Category 10 — SEO & Meta

| ID | Check | P |
|---|---|---|
| J1 | No `favicon.ico`/`favicon.svg` in `public/` or `<link rel="icon">` in `<head>` | P2 |
| J2 | `robots.txt` — `Disallow: /` blocking entire site | P0 (blocking) / P2 (missing) |
| J3 | No `sitemap.xml` at root or `Sitemap:` in `robots.txt` | P1 |
| J4 | `<meta name="description">` missing on index + key landing pages | P1 |
| J5 | `og:title`, `og:description`, `og:image` missing on shareable pages | P2 |
| J6 | `<meta name="robots" content="noindex">` on prod pages → blocks all search indexing | P0 |
| J7 | `<html lang="...">` missing on root element | P1 |
| J8 | `<link rel="canonical">` missing on paginated/duplicate-URL pages | P2 |
| J9 | No JSON-LD structured data (`@type: WebSite`/`Product`/`Article`) on key pages | P2 |
| J10 | `<meta name="viewport" content="width=device-width, initial-scale=1">` missing | P1 |
| J11 | Analytics check: GA4 (`G-XXXXXXXX`), Meta Pixel (`fbq`), Clarity, Plausible/Umami/PostHog/Mixpanel — verify each is env-gated (`NODE_ENV === 'production'`). Flag if not env-gated. Flag if none present at all | P1 |
| J12 | *(only if GA4 or Google Ads detected)* `gtag('consent', 'default', {...})` before any `gtag('config', ...)` with `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` — required DMA/GDPR (account suspension risk since July 2025) | P0 |
| J13 | `llms.txt` missing at root with site description, key URLs, AI crawler context | P2 |
| J14 | No GSC verification (`<meta name="google-site-verification">` or `google*.html`) | P2 |

### Category 11 — PWA & Service Worker *(only if intent detected)*

| ID | Check | P |
|---|---|---|
| K1 | `manifest.json`/`site.webmanifest` missing or lacks `name`, `short_name`, `icons`, `theme_color`, `background_color`, `display` | P1 |
| K2 | Service worker not registered (`navigator.serviceWorker.register()` or framework equivalent) | P1 |
| K3 | No offline fallback page cached by SW | P2 |
| K4 | SW intercepts API routes or auth endpoints → stale/cached login responses | P0 |
| K5 | SW not versioned/cache-busted on deploy → stale SW serves old assets | P1 |

### Category 12 — E-commerce Tracking *(only if e-commerce detected)*

#### GA4 E-commerce Events *(only if GA4 detected)*

| ID | Check | P |
|---|---|---|
| L1 | `gtag('event', 'view_item'` or `dataLayer.push({ event: 'view_item'` missing on product pages | P1 |
| L2 | `gtag('event', 'add_to_cart'` missing in cart-add handler (not page load — double-counts on refresh) | P1 |
| L3 | `gtag('event', 'begin_checkout'` missing on checkout entry | P1 |
| L4 | `gtag('event', 'purchase'` missing on order confirmation; `transaction_id` param absent or hardcoded (duplicate ID → inflated revenue on refresh) | P0 |
| L5 | Any of `view_item`/`add_to_cart`/`begin_checkout`/`purchase` missing `items: [` param → product reports empty | P1 |
| L6 | `add_shipping_info`/`add_payment_info` missing in shipping/payment step components | P2 |

#### Meta Pixel E-commerce Events *(only if Meta Pixel detected)*

| ID | Check | P |
|---|---|---|
| L7 | `fbq('track', 'ViewContent'` missing on product pages → no dynamic ads retargeting | P1 |
| L8 | `fbq('track', 'AddToCart'` missing or lacks `content_ids`, `value`, `currency`; fired on page load not button click | P1 |
| L9 | `fbq('track', 'InitiateCheckout'` missing on checkout entry | P1 |
| L10 | `fbq('track', 'Purchase'` missing on order confirmation; `value`/`currency` absent; `content_ids`/`contents` absent if using Advantage+ catalog | P0 |
| L11 | `fbq('track', 'AddPaymentInfo'` missing on payment step | P2 |

#### General E-commerce

| ID | Check | P |
|---|---|---|
| L12 | Thank-you page fires `purchase`/`Purchase` unconditionally on load without dedup (session flag, one-time token, or server-side sent check) | P1 |
| L13 | No Meta CAPI (`/events` endpoint) or GA4 Measurement Protocol fallback — ad blockers suppress 30–60% of client-side events | P1 |

---

### Category 13 — Billing & Subscription *(only if payment/billing SDK detected)*

**Gateway detection — do first, dynamically:**
1. Grep manifest + source imports for payment SDK names
2. Identify all gateways (Stripe, Razorpay, PayPal, Paddle, LemonSqueezy, Chargebee, Braintree, Square, Adyen, Mollie, Cashfree, PayU, Paytm, PhonePe, Cashier, Billing, etc.)
3. For each detected gateway — resolve webhook event names + API conventions:
   - **MCP first** — scan for gateway MCP tool (e.g. `stripe` MCP). Use it if found.
   - **WebSearch/WebFetch if no MCP** — `"<gateway> webhook events list production required"` + `"<gateway> idempotency key API"`
   - **Never hardcode Stripe events for non-Stripe gateway** — Razorpay: `payment.captured`/`subscription.charged`; PayPal: `PAYMENT.CAPTURE.COMPLETED`; Paddle: `subscription_payment_failed`

| ID | Check | P |
|---|---|---|
| M1 | Critical webhook events handled: payment success, subscription created/updated/cancelled, payment failed — using gateway-specific event names from detection above | P0 |
| M2 | Webhook signature verified — Stripe `constructEvent`, Razorpay `validateWebhookSignature`, PayPal cert, Paddle `verifyWebhookSignature`. Flag raw payload without signature check | P0 |
| M3 | Idempotency: event ID stored in DB/Redis before processing (Stripe `event.id`, Razorpay `payload.payment.entity.id`, PayPal `resource.id`). Flag if absent — all gateways retry → duplicate fulfilment | P0 |
| M4 | Payment-failed handler: sends recovery email OR marks subscription `past_due`/`suspended` OR redirects to payment update. Flag if empty/missing | P1 |
| M5 | Paid features gated server-side (not only client-side UI hide) | P0 |
| M6 | Payment SDK create calls missing idempotency key param (Stripe `idempotencyKey`, Razorpay `receipt`, PayPal `PayPal-Request-Id`) → network retry = duplicate charge | P1 |
| M7 | Usage limits per plan enforced backend (not only UI) before resource creation | P1 |
| M8 | Hardcoded test-mode keys in source outside test dirs — gateway-specific prefixes from detection above (complements A9 which checks config files) | P0 |
| M9 | Webhook handler does heavy sync work (DB writes, email, external API) before responding — flag if no queue (`Bull`, `Celery`, `Sidekiq`, `pg-boss`) and no fast `200` ack | P1 |

---

### Category 14 — Legal & Compliance

| ID | Check | P |
|---|---|---|
| N1 | `/privacy-policy` or `/privacy` route/page missing | P1 |
| N2 | `/terms` or `/terms-of-service` route/page missing | P1 |
| N3 | Analytics/tracking/ad scripts detected but no cookie consent/banner lib (GDPR/CCPA) | P1 |
| N4 | Payment processing detected but no refund/cancellation policy page linked at checkout | P1 |
| N5 | Footer missing Privacy + Terms links | P2 |
| N6 | *(only if auth detected)* No data export endpoint (`/export`, `/download-my-data`, `/gdpr/export`) → GDPR Art. 20 | P1 |
| N7 | *(only if auth detected)* No data deletion endpoint (`/delete-account`, `/gdpr/delete`, `/account/erase`); deletion handler only sets `isDeleted: true` without removing/anonymising DB records → GDPR Art. 17 | P1 |

---

## Step 4 — Custom Checks

If user typed "Other" on any question, run it as a free-form check using judgement. Include findings under "Custom Checks" in report. No "Other" → skip silently.

---

## Step 5 — Severity-Weighted Score

```
Start: 100
P0 issue: −10 pts
P1 issue: −3 pts
P2 issue: −1 pt
No floor — can go negative.
```

Output format:

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
│   ⏭️   Skipped        3   (stack N/A)            │
│                                                 │
│   VERDICT: NOT READY — fix 1 P0 blocker first  │
└─────────────────────────────────────────────────┘
```

Negative score:
```
┌─────────────────────────────────────────────────┐
│  🚀 GOSHIPIT PRELAUNCH SCORE                    │
│                                                 │
│   -20 / 100                             ☠️      │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  -20%          │
│                                                 │
│   VERDICT: SEVERELY BROKEN — major rework       │
└─────────────────────────────────────────────────┘
```

| Score | Emoji | Verdict |
|---|---|---|
| 90–100 | 🟢 | Ready to launch |
| 75–89  | 🟡 | Launch with P1 fixes queued |
| 50–74  | 🟠 | Fix P1s before launch |
| 1–49   | 🔴 | Not ready — blockers present |
| 0      | 🚨 | DO NOT LAUNCH |
| < 0    | ☠️  | Severely broken — major rework |

Fill bar: `█` = 3.125 pts. 32 blocks. Empty = `░`. Negative = all 32 empty.

---

## Step 6 — Save Report

### `prelaunch-report.md`

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
- I1a–I1e — Dockerfile checks (no Dockerfile detected)

## 🔍 Custom Checks
> "check if Razorpay webhook is verified"
- [ ] Webhook endpoint at `api/payment/webhook.ts` missing `razorpay.webhooks.verify()` call · P1

---

**Verdict**: NOT READY — fix 2 P0 blockers first
```

---

## Step 7 — Issue Triage (AskUserQuestion)

After score shown + report saved, ask user what to fix now:

**Q1** `multiSelect: true` · header: `Fix Now` · question: `Which issues do you want to fix right now? (select any, or skip to fix manually)`

Options — dynamically list every FAIL from the report as a selectable item, grouped:
- Each P0: `❌ A2 — .env tracked in git`
- Each P1: `⚠️ C7 — CORS wildcard * in api/cors.ts:12`
- Each P2: `📝 B9 — CHANGELOG.md missing`
- Always include: `Skip — I'll fix manually using the report`

If user picks `Skip` → end session (Step 9+ still run).

If user picks any issues:
- For each selected issue, attempt to fix it:
  - If auto-fixable (see Step 8 safe-fix list) → apply fix, show diff, confirm before touching
  - If NOT auto-fixable (requires human judgement — SQLi, auth, N+1, CORS logic, CVEs) → explain what needs to change and exactly where in the code, with a concrete code snippet showing the fix. Do NOT modify the file.
- After all selected issues handled → update report checkboxes for fixed items

---

## Step 8 — Auto-fix Reference

Used by Step 7 to determine if a selected issue can be auto-applied or needs human guidance.

Show diff before applying any fix:
```
Fix A2 — .gitignore
+ .env
+ .env.local
Applying... ✅ Done
```

### Auto-fixable (apply directly):

| Issue | Fix |
|---|---|
| A2 — `.env` in git | Add `.env*` to `.gitignore` |
| E6 — render-blocking script | Add `defer` to `<script>` |
| E4 — `<img>` missing dims | Add `width`+`height` if detectable |
| E5 — missing `font-display` | Add `font-display: swap` to `@font-face` |
| H1 — `<img>` missing `alt` | Add `alt=""` — flag for human if content image |
| B1 — `console.log` in prod | Remove line (diff + confirm before delete) |
| G3 — `.gitignore` incomplete | Append missing entries |
| F9 — missing npm scripts | Add stub `"test": "echo no tests"` if missing |

### Auto-fix will NOT touch:
SQL injection, missing auth middleware, N+1 queries, CORS config, bundle size, CVEs, any fix where correct value is uncertain.

---

## Step 9 — Package Update Check

1. Detect pkg manager from Step 1
2. Resolve latest version:
   - **MCP first** — scan for pkg manager MCP tool
   - **WebSearch/WebFetch if no MCP** — read registry page (npmjs.com/PyPI/crates.io/pkg.go.dev), confirm exact version + release date
   - **Never hallucinate a version**
3. List outdated: `npm outdated` / `pip list --outdated` / `cargo outdated` / `go list -m -u all`
4. Only recommend updates where: released >30 days ago AND version confirmed via MCP or web
5. Report: current → recommended, release date, changelog link
6. Major bumps (v2→v3) → flag `⚠️ BREAKING`, do NOT auto-suggest, note "check changelog"

**Never:** suggest version <30 days old, suggest unverified version, run install commands, treat major bumps as routine.

---

## Step 10 — Final Build Verification (optional)

Ask user before running:

`multiSelect: false` · header: `Build Check` · question: `Run a production build to verify no compile errors?`
- `Yes, run build` — runs build command, flags errors as P0
- `Skip` — skip build check, note in report

If `Yes`: run `build_command` from Stack Profile. Fallback: `Makefile` build target or `package.json scripts.build`. No build command found → `⏭️ SKIP (no build command detected)`.

Result:
- `✅ Build passed` — note warnings
- `❌ Build failed` — show first error, −10 pts (P0)
- `⏭️ Skipped` — user opted out, no score impact

---

## Step 11 — DESIGN.md Generation (optional)

Run only if user picked `Yes, generate` in Q4 (Step 2). If Q4 was skipped (DESIGN.md already exists) or user picked `Skip` → end session silently.

### How to generate DESIGN.md

Spec: https://github.com/google-labs-code/design.md + https://stitch.withgoogle.com/docs/design-md/specification

**1 — Inspect codebase for design signals:**

| Source | Extract |
|---|---|
| `tailwind.config.*` | `theme.colors`, `fontFamily`, `fontSize`, `spacing`, `borderRadius`, `boxShadow`, `transitionDuration` |
| `tokens.json`/`design-tokens.json`/`tokens/*.json` | All W3C DTCG token values |
| `globals.css`/`app.css`/`index.css`/`styles.css` | CSS custom properties: `--color-*`, `--font-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--duration-*`, `--ease-*` |
| `theme.ts`/`theme.js`/`src/theme/*` | Color/typography/spacing/shadow/motion objects |
| `package.json` deps | Design system libs (`@mui/material`, `@chakra-ui/react`, `shadcn/ui`) → read theme override files |
| `design/` dir / Figma exports | Token JSON or CSS exports |
| `*.css` / components | Repeated hex values, font-family strings, px/rem values, box-shadow, transition durations |

Zero signals found → note `DESIGN.md skipped — no design tokens or brand signals found.` and stop.

**2 — Resolve brand personality:**
Read `README.md`, `package.json` description, landing page / `about` components. Extract: product name, tagline, target audience, brand voice.

**3 — Write DESIGN.md at project root:**

```markdown
---
version: alpha
name: {product name}
description: {one-line brand description}
colors:
  primary: "{hex}"
  secondary: "{hex}"
  tertiary: "{hex}"          # only if found
  neutral: "{hex}"           # only if found
  success: "{hex}"           # only if found
  warning: "{hex}"           # only if found
  error: "{hex}"             # only if found
typography:
  h1:
    fontFamily: {family}
    fontSize: {value}px
    fontWeight: {number}
    lineHeight: {value}
    letterSpacing: {value}   # only if found
    fontFeature: {string}    # only if found
  # repeat per detected level
rounded:
  xs: {value}px              # only scales found — xs/sm/md/lg/xl/full
  sm: {value}px
  md: {value}px
  lg: {value}px
  full: 9999px               # only if pill/full-radius found
spacing:
  xs: {value}px              # only scales found — xs/sm/md/lg/xl/2xl
  sm: {value}px
  md: {value}px
  lg: {value}px
shadows:                     # only if box-shadow tokens found
  sm: "{css value}"
  md: "{css value}"
  lg: "{css value}"
motion:                      # only if transition/animation tokens found
  duration-fast: {value}ms
  duration-base: {value}ms
  duration-slow: {value}ms
  easing-default: "{css easing fn}"
  easing-enter: "{css easing fn}"
  easing-exit: "{css easing fn}"
components:                  # only if component-level tokens found
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    borderRadius: "{rounded.md}"
    typography: "{typography.label-md}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
  card:
    backgroundColor: "{colors.neutral}"
    borderRadius: "{rounded.lg}"
    shadow: "{shadows.md}"
omitted:
  - section: shadows
    reason: "No shadow tokens found in codebase"
  - section: motion
    reason: "No transition/animation tokens defined"
---

## Overview
{Brand personality, target audience, emotional intent — 3-5 sentences. Use descriptive language: "Architectural Minimalism meets Journalistic Gravitas" not "clean and modern".}

## Colors
- **Primary ({hex}):** {semantic role}
- **Secondary ({hex}):** {role}

## Typography
- **{token-name}:** {family, size, weight} — {intended use}

## Layout
{Spacing scale rationale, grid system, max container widths, breakpoints.}

## Elevation & Depth
{Only if shadows found. Scale + when each level applies.}

## Shapes
{Border-radius scale + when each level applies.}

## Components
{Only if component tokens found. Visual rules per component.}

## Do's and Don'ts
**Do:**
- {concrete rule from actual tokens}

**Don't:**
- {concrete rule — e.g. "Don't use tertiary on backgrounds <44px — contrast drops below WCAG AA"}
```

**Rules:**
- YAML values only from codebase — no invented values. Missing token → omit + add to `omitted`
- `{path.to.token}` in `components` must reference token defined in same file
- `fontWeight` must be a number (400, not "bold")
- All hex values must be valid CSS colors
- Section order: Overview → Colors → Typography → Layout → Elevation & Depth → Shapes → Components → Do's and Don'ts
- `omitted` entries suppress linter warnings — always include inspected-but-not-found sections
- Prose must describe *why*, not just *what*
- No placeholder text in final file — every line must contain real data

**After writing:** `DESIGN.md written — {N} color tokens, {M} typography levels, {K} shadows, {J} motion tokens, {L} component tokens.`

**4 — Validate against live Google spec:**

After writing, validate DESIGN.md is not using deprecated fields:
1. `WebFetch` https://github.com/google-labs-code/design.md — read the latest spec README
2. `WebFetch` https://stitch.withgoogle.com/docs/design-md/specification — read the full field reference
3. Compare every field/section name in the written DESIGN.md against the live spec:
   - Flag any field that no longer exists in the spec (deprecated/renamed)
   - Flag any required field that's now mandatory but missing
   - Flag any value format change (e.g. unit expected changed from px to rem)
4. If issues found → fix DESIGN.md in-place and note what was corrected
5. Output: `DESIGN.md validated against Google spec — {N} fixes applied.` or `DESIGN.md validated — no issues.`

---

## Constraints

- Read + non-destructive commands only (`npm audit`, `tsc --noEmit`, `npm run build`, `go build`, `git ls-files`, `git log`)
- Do NOT run: `npm install`, `git push`, migrations, or any write ops
- **NEVER read `.env*` files** — existence check via `git ls-files`/`ls` only. Never open/cat them.
- Skip checks irrelevant to stack (mark ⏭️ SKIP)
- Monorepo: checks per workspace, one report, final score = lowest workspace
- Tool unavailable (e.g. `pip-audit` not installed) → note + skip, don't error
