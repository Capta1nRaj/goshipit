---
name: goshipit
description: >-
  Pre-launch codebase audit. Runs 210 checks across secrets, security, code quality,
  tests, build/performance, reliability, hygiene, accessibility, deploy config, SEO,
  PWA, e-commerce tracking, billing, legal compliance, and agent readiness. Checks are
  picked in an editable goshipit.md checkbox file; writes prelaunch-report.md with a
  severity-weighted score out of 100. Codebase only, no live URL needed. Use when the
  user says "goshipit" or "goshipit fix", or is about to ship, deploy, launch, go live,
  or merge a release: "is my app ready?", "can I deploy now?", "is this
  production-ready?", "pre-deploy check", "launch checklist", "audit before deploy",
  "what could break in production?". Do NOT use for post-launch monitoring, live site
  audits, SEO rank tracking, or reviewing a single file or function.
license: Apache-2.0
compatibility: Any Agent Skills client. Node.js 18+ recommended for scripts/config.js (manual fallback without it). Parallel sub-agents used when available.
allowed-tools: Read Write Edit Bash Grep Glob AskUserQuestion WebSearch WebFetch Agent mcp__context7__resolve-library-id mcp__context7__query-docs
metadata:
  version: "0.2.0"
  author: Capta1nRaj
  homepage: https://github.com/Capta1nRaj/goshipit
  npm: goshipit
---

# goshipit

Pre-launch codebase audit. 210 checks. Stack-aware, severity-weighted, saves prelaunch-report.md. No live URL needed.
Install: `npx goshipit` | Repo: https://github.com/Capta1nRaj/goshipit

