---
name: goshipit
description: >
    Pre-launch codebase audit skill. Use this whenever someone is about to ship,
    deploy, launch, push to main/prod, or merge a release - even without "goshipit"
    explicitly. Trigger on: "is my app ready?", "can I deploy now?",
    "pre-deploy check", "review before launch", "is this production-ready?",
    "check my codebase", "launch checklist", "ready to go live?",
    "audit before deploy", "is my project ship-ready?", "should I merge to main?",
    "am I missing anything before launch?", "what could break in production?".
    Runs 188 checks across secrets, security, code quality, tests,
    build/performance, reliability, accessibility, deploy config, SEO, PWA,
    and legal compliance. Dynamically detects the stack - no hardcoded framework
    lists. Saves prelaunch-report.md with check IDs and code refs.
    Severity-weighted score out of 100. No live URL needed - codebase only.
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
    - mcp__context7__resolve-library-id
    - mcp__context7__query-docs
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
    version: 0.1.2
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

Pre-launch codebase audit. 188 checks. Stack-aware, severity-weighted, saves prelaunch-report.md. No live URL needed.
Install: `npx goshipit` | Repo: https://github.com/Capta1nRaj/goshipit

## Step 1 - Stack Detection (auto, fully dynamic)

Do NOT hardcode stacks. Read project files and infer:

1. List root + one level deep
2. Read `package.json` - deps, devDeps, scripts
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

## Step 1.5 - Stack Intelligence Resolution

Resolve framework-specific knowledge **once** before checks → builds **Stack Profile** used by all Step 3 checks.

**Resolution order per detected technology:**

1. **context7 MCP first** - if `mcp__context7__resolve-library-id` is available: call it with the technology name + "production security checklist". Then call `mcp__context7__query-docs` with the returned library ID and the question "production security best practices". Use the result to populate Stack Profile fields.
2. **WebSearch + WebFetch** - if context7 unavailable or returns no results: search `"[technology] production security checklist site:docs.[technology].dev OR site:github.com"`, fetch the top official page.
3. **Built-in knowledge** - baseline always; MCP/web overrides where they provide newer information.

**Stack Profile fields:**

| Field                    | What to resolve                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `debug_patterns`         | Framework debug statements forbidden in prod source                                                                                                                                                                     |
| `test_command`           | Exact test command for stack + pkg manager                                                                                                                                                                              |
| `lockfile`               | Lockfile produced by detected pkg manager                                                                                                                                                                               |
| `linter`                 | Idiomatic linter + config filename                                                                                                                                                                                      |
| `shutdown_handler`       | SIGTERM/SIGINT graceful shutdown pattern                                                                                                                                                                                |
| `env_validation_pattern` | Startup env var validation pattern                                                                                                                                                                                      |
| `auth_route_patterns`    | Auth endpoint naming conventions                                                                                                                                                                                        |
| `dev_only_deps`          | Tool categories not to ship in prod deps                                                                                                                                                                                |
| `gitignore_required`     | Build artifacts, caches, IDE files, secrets for stack                                                                                                                                                                   |
| `build_command`          | Full prod build command                                                                                                                                                                                                 |
| `security_middleware`    | CSRF, rate-limit, session middleware idioms                                                                                                                                                                             |
| `edge_runtime_files`     | Files on edge runtime (Next.js `middleware.ts`, Vercel Edge Fns, CF Workers) - Node.js-only rate-limit libs (`express-rate-limit`, `ioredis`, `node:*`) crash here; use `@upstash/ratelimit` + `@upstash/redis` instead |

**Output:** Print Stack Profile before category picker. Mark each field source: `[MCP]`, `[web]`, or `[inferred]`.

---

## Step 2 - Category Picker (AskUserQuestion)

Use `AskUserQuestion` tool - do NOT show text menu.

