# goshipit — Pre-launch Codebase Audit

**Triggers:** "goshipit", "is my app ready?", "can I deploy now?", "prelaunch check",
"review before launch", "is this production-ready?", "check my codebase",
"launch checklist", "ready to go live?", "audit before deploy",
"production readiness check", "should I merge to main?"

210 checks. Stack-aware. Severity-weighted score out of 100. Saves prelaunch-report.md.

**References:** `~/.goshipit/references/`

---

## Step 1 — Stack Detection

Use shell tools to detect the stack:

```bash
ls -la
cat package.json 2>/dev/null
cat pyproject.toml 2>/dev/null
cat go.mod 2>/dev/null
cat Cargo.toml 2>/dev/null
ls *.config.* *.toml *.yaml *.yml Makefile Dockerfile* 2>/dev/null
```

Infer: framework, language, runtime, DB, auth lib, build tool, deploy target.

Key signals:
- `turbo.json`/`nx.json` → monorepo
- `bun.lockb` → Bun runtime
- `pnpm-workspace.yaml` → pnpm monorepo
- `fly.toml`/`vercel.json`/`netlify.toml`/`render.yaml` → deploy target
- `ecosystem.config.*` → PM2

Guard: No project files → tell user "No codebase detected. Run from project root." and stop.

---

## Step 2 — Category Selection

Ask the user in chat:

```
Which areas to audit?

1. All areas — full audit (recommended) — 210 checks A-O: A Secrets 9 · C Security 35 · B Quality 18 · D Tests 4 · E Build 15 · F Reliability 21 · G Hygiene 14 · I Deploy 15 · J SEO 14 · K PWA 5 · L Ecom 13 · M Billing 9 · N Legal 7 · O Agent 22 (+ H A11y 9 via Next)
2. Secrets & Environment — .env in git, hardcoded keys, multi-env drift, webhook URLs, test-mode keys — A (9)
3. Security — SQLi, XSS, CORS, CSP/HSTS, rate-limit, CSRF, CVEs, BOLA/IDOR, auth, SSRF — C (35)
4. Code Quality — console.log, TODOs, dead code, complexity, leaks, promises, strict TS — B (18)
5. Tests — suite pass, coverage, skipped, E2E — D (4)
6. Build & Performance — build errors, types, bundle, N+1, images, cache, SSR — E (15)
7. Reliability — runtime pin, error handling, monitoring, DB migrations, pooling — F (21)
8. Hygiene — conflicts, .gitignore, README, large files, linter, CI secrets — G (14)
9. Deploy & Infra — Docker non-root, Vercel/Render, Nginx, PM2, K8s limits/probes — I (15)
10. SEO, PWA, Ecom, Billing, Legal & Agent — SEO meta, PWA SW, tracking, billing webhooks, GDPR, llms.txt, MCP/A2A, x402 — J,K,L,M,N,O (77 combined)

Include accessibility checks? (yes/no)
Fix mode? (audit-only / audit+autofix)
```

Map reply:
- "1"/all → A B C D E F G I J K L M N O (+ H via accessibility yes)
- "2" → A  |  "3" → C  |  "4" → B  |  "5" → D  |  "6" → E  |  "7" → F  |  "8" → G  |  "9" → I  |  "10" → J K L M N O
- accessibility yes → add H
- K/L/M auto still, but covered via 10 — also auto-run if signals found (K: manifest.json/sw.js/next-pwa/workbox, L: payment/cart/checkout, M: billing SDK)
- N always (Legal), O always (Agent — SKIP if stack N/A)

---

## Step 3 — Run Checks

For each selected category, sequentially:

```bash
cat ~/.goshipit/references/checks-{letter}-{name}.md
```

For each check, run the described grep/find/cat command. Record:
- **PASS** — no issue
- **FAIL** — issue confirmed, `file:line` evidence
- **SKIP** — stack N/A (state why)

| Cat | Reference file |
|-----|---------------|
| A — Secrets | `checks-a-secrets.md` |
| B — Code Quality | `checks-b-quality.md` |
| C — Security | `checks-c-security.md` |
| D — Tests | `checks-d-tests.md` |
| E — Build | `checks-e-build.md` |
| F — Reliability | `checks-f-reliability.md` |
| G — Hygiene | `checks-g-hygiene.md` |
| H — Accessibility | `checks-h-accessibility.md` |
| I — Deploy | `checks-i-deploy.md` |
| J — SEO | `checks-j-seo.md` |
| K — PWA | `checks-k-pwa.md` |
| L — E-commerce | `checks-l-ecommerce.md` |
| M — Billing | `checks-m-billing.md` |
| N — Legal | `checks-n-legal.md` |
| O — Agent Readiness | `checks-o-agent.md` |

**NEVER read `.env*`, `.pem`, `.key`, `id_rsa`, `credentials.json`.**

---

## Step 4 — Score

```
Start: 100 | P0 FAIL: −10 | P1 FAIL: −3 | P2 FAIL: −1
```

```
┌─────────────────────────────────────────────────┐
│  🚀 GOSHIPIT PRELAUNCH SCORE                    │
│   74 / 100                              🟡      │
│   ████████████████████░░░░░░░░░  74%            │
│   ❌ P0 Blockers  1   −10 pts                   │
│   ⚠️  P1 Warnings 4   −12 pts                   │
│   📝 P2 Notes     4    −4 pts                   │
│   ✅ Passed      34                             │
│   ⏭️  Skipped     3   (stack N/A)               │
│   VERDICT: NOT READY - fix 1 P0 blocker first   │
└─────────────────────────────────────────────────┘
```

| Score | Verdict |
|-------|---------|
| 90–100 🟢 | Ready to launch |
| 75–89 🟡 | Launch with P1 fixes queued |
| 50–74 🟠 | Fix P1s before launch |
| 1–49 🔴 | Not ready |
| ≤0 ☠️ | Severely broken |

---

## Step 5 — Save Report

Write `prelaunch-report.md` in project root with all findings grouped by severity.

Fix mode `audit+autofix`: propose safe P1/P2 fixes with diffs, apply after user confirms. Never auto-fix P0.

> **Attribution:** Agent Readiness checks merge 4 independent sources — Cloudflare's isitagentready.com (1 part), agent-ready.dev, Vercel Agent Readability Spec, and llmstxt.org v2. Only isitagentready.com is by Cloudflare; others are independent. Not affiliated with or endorsed by Cloudflare or Vercel.