> **Attribution:** Agent Readiness (22 checks) merges 4 independent sources — [Cloudflare's isitagentready.com](https://isitagentready.com) (1 part), [agent-ready.dev](https://agent-ready.dev), [Vercel Agent Readability Spec](https://vercel.com/kb/guide/agent-readability-spec), and [llmstxt.org](https://llmstxt.org) v2. Only isitagentready.com is by Cloudflare; others are independent. Not affiliated with or endorsed by Cloudflare or Vercel. Implements open standards (RFC 8288, RFC 8615, RFC 9727/9728) in our own words.

## Conventions

- `SKILL_DIR` = directory containing this SKILL.md (the skill root your tool loaded it from; derive at runtime, never hardcode). All paths below are relative to it.
- `CFG` = `node {SKILL_DIR}/scripts/config.js` (zero-dep, Node >= 18).
- **Platform fallbacks** - one runbook for every tool:
  - `Agent` (sub-agents) unavailable → run each batch yourself, sequentially, with the same brief.
  - `AskUserQuestion` unavailable → ask the same question as plain text, wait for the reply.
  - context7 / WebSearch / WebFetch unavailable → use built-in knowledge, mark `[inferred]`.
- **Write-safe:** the only files goshipit creates or overwrites are `goshipit.md`, `prelaunch-report.md`, and `DESIGN.md` (project root). Source files change only in Step 5, one diff at a time, after the user confirms.
- **Routing:** user said `goshipit fix` → go straight to Step 5B. Otherwise run Steps 0-8 in order, each once.

## Categories

Definitions live in `{SKILL_DIR}/references/<file>`. Never read them in full - use `CFG rows`.

| Cat | Name                   | File                        | #  | Default in goshipit.md         |
| --- | ---------------------- | --------------------------- | -- | ------------------------------ |
| A   | Secrets & Environment  | `checks-a-secrets.md`       | 9  | on                             |
| B   | Code Quality           | `checks-b-quality.md`       | 18 | on                             |
| C   | Security               | `checks-c-security.md`      | 35 | on                             |
| D   | Tests                  | `checks-d-tests.md`         | 4  | on                             |
| E   | Build & Performance    | `checks-e-build.md`         | 15 | on                             |
| F   | Reliability            | `checks-f-reliability.md`   | 21 | on                             |
| G   | Codebase Hygiene       | `checks-g-hygiene.md`       | 14 | on                             |
| H   | Accessibility          | `checks-h-accessibility.md` | 9  | on                             |
| I   | Deploy Config          | `checks-i-deploy.md`        | 15 | on                             |
| J   | SEO & Meta             | `checks-j-seo.md`           | 14 | on                             |
| K   | PWA & Service Worker   | `checks-k-pwa.md`           | 5  | auto-off at init when not detected |
| L   | E-commerce Tracking    | `checks-l-ecommerce.md`     | 13 | auto-off at init when not detected |
| M   | Billing & Subscription | `checks-m-billing.md`       | 9  | auto-off at init when not detected |
| N   | Legal & Compliance     | `checks-n-legal.md`         | 7  | on                             |
| O   | Agent Readiness        | `checks-o-agent.md`         | 22 | on (protocol checks SKIP if stack N/A) |

---

## Step 0 - Config (`goshipit.md`)

**A. `goshipit.md` missing in project root:**

1. Quick detect for K/L/M only:
   - K: `manifest.json` / `manifest.webmanifest`, `sw.js`, `next-pwa`, workbox
   - L: payment lib, cart/checkout routes, product schema
   - M: any payment/billing SDK (Stripe, Razorpay, Paddle, LemonSqueezy, Chargebee...) in deps or source
2. Run `CFG init --off <undetected letters, comma list>` (omit `--off` if all detected).
3. Ask ONE question (AskUserQuestion, `multiSelect: false`, header `goshipit.md`): `Created goshipit.md with all 210 checks. Run now?`
   - `Run with defaults now` → continue to Step B.
   - `Stop - I'll edit goshipit.md first` → reply `Edit goshipit.md, then say "goshipit".` and end.

**B. `goshipit.md` exists:**

1. `CFG sync` - adds checks introduced by newer goshipit versions (ticked, marked `(new)`).
2. `CFG select` → JSON `{settings, sections, custom, new, unknown, total}`. Use it as the single source of truth for this run.
3. Print one line: `Config: <total> checks in <n> sections · fix_mode=… build=… outdated=… design_md=… max_agents=…`. If `new`/`unknown` non-empty, list them.
4. `total` = 0 and `custom` empty → reply `Nothing selected in goshipit.md.` and end.

**Node unavailable / `scripts/config.js` errors:** read `goshipit.md` yourself with the same rules: frontmatter `key: value` (strip `# comments`); a check runs iff its `## [x] <Letter> · …` section AND its `- [x] <ID> · …` row are ticked; ticked lines under `## [x] Custom checks` are custom checks. Missing settings → `fix_mode: audit-only`, `build: no`, `outdated: yes`, `design_md: no`, `workspaces: all`, `max_agents: 5`. If `goshipit.md` is also missing, copy `{SKILL_DIR}/assets/template.md` to `./goshipit.md` and untick undetected K/L/M sections by hand.

---

## Step 1 - Stack Detection

Infer the stack from files - no hardcoded lists.

1. List root + one level deep.
2. Read manifests: `package.json` (deps, devDeps, scripts), `pyproject.toml` / `requirements.txt` / `Pipfile`, `go.mod`, `Cargo.toml`.
3. Scan `*.config.*`, `*.toml`, `*.yaml`, `*.yml`, `Makefile`, `Dockerfile*`.
4. Infer: framework, language, runtime, pkg manager, DB, auth lib, build tool, deploy target, monorepo tool, process manager, reverse proxy.

Hints: `turbo.json`/`nx.json`/`pnpm-workspace.yaml`/`apps/`+`packages/` → monorepo · `bun.lockb`/`bun.lock` → Bun · `nginx.conf` → Nginx · `ecosystem.config.*` → PM2 · `fly.toml`/`render.yaml`/`railway.json`/`vercel.json`/`netlify.toml` → deploy target.

**Guards:**

- No recognizable project files → `No codebase detected. Run goshipit from project root.` and end.
- No git repo → A2, A6, A7 = `SKIP (no git history)`.
- Monorepo → audit workspaces from `settings.workspaces` (`all` or comma list). Final score = lowest workspace score.

Infra checks run only when the tool/file exists. Never flag "missing" for absent infra.

### 1.5 - Stack Profile

Resolve once per detected technology, cheapest source first: context7 (`resolve-library-id` → `query-docs` "production security best practices") → WebSearch/WebFetch of official docs → built-in knowledge.

| Field                    | Resolve                                                         |
| ------------------------ | --------------------------------------------------------------- |
| `debug_patterns`         | Debug statements forbidden in prod source                       |
| `test_command`           | Test command for stack + pkg manager                            |
| `lockfile`               | Lockfile of detected pkg manager                                |
| `linter`                 | Idiomatic linter + config filename                              |
| `shutdown_handler`       | SIGTERM/SIGINT graceful shutdown pattern                        |
| `env_validation_pattern` | Startup env validation pattern                                  |
| `auth_route_patterns`    | Auth endpoint naming                                            |
| `dev_only_deps`          | Tool categories that must not ship in prod deps                 |
| `gitignore_required`     | Build artifacts, caches, IDE files, secrets for stack           |
| `build_command`          | Full prod build command                                         |
| `security_middleware`    | CSRF, rate-limit, session middleware idioms                     |
| `edge_runtime_files`     | Edge-runtime files (Next.js `middleware.ts`, Edge Fns, CF Workers) - Node-only libs (`express-rate-limit`, `ioredis`, `node:*`) crash there |

Print the profile compactly, each field tagged `[MCP]`, `[web]`, or `[inferred]`.

---

## Step 2 - Run Checks

1. **Ids:** all ids from `select.sections`. Remove E1 when `build: yes` (Step 7 runs the build once and records it as E1). `build: no` → E1 = `SKIP (build: no in goshipit.md)`.
2. **Batch:** split sections into at most `max_agents` batches, balanced by check count (largest section first into the lightest batch). A section is never split.
3. **Dispatch:**
   - Agent tool available → one sub-agent per batch, all in a single message (`run_in_background: true`), then wait for all.
   - Otherwise → run batches yourself, one after another, following the same brief.
4. **Custom checks** (`select.custom`) → orchestrator runs them itself after the batches, using judgement. Same JSON shape, id `X1`, `X2`… in order, severity chosen per finding.
5. Batch error / invalid JSON → mark every id in that batch `SKIP (agent error - re-run manually)`, no score impact, continue.

### Sub-agent brief

```
COMMUNICATION MODE: caveman ultra. No filler, no tool-call narration. Code symbols/error strings untouched.

You are a goshipit prelaunch audit sub-agent.
Working dir: {CWD}
Stack Profile: {STACK_PROFILE}
Workspaces: {WORKSPACES}

Get your checks: run `node {SKILL_DIR}/scripts/config.js rows {IDS}`
It prints ONLY your check rows plus category guidance. Never read reference files directly.
(If that command fails: read only {SKILL_DIR}/references/<file> for your categories and use only rows whose ID is in {IDS}.)

Rules:
- Use Read/Grep/Glob/Bash. Read-only. Never modify files.
- NEVER open, cat, or read .env*, *.pem, *.key, id_rsa, credentials.json, or any secret file. Existence check via `ls`/`git ls-files` only.
- "(only if X)" → verify X first; not met → SKIP, reason "stack N/A".
- Every id in {IDS} must appear exactly once in output.
- Output ONLY a JSON array - no prose, no markdown, no code fences:
[{"id":"A1","status":"FAIL","severity":"P0","evidence":"sk_live_xxx in src/config.js:12","fix":"move to env var, never commit"},
 {"id":"A2","status":"PASS","severity":"P0","evidence":".env not tracked in git","fix":""}]
status: PASS (checked, no issue) | FAIL (confirmed, include file:line) | SKIP (state why: stack N/A or tool name unavailable)
```

---

## Step 3 - Score

```
Start 100 · P0 FAIL −10 · P1 FAIL −3 · P2 FAIL −1 · no floor (can go negative)
```

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

| Score  | Emoji | Verdict                        |
| ------ | ----- | ------------------------------ |
| 90–100 | 🟢    | Ready to launch                |
| 75–89  | 🟡    | Launch with P1 fixes queued    |
| 50–74  | 🟠    | Fix P1s before launch          |
| 1–49   | 🔴    | Not ready - blockers present   |
| 0      | 🚨    | DO NOT LAUNCH                  |
| < 0    | ☠️    | Severely broken - major rework |

Bar: 32 blocks, `█` = 3.125 pts, empty `░`. Score ≤ 0 → all 32 empty, show the real number and percent (e.g. `-5 / 100  -5%`).

---

## Step 4 - Report (`prelaunch-report.md`)

Overwrite at project root:

```markdown
# Prelaunch Report

**Date**: YYYY-MM-DD
**Stack**: Next.js 16 · TypeScript · Prisma · Vercel
**Checks run**: 187 of 210 (from goshipit.md)
**Score**: 74/100 (P0: 1 · P1: 4 · P2: 4)

---

## ❌ P0 Blockers - fix before any deploy

- [ ] **A2** - `.env` tracked in git
      → `git rm --cached .env && echo ".env" >> .gitignore`

- [ ] **C1** - Raw user input in DB query · `src/api/users.ts:34`
      → Use parameterised query / Prisma `where: { id: userId }`

## ⚠️ P1 Warnings - fix within 24h

- [ ] **C7** - CORS wildcard `*` in `api/cors.ts:12`
- [ ] **E8** - N+1 query in `src/lib/posts.ts:67` - `.find()` inside `.map()`

## 📝 P2 Notes - polish before launch

- [ ] **B9** - CHANGELOG.md missing

## ✅ Passed (34 checks)

- A1 - No hardcoded secrets
- [...]

## ⏭️ Skipped

- I1a–I1e - Dockerfile checks (no Dockerfile detected)

## 🔍 Custom Checks

- [ ] **X1** - Webhook `api/payment/webhook.ts` missing signature verification · P1

---

**Verdict**: NOT READY - fix 1 P0 blocker first

> Tick items to fix, then say `goshipit fix`.
```

Monorepo: one report, one sub-heading per workspace under each severity. Steps 6-8 append their own sections (`## 📦 Outdated Packages`, `## 🏗️ Build`, `## 🎨 DESIGN.md`) above the Verdict line.

---

## Step 5 - Fix

### 5A - `fix_mode: auto-fix` (during the audit run)

For every FAIL in the safe-fix table: show diff → confirm → apply → mark `[x] ✅ fixed` in the report. Everything else stays for 5B. `fix_mode: audit-only` → skip 5A.

### 5B - `goshipit fix` (separate run)

1. Read `prelaunch-report.md`. Missing → `Run goshipit first.` and end.
2. Collect lines ticked `- [x]` that are not already marked `✅ fixed`. None → `Nothing ticked in prelaunch-report.md.` and end.
3. Per item:
   - In safe-fix table → show diff, confirm, apply.
   - Not in table → explain the change with exact file:line and a concrete code snippet. Do NOT modify the file unless the user explicitly says to apply it.
4. Append ` ✅ fixed` to each applied line; save the report. Do not re-run the audit or rescore unless asked.

Diff preview:

```
Fix A2 - .gitignore
+ .env
+ .env.local
Applying... ✅ Done
```

### Safe-fix table

| Issue                           | Fix                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| A2 - `.env` in git              | Add `.env*` to `.gitignore`                                                            |
| E6 - render-blocking script     | Add `defer` to `<script>`                                                              |
| E4 - `<img>` missing dims       | Add `width`+`height` if detectable from context                                        |
| E5 - missing `font-display`     | Add `font-display: swap` to `@font-face` (`@import url()` → warn only, human fix)      |
| H1 - `<img>` missing `alt`      | Add `alt=""` for decorative; flag for human if content image                           |
| H7 - `:focus { outline: none }` | Append `:focus-visible { outline: 2px solid currentColor; outline-offset: 2px }`       |
| B1 - `console.log` in prod path | Remove line                                                                            |
| B17 - missing TS `strict`       | Add `"strict": true` to `tsconfig.json` `compilerOptions`                              |
| G3 - `.gitignore` incomplete    | Append missing entries from `gitignore_required`                                       |
| J7 - `<html>` missing `lang`    | Add `lang="en"` (or detected locale) to root `<html>`                                  |
| J10 - missing viewport meta     | Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to `<head>` |
| F9 - missing npm scripts        | Add stub `"test": "echo 'no tests'"` / `"start": "node dist/index.js"` if missing      |

**Never auto-touch:** merge conflict markers (G1 - show file:line only), SQL injection, auth middleware, N+1 queries, CORS config, bundle size, CVEs, any fix where the correct value is uncertain.

---

## Step 6 - Outdated Packages (`outdated: yes`)

1. Run the native command for the detected pkg manager: `npm outdated --json` / `yarn outdated` / `pnpm outdated` / `bun outdated` / `pip list --outdated` / `cargo outdated` / `go list -m -u all`.
2. Major bump → `⚠️ BREAKING - check changelog`, never suggest as routine.
3. Minor/patch with current version ≥ 30 days old → suggest update + changelog URL if known. Release date unclear → confirm on the registry page (WebFetch) or say "date unconfirmed".
4. Report row: package · current → recommended · release age · changelog.

Never suggest a version not confirmed by command output or registry page. Never run install/update. No score impact.

## Step 7 - Build (`build: yes`)

Run `build_command` (fallback: Makefile build target, then `scripts.build`). None → E1 `SKIP (no build command detected)`.

- Pass → E1 PASS, note warnings.
- Fail → E1 FAIL P0 with first error: add to report P0 section, recompute score (−10), update the report's Score + Verdict lines and print the updated score box.

## Step 8 - DESIGN.md (`design_md: yes`)

`DESIGN.md` exists at project root → skip. Otherwise read `{SKILL_DIR}/references/design-md.md` and follow it.

---

## Constraints

- Read + non-destructive commands only (`npm audit`, `tsc --noEmit`, build, `go build`, `git ls-files`, `git log`, `CFG …`).
- Never run `npm install`/updates, `git push`, commits, migrations, or other write ops.
- **NEVER read `.env*` / secret files** - existence check via `git ls-files`/`ls` only.
- Irrelevant to stack → SKIP. Tool missing (e.g. `pip-audit`) → SKIP with tool name, don't error.
- Monorepo: per-workspace checks, one report, final score = lowest workspace.