**Q0 - MONOREPO ONLY** _(only if `turbo.json`, `nx.json`, `pnpm-workspace.yaml`, or `packages/`+`apps/` found)_
`multiSelect: true` · header: `Monorepo Scope` · question: `Monorepo detected. Which workspaces to audit?`
Options: list all detected workspaces + `All workspaces`. Score = lowest workspace.

**Q1** `multiSelect: true` · header: `Audit Areas` · question: `Which areas to audit?`

- `All areas` - full audit (recommended)
- `Secrets & Security` - keys, .env, validation, rate limiting, CVEs, CORS, cookies, CSP, HSTS
- `Code Quality & Tests` - debug logs, TODOs, dead code, unused deps, tests, coverage, E2E
- `Build & Performance` - bundle, types, N+1, render-blocking, images, cache, compression, SW
- `Reliability, Hygiene, Deploy & SEO` - errors, logging, migrations, .gitignore, README, Nginx, Docker, Vercel, SEO, legal

**Q2** `multiSelect: false` · header: `Accessibility` · question: `Include accessibility checks?`

- `Yes, include` - scans .tsx .jsx .vue .html for alt, ARIA, labels
- `Skip`

**Q3** `multiSelect: false` · header: `Fix Mode` · question: `How to handle issues?`

- `Audit only` - find + report, you fix manually
- `Audit + auto-fix` - offer safe fixes with diff preview

**Q4 - DESIGN.md** _(only if `DESIGN.md` does NOT exist at project root)_
`multiSelect: false` · header: `DESIGN.md` · question: `Generate a DESIGN.md (Google design.md spec) after audit?`

- `Yes, generate` - after audit completes, inspect codebase and write DESIGN.md
- `Skip` - skip design system generation

If `DESIGN.md` already exists at project root → skip Q4 entirely, skip Step 11.

**Mapping:**

- Q1 `All areas` → cats A–N (+ K/L/M auto when detected)
- `Secrets & Security` → A, C
- `Code Quality & Tests` → B, D
- `Build & Performance` → E
- `Reliability, Hygiene, Deploy & SEO` → F, G, I, J, N
- All 4 specific selected → same as `All areas`
- Cat K (PWA) **auto-runs** if `manifest.json`, `sw.js`, `next-pwa`, or workbox detected
- Cat L (E-commerce) **auto-runs** if payment lib, cart routes, product schema, or checkout detected
- Cat M (Billing) **auto-runs** if any payment/billing SDK in deps or source
- Cat N (Legal) **always runs**
- Step 9 **always runs** - Step 10 (build) is optional, user is asked before running
- Q2 `Yes` → also cat H
- Q3 `Audit + auto-fix` → Step 7 triage can auto-apply safe fixes (Step 8 reference)
- `Other` typed → treat as custom check

---

## Step 3 - Parallel Sub-Agent Dispatch

Spawn one sub-agent per selected category simultaneously (`run_in_background: true`). All parallel. Aggregate after all complete.

### Sub-agent briefing template

```
COMMUNICATION MODE: caveman ultra.
Drop articles, filler, pleasantries, hedging. Fragments OK. State each fact once. NO prose abbreviations. Code symbols/fn names/error strings: never touch. No tool-call narration.

You are a prelaunch audit sub-agent.

Working dir: {CWD}
Stack Profile: {STACK_PROFILE}

Run every check in the table below. For each:
- Use Read/Grep/Bash/Glob as needed.
- NEVER open, cat, or read any .env* file, .pem, .key, id_rsa, credentials.json, or secret file.
- Checks marked "(only if X)" - verify condition first. If condition not met, status: SKIP, reason: "stack N/A".
- Return ONLY a valid JSON array - no prose, no markdown, no code fences. If you cannot complete a check, still include it with status: "SKIP" and reason.

[
  {
    "id": "A1",
    "status": "FAIL",
    "severity": "P0",
    "evidence": "found sk_live_xxx in src/config.js:12",
    "fix": "move to env var, never commit"
  },
  {
    "id": "A2",
    "status": "PASS",
    "severity": "P0",
    "evidence": ".env not tracked in git",
    "fix": ""
  }
]

Status values:
- PASS - checked, no issue found
- FAIL - issue confirmed, include file:line in evidence
- SKIP - stack not applicable (state why) or tool unavailable (state tool name)

Category: {CATEGORY_NAME}
Reference file: {REFERENCE_FILE_PATH}
Read that file now - it contains every check definition for this category.
Do NOT read reference files for other categories.
```

