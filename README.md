# goshipit

[![npm version](https://img.shields.io/npm/v/goshipit)](https://www.npmjs.com/package/goshipit)
[![npm downloads](https://img.shields.io/npm/dm/goshipit)](https://www.npmjs.com/package/goshipit)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Node.js](https://img.shields.io/node/v/goshipit)](https://nodejs.org)

**Pre-launch codebase audit for AI coding tools.**  
210 checks · 15 categories · 10 platforms · no live URL needed.

Say `goshipit` — your AI tool runs a full secrets, security, quality, performance, accessibility, SEO, agent readiness, billing, and legal audit. Severity-weighted score out of 100. Saves `prelaunch-report.md` with every finding, file reference, and fix step.

```bash
npx goshipit
```

> [!CAUTION]
> **Token hungry.** goshipit runs 210 checks and writes a full dev report. Untick sections or checks in `goshipit.md` to stay lean — sub-agents only receive the checks you leave ticked.

---

## Supported AI tools

goshipit is an [Agent Skills](https://agentskills.io) skill: one folder (`SKILL.md` + `scripts/` + `assets/` + `references/`) that every tool below loads natively. No per-tool rule files, no settings.json edits.

| Tool | Global skill dir | Trigger |
|------|-----------------|---------|
| [Claude Code](https://claude.ai/code) | `~/.claude/skills/goshipit/` | `/goshipit` or say it |
| [OpenAI Codex CLI](https://github.com/openai/codex) | `~/.agents/skills/goshipit/` | say it |
| [Cline](https://github.com/cline/cline) | `~/.agents/skills/goshipit/` | say it |
| [Zed](https://zed.dev) | `~/.agents/skills/goshipit/` | say it in Agent |
| [Cursor](https://cursor.com) | `~/.cursor/skills/goshipit/` | say it in Agent |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `~/.gemini/skills/goshipit/` | say it |
| [GitHub Copilot](https://github.com/features/copilot) | `~/.copilot/skills/goshipit/` | say it in agent mode / CLI |
| [Windsurf](https://windsurf.com) | `~/.codeium/windsurf/skills/goshipit/` | say it in Cascade |
| [Continue](https://continue.dev) | `~/.continue/skills/goshipit/` | say it |
| [OpenCode](https://opencode.ai) | `~/.config/opencode/skills/goshipit/` | say it in TUI |

Any other Agent Skills client that reads `~/.agents/skills/` picks it up too. The installer auto-detects your tools and copies the skill into each one's dir.

---

## Install

```bash
npx goshipit                 # pick tools, install globally (~)
npx goshipit -y              # skip picker, install to all detected tools
npx goshipit --project       # install into this repo (.agents/skills, .claude/skills, ...) to commit for your team
```

Or with the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add Capta1nRaj/goshipit
```

Upgrading from v0.1.x? Just run `npx goshipit@latest` — old pointer files (`~/.goshipit/`, Cursor rules, Windsurf memories, `GEMINI.md`/`AGENTS.md` blocks, VS Code settings entries, Zed/Continue prompts) are removed automatically. Only files goshipit wrote are touched.

---

## Commands

```bash
npx goshipit                # install (interactive picker)
npx goshipit --uninstall    # remove (interactive picker)
npx goshipit --project      # install/uninstall/status in current repo instead of ~
npx goshipit --status       # show detected + installed status with paths
npx goshipit --version      # local version + npm latest check
npx goshipit --dry-run      # preview what would install/remove, touch nothing
npx goshipit -y             # skip picker (CI / scripting)
npx goshipit@latest         # update to latest version
npx goshipit init [--force] # create goshipit.md in current project (--force overwrites)
```

---

## How it works

Once installed, say any trigger phrase in your AI tool:

> `goshipit` · `is my app ready?` · `can I deploy now?` · `prelaunch check` · `review before launch` · `production readiness check` · `should I merge to main?`

No in-chat menus. What runs is decided by `goshipit.md` in your project root.

| Step | What happens |
|------|-------------|
| 0 | **Config** — first run creates `goshipit.md` (K/L/M auto-unticked when not detected) and asks once: run with defaults or stop to edit. Later runs read it and add any checks new to your goshipit version. |
| 1 | **Stack detection + Stack Profile** — infers framework, runtime, DB, auth, deploy target, monorepo tool from files (no hardcoded lists), then resolves stack-specific patterns via context7, web docs, or built-in knowledge. |
| 2 | **Checks** — ticked sections are grouped into up to `max_agents` balanced batches. Each batch receives only its ticked check rows. Parallel sub-agents on Claude Code; other tools run batches sequentially. Custom checks run last. |
| 3 | **Score** — severity-weighted from 100. Can go negative. |
| 4 | **Report** — `prelaunch-report.md` with every finding as a checkbox, grouped by severity, with file:line evidence and fix steps. |
| 5 | **Fix** — `fix_mode: auto-fix` applies safe fixes with diff preview. Or tick items in the report and say `goshipit fix`. |
| 6 | **Outdated packages** (`outdated: yes`) — flags major-version breaks separately. |
| 7 | **Build** (`build: yes`) — runs your production build; failure = P0 and the score is updated. |
| 8 | **DESIGN.md** (`design_md: yes`, only if none exists) — writes a Google DESIGN.md spec file from your design tokens. |

> Steps 6–8 run only when enabled in `goshipit.md`. On **Claude Code**, batches run in parallel via sub-agents — full audit in minutes, not hours.

---

## Configure with goshipit.md

Created automatically on first run, or manually:

```bash
npx goshipit init            # writes ./goshipit.md
npx goshipit init --force    # overwrite an existing one
```

Format (all 210 checks, section-wise):

```markdown
---
fix_mode: audit-only     # audit-only | auto-fix (safe fixes applied with diff preview)
build: no                # yes | no - run production build, failure = P0
outdated: yes            # yes | no - outdated package check
design_md: no            # yes | no - generate DESIGN.md if missing
workspaces: all          # monorepo only: all | comma list e.g. apps/web,apps/api
max_agents: 5            # max parallel sub-agents (tools without sub-agents run sequentially)
---

# goshipit checks (210)

## [x] A · Secrets & Environment (9)
- [x] A1 · Hardcoded secrets and API keys in source
- [x] A2 · .env files tracked in git
- [ ] A3 · .env.example file exists
...

## [ ] K · PWA & Service Worker (5)
...

## [x] Custom checks
- [x] Payment webhook verifies signature
```

**Selection rules**

| Box | Effect |
|-----|--------|
| Section unticked | Whole section skipped |
| Section ticked | Only its ticked rows run |
| Custom checks | Each ticked line runs as a free-form check |

New checks from a goshipit update are appended ticked and marked `(new)`; your edits are never removed or reordered.

**Settings**

| Key | Values | Default | Effect |
|-----|--------|---------|--------|
| `fix_mode` | `audit-only` \| `auto-fix` | `audit-only` | Apply safe fixes with diff preview during the run |
| `build` | `yes` \| `no` | `no` | Run production build; failure = P0 |
| `outdated` | `yes` \| `no` | `yes` | Outdated package check |
| `design_md` | `yes` \| `no` | `no` | Generate `DESIGN.md` if missing |
| `workspaces` | `all` \| comma list | `all` | Monorepo workspaces to audit |
| `max_agents` | number | `5` | Max parallel sub-agents |

**Fixing:** the report lists every finding as `- [ ]`. Tick the ones you want, then say `goshipit fix`.

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
| O | Agent Readiness | 22 | robots.txt AI bots, llms.txt v2, sitemap.md, markdown mirrors, content negotiation, AGENTS.md, Link headers, MCP/A2A/WebMCP, API Catalog, OAuth discovery, x402/UCP/ACP _(always; protocol checks SKIP if stack N/A)_ |

> **Agent Readiness attribution:** Category O merges 4 independent sources — [Cloudflare's isitagentready.com](https://isitagentready.com) (1 part), [agent-ready.dev](https://agent-ready.dev), [Vercel Agent Readability Spec](https://vercel.com/kb/guide/agent-readability-spec), and [llmstxt.org](https://llmstxt.org). Only isitagentready.com is by Cloudflare; others are independent. Not affiliated with or endorsed by Cloudflare or Vercel. Implements open standards (RFC 8288, RFC 8615, RFC 9727/9728) in our own words.

Categories K, L, M are unticked in `goshipit.md` at init when no matching files are found. O protocol checks SKIP if stack N/A. Everything else is ticked by default.

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

Two ways in: set `fix_mode: auto-fix` in `goshipit.md`, or tick findings in `prelaunch-report.md` and say `goshipit fix`. For safe, reversible issues goshipit applies the fix with a diff preview and confirmation. For issues that require human judgment it shows exactly what to change and where — with a code snippet — without touching the file.

**Auto-fixable:** `.env` in git, missing `alt` attributes, `console.log` in prod paths, missing TS `strict`, render-blocking scripts, `.gitignore` gaps, missing viewport meta, missing `lang` on `<html>`.

**Never auto-touched:** SQL injection, auth middleware, N+1 queries, CORS config, CVEs, bundle size — anything where the correct value requires judgment.

---

## Requirements

- Node.js ≥ 18
- At least one supported AI tool (see table above)

---

## Contributing

Open an [issue](https://github.com/Capta1nRaj/goshipit/issues) or PR.

To add a check:

1. Add a table row in the right `skills/goshipit/references/checks-*.md` file, following the existing format.
2. Add the matching `- [x] <ID> · <short title>` row to `skills/goshipit/assets/template.md` in the same order, and bump that section's `(N)` count plus the `(210)` header.
3. Run the verifier:

```bash
node skills/goshipit/scripts/config.js verify
```

It checks template vs references, section counts, and the total in `SKILL.md`, `README.md`, and `package.json`. The CLAUDE.md in this repo enforces this automatically.

Tag [@Capta1nCodes](https://x.com/Capta1nCodes) on X with feedback or bug reports.

---

## License

[Apache-2.0](LICENSE) © [Capta1nRaj](https://github.com/Capta1nRaj)
