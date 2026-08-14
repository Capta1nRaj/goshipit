---
name: goshipit
description: >
  Pre-launch codebase audit skill. Use when a developer is preparing to deploy
  to production and wants a comprehensive readiness check. Runs 170+ checks
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
  version: 0.0.2
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

Pre-launch codebase audit. Stack-aware, severity-weighted, saves two reports. No live URL needed.
Install: `npx goshipit` | Repo: https://github.com/Capta1nRaj/goshipit

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
- If no recognizable project files found (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Makefile`, `Dockerfile`, `*.config.*`) → tell user "No codebase detected in this directory. Run `/goshipit` from your project root." and stop.
- If no git repo (`.git` dir absent or `git log` returns nothing) → skip A2, A6, A7 silently, mark each `⏭️ No git history` in report. Continue with all other checks.

Report everything detected before showing the picker. All infra/config checks are **conditional** — only run if that tool/file is actually found. Never flag something as missing just because it's not present.

**Monorepo scoring rule** — if monorepo detected: final score = lowest workspace score. One broken app blocks launch regardless of other workspaces passing.

---

## Step 1.5 — Stack Intelligence Resolution

Using the stack detected in Step 1, resolve framework-specific knowledge **once** before running any checks. This builds a **Stack Profile** used by all Step 3 checks — no hardcoded pattern lists anywhere.

**For each detected technology (language, framework, DB, auth lib, payment SDK, email provider, linter, deploy target):**

Resolution order:
1. **MCP first** — scan available MCP tools for the technology name (e.g. `nextjs` MCP, `prisma` MCP, `stripe` MCP, `rails` MCP). If found, query it for production-readiness patterns, security conventions, and relevant API docs.
2. **WebSearch + WebFetch** — if no MCP: `WebSearch` `"[technology] production security checklist"` then `WebFetch` the top official docs or community best-practice page. Extract fields below.
3. **Built-in knowledge** — use as baseline; MCP/web results override where available.

**Stack Profile — resolve these fields:**

| Field | What to find |
|---|---|
| `debug_patterns` | Language/framework-specific debug statements that must not appear in prod source |
| `test_command` | Exact test command for detected stack + package manager |
| `lockfile` | Which lockfile the detected package manager produces |
| `linter` | Idiomatic linter for this stack and its config file name |
| `shutdown_handler` | How to handle SIGTERM/SIGINT gracefully in this runtime |
| `env_validation_pattern` | How this stack validates required env vars at startup |
| `auth_route_patterns` | Typical auth endpoint/route naming conventions for detected framework |
| `dev_only_deps` | Tool categories (test runners, dev servers, type checkers) that must not ship in prod deps |
| `gitignore_required` | Build artifacts, caches, IDE files, and secrets specific to this stack |
| `build_command` | Full production build command for detected stack + package manager |
| `security_middleware` | CSRF, rate-limit, session middleware idioms for detected framework |

**Output:** Print the resolved Stack Profile before showing the category picker. Mark each field's source: `[MCP]`, `[web]`, or `[inferred]`. All checks in Step 3 that reference "Stack Profile" use this resolved data — never fall back to hardcoded lists in the check descriptions.

---

## Step 2 — Category Picker (AskUserQuestion)

Use the `AskUserQuestion` tool with these exact questions. Do NOT show a text menu — use the tool so the user gets proper checkboxes in the UI.

**Question 0 — MONOREPO ONLY** *(ask this first, only if monorepo detected in Step 1 — `turbo.json`, `nx.json`, `pnpm-workspace.yaml`, or `packages/`+`apps/` dirs found)*

`multiSelect: true`
- header: `Monorepo Scope`
- question: `Monorepo detected. Which workspaces should be audited?`
- options: dynamically list all detected workspaces — e.g. `apps/web`, `apps/api`, `packages/ui`, `packages/shared`. Add a final option: `All workspaces` — description: `Audit every app and package`
- If user picks specific workspaces: run all checks scoped to those dirs only
- If user picks `All workspaces`: run checks across every workspace
- Final score = lowest workspace score (one failing app blocks launch)
- If NOT a monorepo: skip this question entirely, proceed normally

**Question 1** — `multiSelect: true`
- header: `Audit Areas`
- question: `Which areas do you want to audit?`
- options:
  - label: `All areas` — description: `Run every category — full pre-launch audit (recommended)`
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
- Q1 `All areas` → run categories 1–10 + 14 (plus 11/12/13 auto-run when conditions met) — same as selecting all 4 below
- Q1 `Secrets & Security` → run categories 1 (Secrets) + 3 (Security)
- Q1 `Code Quality & Tests` → run categories 2 (Code Quality) + 4 (Tests)
- Q1 `Build & Performance` → run category 5 (Build & Performance)
- Q1 `Reliability, Hygiene & Deploy` → run categories 6 (Reliability) + 7 (Hygiene) + 9 (Deploy Config) + 10 (SEO & Meta) + 14 (Legal & Compliance)
- Q1 all 4 specific areas selected → same as `All areas`
- **Category 11 (PWA) auto-runs** whenever `manifest.json`, `sw.js`, `next-pwa`, or workbox config detected — regardless of picker selection
- **Category 12 (E-commerce Tracking) auto-runs** whenever payment lib, cart routes, product schema, or checkout patterns detected — regardless of picker selection
- **Category 13 (Billing & Subscription) auto-runs** whenever ANY payment/billing SDK detected in deps or source — gateway identified dynamically, event names resolved via MCP or WebSearch
- **Category 14 (Legal & Compliance) always runs** — privacy policy, terms, cookie consent, GDPR apply to every app. Not optional.
- **Step 9 (Package Update Check) and Step 10 (Final Build) always run — not optional, cannot be skipped**
- Q2 `Yes` → also run category 8 (Accessibility)
- Q3 `Audit + auto-fix` → run Step 8 (auto-fix flow) after report
- User selects `Other` on any question → treat typed text as a custom check to run

---

## Step 3 — Parallel Sub-Agent Dispatch

**Do NOT run categories sequentially.** Spawn one sub-agent per selected category simultaneously using the `Agent` tool with `run_in_background: true`. All agents run in parallel. Aggregate results after all complete.

### Sub-agent briefing template

For each selected category, spawn an Agent with this prompt (fill in `{CATEGORY_NAME}`, `{CHECKS_TABLE}`, `{STACK_PROFILE}`):

```
Caveman ultra mode active. You are a prelaunch audit sub-agent.

Working dir: {CWD}
Stack Profile: {STACK_PROFILE}

Run every check in the table below. For each check:
- Use Read/Grep/Bash/Glob as needed. Never open .env* files.
- Return ONLY a JSON array, no prose. Format:

[
  {
    "id": "A1",
    "status": "FAIL",
    "severity": "P0",
    "evidence": "found sk_live_xxx in src/config.js:12",
    "fix": "move to env var, never commit"
  },
  ...
]

Status values: PASS | FAIL | SKIP (with reason)
Return PASS for checks that find no issues. Return SKIP only if stack not detected for stack-specific check.

Category: {CATEGORY_NAME}
Checks:
{CHECKS_TABLE}
```

### Dispatch rules

After Step 2 picker, in a single message spawn ALL selected-category agents simultaneously (one Agent tool call per category, all in the same response — do NOT wait between spawns):

| Selected area | Spawn agents for categories |
|---|---|
| `All areas` | 1, 2, 3, 4, 5, 6, 7, 8 (if Q2=Yes), 9, 10, 14 + auto: 11/12/13 if detected |
| `Secrets & Security` | 1, 3 |
| `Code Quality & Tests` | 2, 4 |
| `Build & Performance` | 5 |
| `Reliability, Hygiene & Deploy` | 6, 7, 9, 10, 14 |
| Accessibility (Q2=Yes) | 8 (always parallel with others) |
| PWA auto-detected | 11 (background, always) |
| E-commerce auto-detected | 12 (background, always) |
| Billing auto-detected | 13 (background, always) |

Category 14 (Legal) and Steps 9+10 always spawn regardless of selection.

### Aggregation (after all agents complete)

Wait for all background agents to finish. Then:
1. Collect all JSON arrays from each agent
2. Flatten into single findings list
3. Proceed to Step 4 (Custom Checks) → Step 5 (Scoring) → Step 6 (Reports)

If any agent errors or times out: mark all its checks as `SKIP (agent error)` with P1 severity, note in report, continue.

---

## Step 3 — Category Check Definitions

The check tables below are the payloads passed to each sub-agent. Each sub-agent receives only its own category's table. Skip checks marked *(stack-specific)* if stack not detected.

### Category 1 — Secrets & Environment

| ID | Check | P-level |
|---|---|---|
| A1 | Grep source for `sk_live`, `AIza`, `AKIA`, `ghp_`, `Bearer `, `password =`, `secret =`, `api_key =` (exclude `node_modules`, `.git`, tests) | P0 |
| A2 | `git ls-files .env .env.local .env.production` — flag if tracked | P0 |
| A3 | `.env.example` exists — check via `ls` or `git ls-files` only. Never read its contents | P1 |
| A4 | Grep config files (e.g. `next.config.*`, `app.config.*`, `*.toml`, `*.yaml` — exclude `.env*`) for `localhost`, `staging.`, `sandbox.`, `test.stripe.com` outside test files | P1 |
| A5 | README explains each env var required to run the app | P2 |
| A6 | `git log --all -p --since=1.year.ago` grep for secret patterns — flag even if removed (key is compromised). Limit to 1 year to avoid hanging on large repos | P0 |
| A7 | **Multi-env drift** — check via `ls` or `git ls-files` that both `.env.staging` and `.env.production` exist. Flag if one is missing entirely. Never read file contents — note in report that manual drift review is required | P1 |
| A8 | **Webhook URLs pointing to localhost/ngrok** — grep all config files and source (exclude `.env*`) for `localhost`, `127.0.0.1`, `ngrok.io`, `ngrok-free.app` in webhook/callback URL context | P0 |
| A9 | **Payment test mode in prod** — grep source and config files (not `.env*`) for payment test-mode keys hardcoded in source. Use gateway-specific test key prefixes for detected payment SDK (resolved same way as Step 13 gateway detection): Stripe `sk_test_`/`pk_test_`; Razorpay `rzp_test_`; PayPal sandbox client IDs; Paddle sandbox vendor ID; generic fallback: `sandbox`, `test_` prefixes. Flag if any test-mode key found hardcoded in source | P0 |

### Category 2 — Code Quality

| ID | Check | P-level |
|---|---|---|
| B1 | Debug statements in prod paths — use `debug_patterns` from Stack Profile (Step 1.5). Flag any match in auth/payment/API routes | P1 |
| B2 | `TODO`, `FIXME`, `HACK` in auth, payment, form handlers, API routes | P1 |
| B3 | 3+ consecutive commented lines in prod files | P2 |
| B4 | Exported functions/components with zero imports across codebase | P2 |
| B5 | Packages in `package.json`/`requirements.txt` never imported in source | P2 |
| B6 | `test@example.com`, `admin@admin`, `123456`, hardcoded user IDs, seed imports outside migrations | P1 |
| B7 | **Cyclomatic complexity** — flag functions/files with complexity >15. Use file size + nesting depth as proxy if no tool available | P1 |
| B8 | **Duplicate code blocks** — flag copy-pasted blocks >10 lines that appear 2+ times | P2 |
| B9 | **CHANGELOG.md** exists and version in `package.json`/`pyproject.toml` is bumped from last git tag | P2 |
| B10 | **Memory leak patterns** — `useEffect`/`onMounted` missing cleanup return, `addEventListener` without matching `removeEventListener`, `setInterval`/`setTimeout` without clear on unmount in component files | P1 |
| B11 | **Unhandled promise rejection** — grep async route handlers, service functions, and event listeners for missing error handling: `async` functions without `try/catch`, `.then(` without `.catch(`, `Promise.all(` without `.catch(`. Stack-agnostic: applies to JS/TS/Python async, Go goroutines missing error returns, Rust `.unwrap()` in non-test code | P1 |
| B12 | **API list endpoints missing pagination** — grep route handlers returning collections: `.findMany(` / `SELECT *` / `.filter(` / `.all(` / `GET /api/*s` without `limit`, `page`, `offset`, `cursor`, or `take` param. Flag unbounded queries that could return millions of rows | P1 |
| B13 | **Env var startup validation** — grep for `env_validation_pattern` from Stack Profile (Step 1.5). Flag if no startup validation found — missing vars cause silent runtime failures | P1 |
| B14 | **Zombie feature flags** — grep codebase for feature flag checks (`featureFlags.X`, `isEnabled(`, `FLAG_`, `FEATURE_`) hardcoded to `true` or `false` (not read from config/env). Flag any flag that's been permanently baked in — dead code path or always-active feature that bypasses its own toggle | P2 |
| B15 | **Hallucinated / non-existent packages** — cross-reference every package in `package.json`/`requirements.txt`/`Cargo.toml`/`go.mod` against the lockfile. Flag any package present in manifest but absent from lockfile. Causes: AI assistants invent plausible package names, typos, outdated tutorial copy-paste — all fail silently at runtime. If no lockfile found: skip B15 and rely on C20 (which flags absent lockfiles as a separate issue) | P0 |
| B16 | **Cross-platform npm scripts** *(only if `package.json` scripts found)* — grep `scripts` block for Unix-only commands: `rm -rf`, `cp -r`, `mkdir -p`, `&&` chaining, `export VAR=`, `touch `. Flag each — these silently break on Windows. Safe alternatives: `rimraf` (rm), `mkdirp` (mkdir), `cross-env` (env vars), `cpy-cli` (cp). Flag if none of these cross-platform libs are in deps but Unix commands are in scripts | P2 |

### Category 3 — Security

| ID | Check | P-level |
|---|---|---|
| C1 | User input passed directly to DB query (SQLi) or rendered as raw HTML (`dangerouslySetInnerHTML`, `innerHTML`, `v-html`) | P0 |
| C2 | Auth + sensitive endpoints missing rate limiting — use `auth_route_patterns` from Stack Profile (Step 1.5) to grep actual route definitions in codebase. Flag each matched route missing rate-limit middleware. Also flag contact form and payment endpoints | P0 |
| C3 | API routes returning full `err.stack` to client | P0 |
| C4 | Protected pages/endpoints missing auth middleware | P0 |
| C5 | Run the appropriate audit tool for detected stack: `npm audit` (JS/TS), `pip-audit` (Python), `cargo audit` (Rust), `govulncheck ./...` (Go) — flag high/critical CVEs with package name + CVE ID | P1 |
| C6 | Lock file not committed — use `lockfile` from Stack Profile (Step 1.5). Flag if manifest exists but corresponding lockfile is absent or gitignored | P1 |
| C7 | CORS wildcard `*` in prod API config | P1 |
| C8 | Webhook endpoints missing signature verification *(if billing SDK detected, skip — M2 covers this with gateway-specific verification patterns)* | P1 |
| C9 | Session/cookie config missing `httpOnly`, `secure`, `sameSite` | P1 |
| C10 | GPL/AGPL licensed packages in commercial codebase | P1 |
| C11 | `Content-Security-Policy` header set in middleware/nginx/config. Flag if missing. Flag if `default-src *` (too permissive). Check `object-src 'none'` and `upgrade-insecure-requests` present | P1 |
| C12 | `X-Frame-Options: DENY` or `SAMEORIGIN` set (or `frame-ancestors` in CSP) | P1 |
| C13 | `X-Content-Type-Options: nosniff` set | P1 |
| C14 | `Referrer-Policy` set — flag if `unsafe-url` or missing | P1 |
| C15 | `Permissions-Policy` header configured — camera, microphone, geolocation scoped to `(self)` or `()` | P2 |
| C16 | `Strict-Transport-Security` set with `max-age` ≥ 31536000, `includeSubDomains` | P1 |
| C17 | **CSRF protection** — state-changing endpoints (POST/PUT/DELETE/PATCH) use CSRF token middleware (use `security_middleware.csrf` from Stack Profile Step 1.5 for framework-specific name), OR cookies are `SameSite=Strict/Lax` as mitigation. Flag if neither present | P1 |
| C18 | **Server-side input validation** — validation lib present (Zod, Joi, Yup, Pydantic, class-validator, Valibot). Flag if only client-side validation exists — client validation is trivially bypassed | P1 |
| C19 | **Open redirect** — grep route handlers and middleware for unvalidated redirect targets: `res.redirect(req.query.`, `redirect(searchParams.get(`, `window.location = req.`, `Location: ${req.`. Flag any redirect whose destination comes from user input without an allowlist or same-origin check. Stack-agnostic: search all controller/route files | P0 |
| C20 | **Supply chain / lockfile integrity** — read lockfile (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock`, `go.sum`). Flag if: (a) any `resolved:` URL points outside the official registry (not `registry.npmjs.org`, `crates.io`, `proxy.golang.org`); (b) lockfile absent but manifest exists; (c) `.npmrc`/`.yarnrc` has private registry scope but no auth token placeholder — dependency confusion risk | P0 |
| C21 | **GraphQL security** *(only if GraphQL detected — `graphql`, `apollo-server`, `pothos`, `strawberry`, `gqlgen`, `juniper`, or `.graphql` files found)* — grep server config for: `introspection: true` without env-gate (disable in prod); no query depth/complexity limit lib (`graphql-depth-limit`, `graphql-query-complexity`, `envelop`); WebSocket subscriptions without `connectionParams` auth check. Each is a separate flag | P1 |
| C22 | **Password hashing algorithm** — grep auth/user code for hash function used. Flag if `md5(`, `sha1(`, `sha256(` used for passwords. Flag if only `bcrypt` with no `argon2`/`scrypt` alternative (bcrypt vulnerable at high cost factors). Stack-agnostic: grep crypto/hash imports in user/auth files | P0 |
| C23 | **TLS version config** — grep `nginx.conf`, `apache2.conf`, `ssl.conf`, `.htaccess`, any TLS/SSL config for `ssl_protocols` or `SSLProtocol`. Flag if TLS 1.0 or 1.1 allowed. Flag if TLS 1.3 not enabled. If no server config, check framework TLS settings | P1 |
| C24 | **CI/CD security scanning** — read `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/config.yml`, or any CI config found. Flag if no SAST tool (CodeQL, Semgrep, Bandit, gosec, Trivy, Snyk, Gitleaks). Flag if `npm audit`/`pip-audit`/`cargo audit` absent from pipeline | P1 |
| C25 | **Sensitive field encryption at rest** — grep DB schema/models for fields: `ssn`, `dob`, `card_number`, `bank_account`, `passport`, `tax_id`. Flag if present but no encryption decorator/column type (`@Encrypted`, `pgcrypto`, `attr_encrypted`, `vault`) applied | P1 |
| C26 | **Multi-tenant isolation** *(only if multi-tenant patterns detected — `tenantId`/`orgId`/`workspaceId` fields in schema)* — grep DB queries for missing tenant filter on shared tables. Check row-level security in migrations (`ENABLE ROW LEVEL SECURITY`, Prisma policy). Flag per-tenant rate limiting absent in middleware | P0 |
| C27 | **BOLA / IDOR** — grep API route handlers for resource lookups using user-supplied IDs: `findById(req.params.id)`, `getById(params.id)`, `WHERE id = $1` with param from request, `.findUnique({ where: { id } })`. Flag any that do NOT also filter by the authenticated user's ownership (`AND user_id = req.user.id`, `AND org_id = session.orgId`). Stack-agnostic: applies to REST, GraphQL resolvers, RPC handlers | P0 |
| C28 | **Mass assignment** — grep API handlers that pass `req.body` / `request.json()` directly to DB write: `Object.assign(record, req.body)`, `Model.update(req.body)`, `create(data: body)`, `**kwargs` in Python model constructors. Flag if no field whitelist / `pick()` / explicit schema parse before write — attacker can set `role: admin`, `isVerified: true` | P0 |
| C29 | **Source maps in production** — grep build config for sourcemap settings: `devtool: 'source-map'` in webpack prod config, `GENERATE_SOURCEMAP=true` in CRA env, `productionBrowserSourceMaps: true` in `next.config.*`, `sourcemap: true` in Vite/Rollup prod config. Flag if enabled — exposes full source code + secrets to anyone with DevTools | P1 |
| C30 | **Client-side env var leak** — grep client-entry files and frontend components for server-only env var names (`DATABASE_URL`, `SECRET_KEY`, `PRIVATE_KEY`, `JWT_SECRET`, `STRIPE_SECRET`) imported or referenced without `NEXT_PUBLIC_`/`VITE_`/`PUBLIC_` prefix. Also grep for server-only modules (`prisma`, `pg`, `mysql2`, `mongoose`, `redis`) imported in client component files (`'use client'`, `.client.ts`, `pages/*.tsx` without API route) | P0 |
| C31 | **Rate limiting coverage** — C2 covers auth endpoints; this checks ALL other endpoints. Grep every route definition file for routes missing rate-limit middleware: count routes with `limiter(` / `rateLimit(` / `@throttle` / `Throttle` decorator vs total routes. Flag if >20% of non-auth routes have no rate limit. Flag WebSocket connection handlers missing connection-count limits | P1 |

### Category 4 — Tests

| ID | Check | P-level |
|---|---|---|
| D1 | Run `test_command` from Stack Profile (Step 1.5) — report X passed / Y failed | P0 (if fail) |
| D2 | Test files cover: auth flow, form submission, payment (if applicable), API error states | P1 |
| D3 | `it.skip`, `xit`, `pytest.mark.skip` in critical path tests | P1 |
| D4 | **Missing E2E tests** — no Playwright, Cypress, Puppeteer, or Selenium found in deps or test config. Flag for user-facing apps with auth, checkout, or multi-step flows — unit tests alone cannot catch integration regressions | P1 |

### Category 5 — Build & Performance

| ID | Check | P-level |
|---|---|---|
| E1 | Run the detected build command (`npm run build`, `go build`, `python -m py_compile <entrypoint>`, etc.) — flag errors + deprecation warnings | P0 |
| E2 | *(only if TypeScript detected — `tsconfig.json` found or `.ts`/`.tsx` files present)* — `tsc --noEmit` — flag type errors. Flag `any` casts in auth/payment paths | P1 |
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
| E13 | **INP static proxy** — grep UI/component files for heavy synchronous work in event handlers: `onclick`/`addEventListener('click'`/`onKeyDown` containing DB calls, large loops, or blocking `while`/`for` without `requestAnimationFrame`. Flag any handler doing >1 synchronous operation before returning. Stack-agnostic: applies to any JS/TS/Vue/Svelte/template file | P1 |
| E14 | **CLS static proxy** — grep HTML/JSX/templates for dynamic content inserted above existing content without reserved space: ads/banners without fixed dimensions, `position: absolute` overlays with no container height, images without `width`+`height` (already E4 but flag here as CLS risk). Grep CSS for `height: auto` on above-the-fold containers | P1 |
| E15 | **Hydration mismatch patterns** *(only if SSR framework detected — Next.js, Nuxt, SvelteKit, Remix, Astro, Django/Jinja templates with JS hydration)* — grep components for patterns that cause server/client HTML mismatch: `Math.random()` / `Date.now()` / `new Date()` called outside `useEffect`/`onMounted`; `typeof window !== 'undefined'` checks inside render without `suppressHydrationWarning`; browser-only APIs (`localStorage`, `navigator`, `document`) called at module or render level. Each causes React/framework to discard SSR HTML and re-render client-side, breaking performance | P1 |

**Stack-specific build checks (dynamic — infer from Step 1 detection):**
Based on the framework/runtime detected, apply the most relevant framework-specific checks using judgement. Examples of what to look for per category — adapt to whatever stack is present:
- **Frontend frameworks**: check that prod build config doesn't expose sourcemaps, that image/asset handling is configured, and security headers are set
- **Backend frameworks**: check debug mode is off, CORS is configured, framework-specific security middleware is active
- **Compiled languages**: check that vet/lint passes and that tests use race detection if applicable
- **Any stack**: confirm prod config differs from dev config, no dev-only flags active in prod build scripts

### Category 6 — Reliability

| ID | Check | P-level |
|---|---|---|
| F1 | `.nvmrc` / `engines` in `package.json` / `runtime.txt` / `pyproject.toml` / `go.mod` specifies exact runtime | P1 |
| F2 | Top-level error boundary: `ErrorBoundary`, `+error.svelte`, Django 500 template, Go panic recover | P1 |
| F3 | **Error monitoring** — check if Sentry (`@sentry/`), Datadog (`dd-trace`), Bugsnag, Rollbar, or equivalent is present and initialised in app entry. Flag if completely absent. Flag if Sentry DSN is missing/placeholder. Flag if `Sentry.init()` is not env-gated (should not run in dev/test) | P1 |
| F4 | Server uses structured logger (Winston, Pino, `logging`, `slog`) not raw `console.log` | P2 |
| F5 | Unapplied DB migrations or edited applied migrations | P0 |
| F6 | *(only if package manifest with dev/prod dep separation detected)* — use `dev_only_deps` categories from Stack Profile (Step 1.5) to identify tools wrongly placed in production deps. Flag any that should not ship to prod | P1 |
| F7 | Server missing graceful shutdown handlers — use `shutdown_handler` pattern from Stack Profile (Step 1.5). Flag if pattern absent in server entry file | P1 |
| F8 | No `/health`, `/ping`, or `/status` endpoint | P2 |
| F9 | `build`, `start`, `test` scripts missing from `package.json` / `Makefile` / `pyproject.toml` | P1 |
| F10 | **Transactional email lib** — grep for email-send patterns (auth reset links, order receipts, notifications). If found but no transactional email lib (Resend, SendGrid, Postmark, Nodemailer, SES, Mailgun) in deps, flag as missing. If no email patterns found, skip | P1 |
| F11 | "From" address configured as branded domain — flag if `@gmail.com`, `@hotmail.com`, or `@yahoo.com` in email config | P1 |
| F12 | **DB connection pooling** — pool config present in DB client (`connection_limit` in Prisma, `pool` in pg/mysql2, `pool_size` in SQLAlchemy). Flag if new connection opened per request | P1 |
| F13 | **DB backup** — automated backup configured: platform backup enabled (Supabase, PlanetScale, RDS), backup script in cron/Makefile, or backup service documented in README | P1 |
| F14 | **Uptime monitoring** — Pingdom, Better Uptime, UptimeRobot, Checkly, or equivalent configured. Check for monitoring service config or reference in deploy docs | P2 |
| F15 | **Form delivery** — grep contact/lead/signup form handlers for actual email send or DB write on submit. Flag if handler has only `console.log`, `res.json({ ok: true })` with no downstream action, or catch block that silently swallows errors. Stack-agnostic: find POST route handlers for form endpoints and verify they call transactional email lib or DB write | P1 |
| F16 | **Webhook idempotency** *(only if non-billing webhook handler detected — GitHub, Twilio, or custom webhook routes. If billing SDK detected, skip — M3 covers payment webhook idempotency with gateway-specific event ID patterns)* — grep webhook handlers for idempotency key check: event ID stored in DB before processing, `processedEvents` table, Redis SET NX, or `idempotencyKey` lookup. Flag if absent — providers retry on timeout → duplicate processing. Also flag if handler does heavy sync work (>2s) without offloading to a queue | P0 |
| F17 | **DB foreign key indexes** *(only if relational DB detected — Postgres, MySQL, SQLite, SQL Server)* — grep migrations/schema files for foreign key columns (`REFERENCES`, `@relation`, `ForeignKey`). For each FK column, check if a corresponding index exists (`CREATE INDEX`, `@@index`, `index: true`). Flag unindexed FKs — cascade deletes and JOIN queries on unindexed FKs cause full-table scans that lock tables under load | P1 |
| F18 | **SPF / DKIM / DMARC config** *(only if transactional email detected — Resend, SendGrid, SES, Postmark, Mailgun, Nodemailer)* — grep email provider config/SDK init for: sending domain configured (not a free Gmail/Hotmail domain); DKIM signing enabled in provider config (`dkim: true`, `enableClick`, SDK init with domain). Flag if sending domain uses `@gmail.com` / `@hotmail.com` / `@yahoo.com` — these domains cannot have custom SPF/DKIM and will fail deliverability checks. Check README/docs for SPF/DKIM/DMARC setup instructions | P1 |
| F19 | **Global error handler** — grep app entry files for: Node.js → `process.on('uncaughtException'` and `process.on('unhandledRejection'`; Browser → `window.onerror` or `window.addEventListener('error'`. Flag if absent — errors that escape all `try/catch` crash the process silently with no log, no alert, no recovery. Sentry (F3) partially covers this but only after init succeeds; a code-level handler is a separate safety net that catches Sentry init failures too | P1 |

### Category 7 — Codebase Hygiene

| ID | Check | P-level |
|---|---|---|
| G1 | `<<<<<<<`, `=======`, `>>>>>>>` in any source file | P0 |
| G2 | Files >1MB outside `node_modules`/`.git` | P1 |
| G3 | `.gitignore` missing entries — use `gitignore_required` from Stack Profile (Step 1.5). Only flag entries relevant to detected stack | P1 |
| G4 | README missing setup / env vars / run locally / deploy steps, or has placeholder text | P2 |
| G5 | Linter errors or no linter configured — use `linter` from Stack Profile (Step 1.5). Run it, flag errors. Flag if no linter config file found | P1 |
| G6 | **OpenAPI/Swagger spec** — does `openapi.json`, `swagger.yaml`, or `/docs` route exist? If yes, spot-check 3 routes match actual implementation | P2 |
| G7 | Placeholder/lorem ipsum text — grep for `Lorem ipsum`, `Your Company Name`, `Acme Corp`, `placeholder@email.com`, `Coming soon`, `TODO:` in UI-facing source files (exclude tests, node_modules) | P1 |
| G8 | Custom 404 page exists — `pages/404.tsx`, `app/not-found.tsx`, `404.html`, or framework equivalent | P2 |
| G9 | Custom 500 / error page exists — `pages/500.tsx`, `app/error.tsx`, `500.html`, or framework equivalent | P2 |
| G10 | **Print stylesheet** — grep all CSS/style files for `@media print`. Flag if absent and app has content pages (articles, invoices, receipts, reports). Stack-agnostic: check any `.css`, `.scss`, `.sass`, styled-components global, or Tailwind `print:` utility usage | P2 |
| G11 | **Dark mode** *(only if dark mode claimed in README, config, or `prefers-color-scheme` detected anywhere)* — grep CSS/styles for `@media (prefers-color-scheme: dark)` or `class="dark"` + `dark:` Tailwind variants. Flag if dark mode UI exists but system preference media query is absent — dark mode that ignores OS setting is a UX regression | P2 |
| G12 | **i18n hardcoded strings** *(only if i18n lib detected — `i18next`, `react-intl`, `vue-i18n`, `gettext`, `babel`, `lingui`, `typesafe-i18n`, or locale files in `locales/` / `messages/` found)* — grep UI-facing component/template files for string literals that appear to be user-facing text but are not wrapped in translation calls (`t(`, `__()`, `_()`, `<Trans>`, `i18n.t(`). Also grep for `new Date().toLocaleDateString()` without locale param and hardcoded date format strings (`MM/DD/YYYY`, `DD-MM-YYYY`) outside i18n config | P1 |
| G13 | **Mobile responsiveness** — detect CSS approach from Step 1, then: **(a) Tailwind detected** (`tailwind.config.*` or `tailwindcss` in deps) → grep component/template files for responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`). Flag if zero responsive variant classes found across all UI files — layout likely broken on mobile. **(b) CSS/SCSS/SASS/styled-components/CSS Modules detected** → grep all style files for `@media` with `max-width` or `min-width`. Flag if absent in layout/page-level files. **(c) Both absent** → skip. Never flag for missing `@media` when Tailwind is the styling approach | P1 |

### Category 8 — Accessibility (JSX/HTML/templates in codebase — WCAG 2.2 AA)

All checks are static grep on source files. Stack-agnostic — applies to any templating language, component framework, or plain HTML.

| ID | Check | P-level |
|---|---|---|
| H1 | `<img>` tags missing `alt` attribute — grep all template/component files for `<img` without `alt=`. Flag with file + line | P1 |
| H2 | Interactive elements (`<div`, `<span`, `<a` without `href`) used with click/keyboard handlers but missing `role` and `tabIndex` — grep for `onClick`/`@click`/`v-on:click`/`ng-click` on non-interactive elements | P1 |
| H3 | Form `<input>` / `<select>` / `<textarea>` missing associated `<label>` or `aria-label` or `aria-labelledby` — grep component/template files | P1 |
| H4 | Color contrast — grep hardcoded hex/rgb in CSS/Tailwind/styled-components, flag common low-contrast combos (white on yellow, light grey on white, light blue on white) | P2 |
| H5 | Missing `<title>` in HTML templates / `metadata` export / `head()` in framework equivalent | P1 |
| H6 | `aria-hidden="true"` on focusable elements (`<button`, `<a`, `<input`, `tabIndex` ≥ 0) | P1 |
| H7 | **WCAG 2.2 — focus-visible** — grep CSS for `:focus { outline: none }` or `:focus { outline: 0 }` without a `:focus-visible` replacement. Removing focus ring without replacement fails WCAG 2.2 SC 2.4.11 | P1 |
| H8 | **WCAG 2.2 — keyboard trap** — grep for modal/dialog/drawer components. Flag if no `Escape` key handler, no focus trap library (`focus-trap`, `@radix-ui`, `headlessui`), or no `onKeyDown` managing Tab/Shift+Tab within the modal | P1 |
| H9 | **WCAG 2.2 — target size** — grep for interactive elements with explicit size set below 24×24px (`width: 16px`, `h-3 w-3`, `size-3` Tailwind) — minimum touch target per WCAG 2.2 SC 2.5.8 | P2 |

### Category 9 — Deploy Config

| ID | Check | P-level |
|---|---|---|
| I1a | **Dockerfile multi-stage build** *(if Dockerfile present)* — grep for `FROM ... AS` pattern. Single-stage builds ship dev deps, build tools, and source into prod image → bloated, slow, insecure. Flag if only one `FROM` line found with no `AS` alias | P1 |
| I1b | **Dockerfile non-root user** *(if Dockerfile present)* — grep for `USER` instruction. Running container as root = container escape can yield host root. Flag if no `USER` instruction or `USER root` found | P0 |
| I1c | **Dockerfile layer cache order** *(if Dockerfile present)* — `COPY package.json`+lockfile must come before `COPY . .`. Wrong order invalidates dep install cache on every code change → slow builds. Flag if `COPY . .` appears before package file copy | P1 |
| I1d | **Dockerfile CMD target** *(if Dockerfile present)* — `CMD` must not point to raw source (e.g. `CMD ["node", "src/index.js"]`). Should point to compiled output or use a process manager | P1 |
| I1e | **.dockerignore** *(if Dockerfile present)* — must exist and exclude `node_modules`, `.env*`, `.git`, `dist`. Missing = wrong-arch binaries or secrets in image | P1 |
| I2 | **vercel.json** *(if present)* — no hardcoded env vars, `functions` timeout reasonable, no dev routes exposed | P1 |
| I3 | **render.yaml / railway.json / fly.toml** *(if present)* — prod env set, health check path configured, no dev command in prod | P1 |
| I4 | Deploy config file exists at all — flag if no `Dockerfile`, `vercel.json`, `render.yaml`, `fly.toml`, or equivalent found (undocumented deploy = risky) | P2 |
| I5 | No dev-only environment variables (e.g. `DEBUG=true`, `LOG_LEVEL=verbose`) hardcoded in deploy config | P1 |
| I6 | **Nginx** *(only if `nginx.conf` / `sites-available/` found)* — `server_tokens off`, gzip enabled, SSL redirect configured, no `root /var/www/html` pointing to wrong dir, rate limiting on API routes (`limit_req_zone`) | P1 |
| I7 | **Nginx** *(if found)* — `proxy_pass` points to correct upstream (not `localhost:3000` if app runs on different port in prod), `proxy_set_header` includes `X-Real-IP` and `X-Forwarded-For` | P1 |
| I8 | **PM2 / Supervisor** *(if `ecosystem.config.js` or `supervisord.conf` found)* — `instances` set to `max` or explicit number, `autorestart: true`, log paths configured, `NODE_ENV=production` set | P1 |
| I9 | **Custom domain** — deploy config not using free platform subdomain in prod (`.vercel.app`, `.netlify.app`, `.railway.app`, `.fly.dev`, `.onrender.com`). Flag if no custom domain configured | P1 |

### Category 10 — SEO & Meta

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
| J11 | **Analytics & tracking integrations** — check presence and correct setup of each: **Google Analytics / GA4** (`gtag`, `@analytics/google-analytics`, measurement ID like `G-XXXXXXXX`), **Meta Pixel** (`fbq`, `_fbq`, pixel ID in config), **Microsoft Clarity** (`clarity("set"`, clarity project ID), **Plausible / Umami / PostHog / Mixpanel** (alternates). For each found: verify it is env-gated (`NODE_ENV === 'production'` or equivalent) — must NOT fire in dev/test. Flag any that are present but not env-gated. Flag if none of the above found at all (no analytics = no visibility post-launch) | P1 |
| J12 | **Google Consent Mode v2** *(only if GA4 or Google Ads detected)* — grep for `gtag('consent', 'default', {...})` called before any `gtag('config', ...)`. Check `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` params present. Flag if consent default is not set — required under DMA/GDPR enforcement (Google account suspension risk since July 2025) | P0 |
| J13 | **llms.txt** — `llms.txt` exists at root with structured site description, key URLs, and context for AI crawlers (ChatGPT, Claude, Perplexity). Also check `llms-full.txt` if content-heavy site | P2 |
| J14 | **Google Search Console** — GSC verification meta tag (`<meta name="google-site-verification">`) or `google*.html` file present | P2 |

### Category 11 — PWA & Service Worker *(only if intent detected — `manifest.json`, `sw.js`, next-pwa, workbox config found)*

| ID | Check | P-level |
|---|---|---|
| K1 | `manifest.json` or `site.webmanifest` present with `name`, `short_name`, `icons` array, `theme_color`, `background_color`, `display` | P1 |
| K2 | Service worker registered in app entry — `navigator.serviceWorker.register()` or framework equivalent (next-pwa, workbox) | P1 |
| K3 | Offline fallback page exists and is cached by service worker | P2 |
| K4 | Service worker does NOT intercept API routes or auth endpoints — would cause stale/cached login responses | P0 |
| K5 | Service worker versioned / cache busted on deploy — stale SW won't serve old assets | P1 |

### Category 12 — E-commerce Tracking *(only if e-commerce detected — payment lib, cart, product pages, `price`/`amount` fields in schema, or `checkout` routes found)*

All checks are static grep on source files. Stack-agnostic — applies to any framework, custom cart, or headless commerce setup.

#### GA4 E-commerce Events *(only if GA4 detected)*

| ID | Check | P-level |
|---|---|---|
| L1 | **`view_item`** — grep product page components/routes for `gtag('event', 'view_item'` or `dataLayer.push({ event: 'view_item'`. Flag if absent — without it, product funnel reports have no top-of-funnel data | P1 |
| L2 | **`add_to_cart`** — grep cart add handlers (button click, form submit) for `gtag('event', 'add_to_cart'`. Flag if absent or fired on cart-page load instead of button click (page load = double-counts on refresh) | P1 |
| L3 | **`begin_checkout`** — grep checkout entry route/component for `gtag('event', 'begin_checkout'`. Flag if absent | P1 |
| L4 | **`purchase`** — grep order confirmation route/component for `gtag('event', 'purchase'`. Flag if absent — missing = GA4 records zero revenue. Check `transaction_id` param present and unique (not hardcoded) — duplicate `transaction_id` inflates revenue on page refresh | P0 |
| L5 | **`items[]` array on all events** — every GA4 ecommerce event must pass an `items` array with product-level data. Grep each event call for `items: [` param. Flag any `view_item`, `add_to_cart`, `begin_checkout`, or `purchase` call missing `items` array — product reports return no data without it | P1 |
| L6 | **`add_shipping_info` / `add_payment_info`** — grep for these events in shipping and payment step components. Flag if absent — funnel drop-off between checkout steps becomes invisible in reports | P2 |

#### Meta Pixel E-commerce Events *(only if Meta Pixel detected)*

| ID | Check | P-level |
|---|---|---|
| L7 | **`ViewContent`** — grep product page components/routes for `fbq('track', 'ViewContent'`. Flag if absent — required for dynamic product ads retargeting | P1 |
| L8 | **`AddToCart`** — grep cart add handlers for `fbq('track', 'AddToCart'`. Check `content_ids`, `value`, `currency` params present — missing value/currency breaks revenue reporting and stops Meta algorithm from value-based optimisation. Flag if fired on cart page load instead of button click | P1 |
| L9 | **`InitiateCheckout`** — grep checkout entry for `fbq('track', 'InitiateCheckout'`. Flag if absent | P1 |
| L10 | **`Purchase`** — grep order confirmation for `fbq('track', 'Purchase'`. Flag if absent — zero revenue attribution in Meta Ads Manager. Check `value` and `currency` params required. If using Advantage+ catalog ads, also check `content_ids` or `contents` present | P0 |
| L11 | **`AddPaymentInfo`** — grep payment step for `fbq('track', 'AddPaymentInfo'`. Flag if absent | P2 |

#### General E-commerce *(any stack)*

| ID | Check | P-level |
|---|---|---|
| L12 | **Order confirmation deduplication** — grep thank-you/confirmation page for mechanism preventing duplicate event fires on refresh: session flag (`sessionStorage`), one-time token, or server-side sent check. Flag if `purchase`/`Purchase` event fires unconditionally on page load | P1 |
| L13 | **Server-side / CAPI fallback** — grep for Meta Conversions API (`/events` endpoint call) or GA4 Measurement Protocol. Flag if only client-side pixel with no server-side fallback — ad blockers suppress 30–60% of browser-side events | P1 |

---

### Category 13 — Billing & Subscription *(only if any payment/billing SDK detected in dependencies or source)*

**Gateway detection — do this first, dynamically:**

1. Grep `package.json` / `requirements.txt` / `Cargo.toml` / `go.mod` / `composer.json` for payment SDK names
2. Grep source for import patterns: `from 'stripe'`, `import razorpay`, `require('paypal')`, `use Cashier`, etc.
3. Identify the gateway(s) in use — examples (not exhaustive, detect whatever is present):
   - Stripe · Razorpay · PayPal · Paddle · LemonSqueezy · Chargebee · Braintree · Square · Adyen · Mollie · Cashfree · PayU · Paytm · Instamojo · PhonePe · Cashier (Laravel) · Billing (Rails) · any other

4. **For each detected gateway — resolve its webhook event names and API conventions:**
   - **Step A — Check for MCP tool first**: scan available MCP tools for the gateway name (e.g. `stripe` MCP, `razorpay` MCP). If found, use it to fetch webhook events and idempotency docs.
   - **Step B — If no MCP**: use `WebSearch` to search `"<gateway-name> webhook events list production required"` and `"<gateway-name> idempotency key API"`, then use `WebFetch` to read the official docs page and get the actual event names and patterns for that gateway.
   - **Never hardcode Stripe event names for a non-Stripe gateway.** Each gateway has its own event naming — Razorpay uses `payment.captured`, `subscription.charged`; PayPal uses `PAYMENT.CAPTURE.COMPLETED`; Paddle uses `subscription_payment_failed`, etc.

All checks below apply to **whichever gateway(s) detected**, using the correct event names resolved in Step 4 above.

| ID | Check | P-level |
|---|---|---|
| M1 | **Critical webhook events handled** — using gateway-specific event names from Step 4, grep webhook handler for: payment success event, subscription created/updated/cancelled event, payment failed event. Flag any missing — without these handlers app silently loses revenue and fails to provision/deprovision access | P0 |
| M2 | **Webhook signature verification** — grep webhook handler for gateway-specific signature check: Stripe `constructEvent`, Razorpay `validateWebhookSignature`, PayPal cert verification, Paddle `verifyWebhookSignature`, etc. Flag if raw payload processed without signature check — unauthenticated webhooks allow attackers to fake payment success | P0 |
| M3 | **Webhook idempotency** — grep webhook handler for event ID stored before processing (gateway-specific: Stripe `event.id`, Razorpay `payload.payment.entity.id`, PayPal `resource.id`). Check stored in DB or Redis before processing. Flag if absent — all gateways retry on timeout → duplicate fulfilment | P0 |
| M4 | **Failed payment / dunning handler** — grep for payment-failed webhook handler. Check it does at least one of: sends recovery email, marks subscription `past_due`/`suspended`, redirects to payment update. Flag if empty or missing — silent churn | P1 |
| M5 | **Subscription status server-side gate** — grep protected routes/middleware for subscription status check. Flag if paid features gated only client-side (UI hidden) with no backend enforcement | P0 |
| M6 | **Idempotency keys on payment API calls** — grep payment SDK create calls for idempotency key param (gateway-specific name — Stripe `idempotencyKey`, Razorpay `receipt`, PayPal `PayPal-Request-Id`). Flag if absent — network retry without idempotency = duplicate charge | P1 |
| M7 | **Plan limit server-side enforcement** — if usage limits per plan exist (seats, API calls, uploads), grep for backend limit check before resource creation. Flag if limit only in UI | P1 |
| M8 | **Test/sandbox keys in source** — grep source files outside test dirs for hardcoded test-mode keys using the gateway-specific patterns resolved in Step 4 above (same gateway, same key prefixes). Complements A9 which checks config files; M8 specifically targets source files excluding test dirs | P0 |
| M9 | **Webhook async processing** — grep webhook handler for sync heavy work (DB writes, email sends, external API calls) done inline before responding. Flag if handler doesn't respond `200` within ~5s and defer work to a queue (`Bull`, `Celery`, `Sidekiq`, `pg-boss`, background job). All gateways retry if no fast ack received | P1 |

---

### Category 14 — Legal & Compliance

| ID | Check | P-level |
|---|---|---|
| N1 | `/privacy-policy` or `/privacy` route/page exists | P1 |
| N2 | `/terms` or `/terms-of-service` route/page exists | P1 |
| N3 | Cookie consent / banner library present if analytics, tracking pixels, or ad scripts detected (GDPR/CCPA) | P1 |
| N4 | If payment processing detected — refund/cancellation policy page exists and is linked at checkout | P1 |
| N5 | Footer links to Privacy + Terms present in HTML layout | P2 |
| N6 | **GDPR — data export route** *(only if user accounts / auth detected)* — grep routes/controllers for an endpoint handling data export: `/export`, `/download-my-data`, `/gdpr/export`, `/account/export`, or equivalent. Flag if absent — GDPR Article 20 right to data portability | P1 |
| N7 | **GDPR — data deletion route** *(only if user accounts / auth detected)* — grep routes/controllers for account/data deletion: `/delete-account`, `/gdpr/delete`, `/account/erase`, `/user/delete`, or equivalent. Flag if absent — GDPR Article 17 right to erasure. Also check that deletion handler actually removes or anonymises DB records, not just sets `isDeleted: true` | P1 |

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
Score CAN go negative — no floor. A codebase with 15 P0s scores -50.
```

Report breakdown — use this exact visual format:

```
╔══════════════════════════════════════╗
║  PRELAUNCH SCORE:  74 / 100   🟡     ║
║  ██████████████████░░░░░░░  74%      ║
╚══════════════════════════════════════╝

  ❌ P0 Blockers :  1 issue   → -10 pts
  ⚠️  P1 Warnings :  4 issues  → -12 pts
  📝 P2 Notes    :  4 issues  →  -4 pts
  ✅ Passed      : 34 checks

  Verdict: NOT READY — fix 1 P0 blocker first
```

For negative scores, show bar as all empty and display raw negative number:
```
╔══════════════════════════════════════╗
║  PRELAUNCH SCORE:  -20 / 100  ☠️     ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░  -20%    ║
╚══════════════════════════════════════╝
```

Score → grade mapping:
| Score | Grade | Emoji | Verdict |
|---|---|---|---|
| 90–100 | Excellent | 🟢 | Ready to launch |
| 75–89  | Good      | 🟡 | Launch with P1 fixes queued |
| 50–74  | Needs work | 🟠 | Fix P1s before launch |
| 1–49   | Critical  | 🔴 | Not ready — blockers present |
| 0      | Blocked   | 🚨 | DO NOT LAUNCH |
| < 0    | Danger    | ☠️ | Severely broken — major rework needed |

Fill bar: each `█` = 4 pts. 25 blocks total. Empty blocks = `░`. Negative score = all 25 blocks empty.

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
- I1a–I1e — Dockerfile checks (no Dockerfile detected)

## 🔍 Custom Checks
> "check if Razorpay webhook is verified"
- [ ] Webhook endpoint at `api/payment/webhook.ts` missing `razorpay.webhooks.verify()` call · P1

---

**Verdict**: NOT READY — fix 2 P0 blockers first
**Re-run**: `/goshipit` after fixes to see updated score
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

## Step 9 — Package Update Check

After all category checks, scan for outdated dependencies:

1. **Detect package manager** from Step 1 (npm/yarn/pnpm/pip/cargo/go mod)
2. **Resolve latest version — in this order:**
   - **Step A — Check local MCP first**: scan available MCP tools for a matching package manager tool (e.g. npm MCP, pip MCP, cargo MCP). If found, use it to fetch latest version.
   - **Step B — If no MCP available**: use `WebSearch` to find the registry page, then `WebFetch` to read it and confirm the exact version string and its release date (npmjs.com / PyPI / crates.io / pkg.go.dev as appropriate).
   - **Step C — Confirm version exists**: regardless of source (MCP or web), must verify the version actually exists on the official registry before suggesting it. Never hallucinate a version.
3. **List outdated packages**: `npm outdated`, `pip list --outdated`, `cargo outdated`, `go list -m -u all`
4. **Filter — only recommend updates where**:
   - The latest version was released **more than 30 days ago** (stability filter — avoid fresh releases with undiscovered bugs)
   - Version confirmed to exist via MCP or web search (Step 2C above)
5. **Report outdated packages** in report under "Package Updates" section with: current → recommended version, release date, and link to changelog if available
6. **Major version bumps** — if update crosses a major version boundary (e.g. `v2.x → v3.x`), flag separately as `⚠️ BREAKING`. Do NOT auto-suggest as a safe update — major versions contain breaking API changes. Note: "check changelog before upgrading"

**What NOT to do:**
- Do NOT suggest a version released <30 days ago
- Do NOT suggest a version without verifying it exists
- Do NOT run `npm install` / `pip install` / any install command — report only
- Do NOT treat major version bumps as routine updates

---

## Step 10 — Final Build Verification (mandatory)

**Always run this as the last step, regardless of category selection.**

Run the production build using `build_command` from Stack Profile (Step 1.5). If the field was unresolvable, check `Makefile` for a `build` target or `package.json` `scripts.build` as fallback. If no build command found for the stack, mark `⏭️ SKIP (no build command detected)` in report and do not error.

Report result:
- `✅ Build passed` — note any warnings
- `❌ Build failed` — show first error, deduct 10pts from score (P0)

---

## Step 11 — DESIGN.md Generation (optional)

After Step 10, ask the user:

**Question** — `multiSelect: false`
- header: `DESIGN.md`
- question: `Generate a DESIGN.md (Google design.md spec) for your project?`
- options:
  - label: `Yes, generate` — description: `Inspect codebase, extract design tokens and brand rationale, write DESIGN.md`
  - label: `Skip` — description: `Skip design system generation`

If user picks `Skip` → end session silently.

If user picks `Yes, generate` → run the steps below.

### How to generate DESIGN.md

Spec reference: Google design.md alpha — https://github.com/google-labs-code/design.md + https://stitch.withgoogle.com/docs/design-md/specification

**1 — Inspect codebase for design signals**

Scan these sources in order (read files, do NOT hardcode or invent values):

| Source | Extract |
|---|---|
| `tailwind.config.*` | `theme.colors`, `theme.fontFamily`, `theme.fontSize`, `theme.spacing`, `theme.borderRadius`, `theme.boxShadow`, `theme.transitionDuration` |
| `tokens.json` / `design-tokens.json` / `tokens/*.json` | All W3C DTCG token values — colors, typography, spacing, shadow, motion |
| `globals.css` / `app.css` / `index.css` / `styles.css` | CSS custom properties: `--color-*`, `--font-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--duration-*`, `--ease-*` |
| `theme.ts` / `theme.js` / `src/theme/*` | Color/typography/spacing/shadow/motion objects |
| `package.json` deps | Design system libs (`@mui/material`, `@chakra-ui/react`, `shadcn/ui`, `mantine`, `radix-ui`) → read their theme override files |
| `design/` dir / Figma exports | Read any token JSON or CSS exports present |
| `*.css` / component files | Grep for repeated hex values, font-family strings, px/rem values, box-shadow values, transition durations |

If zero signals found anywhere: note `DESIGN.md skipped — no design tokens or brand signals found in codebase.` and stop.

**2 — Resolve brand personality**

Read `README.md`, `package.json` description, landing page / `about` components, marketing copy files. Extract: product name, tagline, target audience, brand voice (playful vs professional, dense vs spacious, modern vs classic).

**3 — Write DESIGN.md using Google/Stitch design.md spec (alpha)**

Create `DESIGN.md` at project root. Full token type set per Stitch spec:

```markdown
---
version: alpha
name: {product name}
description: {one-line brand description}
colors:
  primary: "{hex}"           # main brand color — CTAs, links, key UI
  secondary: "{hex}"         # supporting color — borders, captions, metadata
  tertiary: "{hex}"          # accent — highlights, badges (include only if found)
  neutral: "{hex}"           # page/surface background (include only if found)
  success: "{hex}"           # include only if found
  warning: "{hex}"           # include only if found
  error: "{hex}"             # include only if found
  # add any other semantic color tokens found
typography:
  h1:                        # use semantic names: h1-h6, body-sm/md/lg, label-sm/md, caption, code
    fontFamily: {family}
    fontSize: {value}px
    fontWeight: {number}     # must be number: 300/400/500/600/700/800/900
    lineHeight: {value}      # unitless multiplier (e.g. 1.2) or px/rem
    letterSpacing: {value}   # em or px — include only if found
    fontFeature: {string}    # CSS font-feature-settings — include only if found
  # repeat for each detected level
rounded:
  xs: {value}px              # include only scales that exist — xs/sm/md/lg/xl/full
  sm: {value}px
  md: {value}px
  lg: {value}px
  full: 9999px               # include only if pill/full-radius pattern found
spacing:
  xs: {value}px              # include only scales that exist — xs/sm/md/lg/xl/2xl
  sm: {value}px
  md: {value}px
  lg: {value}px
shadows:                     # NEW — include if box-shadow tokens found
  sm: "{css box-shadow value}"
  md: "{css box-shadow value}"
  lg: "{css box-shadow value}"
motion:                      # NEW — include if transition/animation tokens found
  duration-fast: {value}ms
  duration-base: {value}ms
  duration-slow: {value}ms
  easing-default: "{css easing fn}"   # e.g. cubic-bezier(0.4, 0, 0.2, 1)
  easing-enter: "{css easing fn}"
  easing-exit: "{css easing fn}"
components:                  # include only if component-level tokens found
  button-primary:
    backgroundColor: "{colors.primary}"   # use {path.to.token} reference syntax
    textColor: "#ffffff"
    borderRadius: "{rounded.md}"
    typography: "{typography.label-md}"   # reference composite token
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
  card:
    backgroundColor: "{colors.neutral}"
    borderRadius: "{rounded.lg}"
    shadow: "{shadows.md}"
  # add other components only if tokens found — input, badge, nav, modal, etc.
omitted:                     # list sections intentionally absent — suppresses linter warnings
  - section: shadows
    reason: "No shadow tokens found in codebase"
  - section: motion
    reason: "No transition/animation tokens defined"
---

## Overview

{Brand personality, target audience, emotional intent — what should the UI feel like? 3-5 sentences. Use descriptive language: "Architectural Minimalism meets Journalistic Gravitas" not "clean and modern".}

## Colors

{Describe each color's semantic role. Use evocative names alongside hex.}

- **Primary ({hex}):** {role — e.g. "Deep ink for headlines and core UI actions"}
- **Secondary ({hex}):** {role}
- ...

## Typography

{Type strategy — which fonts, why, hierarchy rationale.}

- **{token-name}:** {family, size, weight} — {intended use}
- ...

## Layout

{Spacing scale rationale, grid system, max container widths, breakpoints if found.}

## Elevation & Depth

{Only if shadows found. Describe shadow scale and when each level is used — cards, modals, dropdowns.}

## Shapes

{Border-radius scale and when each level applies — buttons, cards, inputs, badges.}

## Components

{Only if component tokens found. Describe visual rules for each component — when to use which variant, interaction states.}

## Do's and Don'ts

**Do:**
- {concrete rule based on actual tokens found}

**Don't:**
- {concrete rule — e.g. "Don't use tertiary on backgrounds smaller than 44px — contrast ratio drops below WCAG AA"}
```

**Rules — strictly enforced:**
- YAML values only from codebase — no invented or guessed values. Missing token = omit + add to `omitted`
- `{path.to.token}` reference syntax in `components` must point to a token defined elsewhere in the same file
- `fontWeight` must be a number (400, not "bold")
- All hex values must be valid CSS colors (hex, rgb(), hsl(), oklch() all valid)
- Section order: Overview → Colors → Typography → Layout → Elevation & Depth → Shapes → Components → Do's and Don'ts
- `omitted` entries suppress linter warnings — always include sections that were inspected but not found
- Prose sections must describe *why*, not just *what* — agents need rationale to make decisions in underdefined cases
- Do NOT write placeholder text like `{role description}` in the final file — every line must contain real data

**After writing:** `DESIGN.md written — {N} color tokens, {M} typography levels, {K} shadows, {J} motion tokens, {L} component tokens.`

---

## Constraints

- Read files + non-destructive commands only (`npm audit`, `tsc --noEmit`, `npm run build`, `go build`, `git ls-files`, `git log`)
- Do NOT run: `npm install`, `git push`, migrations, or any write operations
- **NEVER read `.env`, `.env.local`, `.env.production`, `.env.example`, or any `.env*` file** — check existence only via `git ls-files` or `ls`. Do not open or cat these files under any circumstances.
- Skip checks irrelevant to detected stack (mark ⏭️ SKIP in report)
- Monorepo: run checks per app/package, combine into one report — final score = lowest workspace score
- If a check tool is unavailable (e.g. `pip-audit` not installed), note it and skip — don't error