**How to fill `{REFERENCE_FILE_PATH}` when dispatching:**
Look up the category in the reference directory table below. Determine the absolute path by taking the directory that contains this SKILL.md file and appending `references/<filename>`. Do NOT hardcode `~/.claude/skills/goshipit/` - derive it from SKILL.md's actual location at runtime. Pass the resolved absolute path - the sub-agent will Read it to get its checks.

### Dispatch rules

Single message, all agents simultaneously:

| Selected area                        | Agents for categories                                     |
| ------------------------------------ | --------------------------------------------------------- |
| `All areas`                          | A, B, C, D, E, F, G, H (if Q2=Yes), I, J, N + auto: K/L/M |
| `Secrets & Security`                 | A, C                                                      |
| `Code Quality & Tests`               | B, D                                                      |
| `Build & Performance`                | E                                                         |
| `Reliability, Hygiene, Deploy & SEO` | F, G, I, J, N                                             |
| Accessibility (Q2=Yes)               | H                                                         |
| PWA auto                             | K                                                         |
| E-commerce auto                      | L                                                         |
| Billing auto                         | M                                                         |

Cat N + Steps 9+10 always spawn. Agent error → mark all its checks `SKIP (agent error - re-run manually)` with no score impact, continue aggregation.

---

## Step 3 - Category Reference Directory

Check definitions live in `references/` alongside this SKILL.md - one file per category. Sub-agents read only their assigned file. The checks themselves are identical to before; they're just no longer embedded in this file.

**Resolve path:** `{SKILL_DIR}/references/{filename}` where SKILL_DIR is the directory containing this SKILL.md. Derive SKILL_DIR at runtime - do NOT hardcode.

| Cat | #   | Name                   | Reference file              | Auto-runs when                                      |
| --- | --- | ---------------------- | --------------------------- | --------------------------------------------------- |
| A   | 1   | Secrets & Environment  | `checks-a-secrets.md`       | always                                              |
| B   | 2   | Code Quality           | `checks-b-quality.md`       | always                                              |
| C   | 3   | Security               | `checks-c-security.md`      | always                                              |
| D   | 4   | Tests                  | `checks-d-tests.md`         | always                                              |
| E   | 5   | Build & Performance    | `checks-e-build.md`         | always                                              |
| F   | 6   | Reliability            | `checks-f-reliability.md`   | always                                              |
| G   | 7   | Codebase Hygiene       | `checks-g-hygiene.md`       | always                                              |
| H   | 8   | Accessibility          | `checks-h-accessibility.md` | Q2 = Yes                                            |
| I   | 9   | Deploy Config          | `checks-i-deploy.md`        | always                                              |
| J   | 10  | SEO & Meta             | `checks-j-seo.md`           | always                                              |
| K   | 11  | PWA & Service Worker   | `checks-k-pwa.md`           | manifest.json / sw.js / next-pwa / workbox detected |
| L   | 12  | E-commerce Tracking    | `checks-l-ecommerce.md`     | payment lib / cart routes / checkout detected       |
| M   | 13  | Billing & Subscription | `checks-m-billing.md`       | payment/billing SDK in deps or source               |
| N   | 14  | Legal & Compliance     | `checks-n-legal.md`         | always                                              |

---

## Step 4 - Custom Checks

If user typed "Other" on any question, run it as a free-form check using judgement. Include findings under "Custom Checks" in report. No "Other" → skip silently.

---

## Step 5 - Severity-Weighted Score

```
Start: 100
P0 issue: −10 pts
P1 issue: −3 pts
P2 issue: −1 pt
No floor - can go negative.
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
│   ⏭️   Skipped        3   (stack N/A)           │
│                                                 │
│   VERDICT: NOT READY - fix 1 P0 blocker first   │
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
│   VERDICT: SEVERELY BROKEN - major rework       │
└─────────────────────────────────────────────────┘
```

| Score  | Emoji | Verdict                        |
| ------ | ----- | ------------------------------ |
| 90–100 | 🟢    | Ready to launch                |
| 75–89  | 🟡    | Launch with P1 fixes queued    |
| 50–74  | 🟠    | Fix P1s before launch          |
| 1–49   | 🔴    | Not ready - blockers present   |
| 0      | 🚨    | DO NOT LAUNCH                  |
| < 0    | ☠️    | Severely broken - major rework |

Fill bar: `█` = 3.125 pts. 32 blocks. Empty = `░`. Score ≤ 0 → all 32 empty, show actual negative number and percentage (e.g. `-5 / 100  -5%`).

---

## Step 6 - Save Report

### `prelaunch-report.md`

```markdown
# Prelaunch Report

**Date**: YYYY-MM-DD
**Stack**: Next.js 16 · TypeScript · Prisma · Vercel
**Categories**: All
**Score**: 74/100 (P0: 1 · P1: 4 · P2: 4)

---

## ❌ P0 Blockers - fix before any deploy

- [ ] **A2** - `.env` tracked in git
      → `git rm --cached .env && echo ".env" >> .gitignore`

- [ ] **C1** - Raw user input in DB query · `src/api/users.ts:34`
      → Use parameterised query / Prisma `where: { id: userId }`

## ⚠️ P1 Warnings - fix within 24h

- [ ] **C7** - CORS wildcard `*` in `api/cors.ts:12`
- [ ] **E3** - Bundle 380kb (limit 300kb) → lazy-load chart.js
- [ ] **E8** - N+1 query in `src/lib/posts.ts:67` - `.find()` inside `.map()`
- [ ] **H1** - 3 `<img>` tags missing `alt` in `components/Gallery.tsx`

## 📝 P2 Notes - polish before launch

- [ ] **B9** - CHANGELOG.md missing
- [ ] **G6** - No OpenAPI spec found

## ✅ Passed (34 checks)

- A1 - No hardcoded secrets
- A6 - Git history clean
- C5 - No CVEs found
- D1 - 42/42 tests passing
- [...]

## ⏭️ Skipped (stack N/A)

- I1a–I1e - Dockerfile checks (no Dockerfile detected)

## 🔍 Custom Checks

> "check if Razorpay webhook is verified"

- [ ] Webhook endpoint at `api/payment/webhook.ts` missing `razorpay.webhooks.verify()` call · P1

---

**Verdict**: NOT READY - fix 2 P0 blockers first
```

---

## Step 7 - Issue Triage (AskUserQuestion)

After score shown + report saved, ask user what to fix now:

**Q1** `multiSelect: true` · header: `Fix Now` · question: `Which issues do you want to fix right now? (select any, or skip to fix manually)`

Options - dynamically list every FAIL from the report as a selectable item, grouped:

- Each P0: `❌ A2 - .env tracked in git`
- Each P1: `⚠️ C7 - CORS wildcard * in api/cors.ts:12`
- Each P2: `📝 B9 - CHANGELOG.md missing`
- Always include: `Skip - I'll fix manually using the report`

If user picks `Skip` → end session (Step 9+ still run).

If user picks any issues:

- For each selected issue, attempt to fix it:
    - If auto-fixable (see Step 8 safe-fix list) → apply fix, show diff, confirm before touching
    - If NOT auto-fixable (requires human judgement - SQLi, auth, N+1, CORS logic, CVEs) → explain what needs to change and exactly where in the code, with a concrete code snippet showing the fix. Do NOT modify the file.
- After all selected issues handled → update report checkboxes for fixed items

---

## Step 8 - Auto-fix Reference

Used by Step 7 to determine if a selected issue can be auto-applied or needs human guidance.

Show diff before applying any fix:

```
Fix A2 - .gitignore
+ .env
+ .env.local
Applying... ✅ Done
```

### Auto-fixable (apply directly):

| Issue                           | Fix                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| A2 - `.env` in git              | Add `.env*` to `.gitignore`                                                            |
| E6 - render-blocking script     | Add `defer` to `<script>`                                                              |
| E4 - `<img>` missing dims       | Add `width`+`height` if detectable from context                                        |
| E5 - missing `font-display`     | Add `font-display: swap` to `@font-face`                                               |
| H1 - `<img>` missing `alt`      | Add `alt=""` for decorative; flag for human if content image                           |
| H7 - `:focus { outline: none }` | Append `:focus-visible { outline: 2px solid currentColor; outline-offset: 2px }`       |
| B1 - `console.log` in prod path | Remove line (show diff + confirm before delete)                                        |
| B17 - missing TS `strict`       | Add `"strict": true` to `tsconfig.json` `compilerOptions`                              |
| G3 - `.gitignore` incomplete    | Append missing entries from `gitignore_required` Stack Profile field                   |
| G1 - merge conflict markers     | Show file:line, do NOT auto-resolve - flag for human                                   |
| J7 - `<html>` missing `lang`    | Add `lang="en"` (or detected locale) to root `<html>` tag                              |
| J10 - missing viewport meta     | Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to `<head>` |
| F9 - missing npm scripts        | Add stub `"test": "echo 'no tests'"` / `"start": "node dist/index.js"` if missing      |
| E5 - `@import url()` in CSS     | Warn only - moving to `<link>` requires HTML change, flag for human                    |

### Auto-fix will NOT touch:

SQL injection, missing auth middleware, N+1 queries, CORS config, bundle size, CVEs, any fix where correct value is uncertain.

---

## Step 9 - Package Update Check

1. Detect pkg manager from Step 1.
2. Run the native outdated command - it fetches latest from the registry directly:
    - `npm outdated --json` / `yarn outdated` / `pnpm outdated`
    - `pip list --outdated` / `cargo outdated` / `go list -m -u all`
3. Parse output. For each outdated package:
    - If **major bump** (v2→v3): flag `⚠️ BREAKING`, do NOT auto-suggest upgrade, note "check changelog before updating".
    - If **minor/patch AND current version is ≥30 days old** (estimate from version gap): suggest update, include changelog URL if known.
4. For packages where you cannot determine release date from the command output alone - use WebFetch on the registry page (npmjs.com/PyPI/crates.io) to confirm date before recommending.
5. Report: current → recommended, estimated release age, changelog link.

**Never:** suggest a version you cannot confirm from registry output or a registry page. Never run install/update commands. Never treat major version bumps as routine patches.

---

## Step 10 - Final Build Verification (optional)

Ask user before running:

`multiSelect: false` · header: `Build Check` · question: `Run a production build to verify no compile errors?`

- `Yes, run build` - runs build command, flags errors as P0
- `Skip` - skip build check, note in report

If `Yes`: run `build_command` from Stack Profile. Fallback: `Makefile` build target or `package.json scripts.build`. No build command found → `⏭️ SKIP (no build command detected)`.

Result:

- `✅ Build passed` - note warnings
- `❌ Build failed` - show first error, −10 pts (P0)
- `⏭️ Skipped` - user opted out, no score impact

---

## Step 11 - DESIGN.md Generation (optional)

Run only if user picked `Yes, generate` in Q4 (Step 2). If Q4 was skipped (DESIGN.md already exists) or user picked `Skip` → end session silently.

### How to generate DESIGN.md

Spec: https://github.com/google-labs-code/design.md + https://stitch.withgoogle.com/docs/design-md/specification

**1 - Inspect codebase for design signals:**

| Source                                             | Extract                                                                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `tailwind.config.*`                                | `theme.colors`, `fontFamily`, `fontSize`, `spacing`, `borderRadius`, `boxShadow`, `transitionDuration`                |
| `tokens.json`/`design-tokens.json`/`tokens/*.json` | All W3C DTCG token values                                                                                             |
| `globals.css`/`app.css`/`index.css`/`styles.css`   | CSS custom properties: `--color-*`, `--font-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--duration-*`, `--ease-*` |
| `theme.ts`/`theme.js`/`src/theme/*`                | Color/typography/spacing/shadow/motion objects                                                                        |
| `package.json` deps                                | Design system libs (`@mui/material`, `@chakra-ui/react`, `shadcn/ui`) → read theme override files                     |
| `design/` dir / Figma exports                      | Token JSON or CSS exports                                                                                             |
| `*.css` / components                               | Repeated hex values, font-family strings, px/rem values, box-shadow, transition durations                             |

Zero signals found → note `DESIGN.md skipped - no design tokens or brand signals found.` and stop.

**2 - Resolve brand personality:**
Read `README.md`, `package.json` description, landing page / `about` components. Extract: product name, tagline, target audience, brand voice.

**3 - Write DESIGN.md at project root:**

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
  xs: {value}px              # only scales found - xs/sm/md/lg/xl/full
  sm: {value}px
  md: {value}px
  lg: {value}px
  full: 9999px               # only if pill/full-radius found
spacing:
  xs: {value}px              # only scales found - xs/sm/md/lg/xl/2xl
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

{Brand personality, target audience, emotional intent - 3-5 sentences. Use descriptive language: "Architectural Minimalism meets Journalistic Gravitas" not "clean and modern".}

## Colors

- **Primary ({hex}):** {semantic role}
- **Secondary ({hex}):** {role}

## Typography

- **{token-name}:** {family, size, weight} - {intended use}

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

- {concrete rule - e.g. "Don't use tertiary on backgrounds <44px - contrast drops below WCAG AA"}
```

**Rules:**

- YAML values only from codebase - no invented values. Missing token → omit + add to `omitted`
- `{path.to.token}` in `components` must reference token defined in same file
- `fontWeight` must be a number (400, not "bold")
- All hex values must be valid CSS colors
- Section order: Overview → Colors → Typography → Layout → Elevation & Depth → Shapes → Components → Do's and Don'ts
- `omitted` entries suppress linter warnings - always include inspected-but-not-found sections
- Prose must describe _why_, not just _what_
- No placeholder text in final file - every line must contain real data

**After writing:** `DESIGN.md written - {N} color tokens, {M} typography levels, {K} shadows, {J} motion tokens, {L} component tokens.`

**4 - Validate against live Google spec:**

After writing, validate DESIGN.md is not using deprecated fields:

1. `WebFetch` https://github.com/google-labs-code/design.md - read the latest spec README
2. `WebFetch` https://stitch.withgoogle.com/docs/design-md/specification - read the full field reference
3. Compare every field/section name in the written DESIGN.md against the live spec:
    - Flag any field that no longer exists in the spec (deprecated/renamed)
    - Flag any required field that's now mandatory but missing
    - Flag any value format change (e.g. unit expected changed from px to rem)
4. If issues found → fix DESIGN.md in-place and note what was corrected
5. Output: `DESIGN.md validated against Google spec - {N} fixes applied.` or `DESIGN.md validated - no issues.`

---

## Constraints

- Read + non-destructive commands only (`npm audit`, `tsc --noEmit`, `npm run build`, `go build`, `git ls-files`, `git log`)
- Do NOT run: `npm install`, `git push`, migrations, or any write ops
- **NEVER read `.env*` files** - existence check via `git ls-files`/`ls` only. Never open/cat them.
- Skip checks irrelevant to stack (mark ⏭️ SKIP)
- Monorepo: checks per workspace, one report, final score = lowest workspace
- Tool unavailable (e.g. `pip-audit` not installed) → note + skip, don't error
