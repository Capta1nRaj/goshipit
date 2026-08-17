# goshipit — Pre-launch Codebase Audit

This file is loaded automatically by Codex CLI. When the user says any of these phrases,
run the goshipit audit:

**Triggers:** "goshipit", "is my app ready?", "can I deploy now?", "prelaunch check",
"review before launch", "is this production-ready?", "check my codebase",
"launch checklist", "ready to go live?", "audit before deploy",
"production readiness check", "should I merge to main?"

**What it does:** 188 checks across secrets, security, code quality, tests,
build/performance, reliability, accessibility, deploy config, SEO, PWA,
e-commerce, billing, legal. Severity-weighted score out of 100.
Saves prelaunch-report.md. No live URL needed.

**References:** `~/.goshipit/references/`

---

## Step 1 — Stack Detection

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

Guard: no project files → print "No codebase detected. Run from project root." and stop.

---

## Step 2 — Category Selection

Print to user:

```
goshipit: Which areas to audit?

  1. All areas (recommended)
  2. Secrets & Security  
  3. Code Quality & Tests
  4. Build & Performance
  5. Reliability, Hygiene, Deploy & SEO

Include accessibility? (yes/no)
Fix mode? (audit-only / audit+autofix)

Reply with numbers (e.g. "1" or "2,3") or "all":
```

Map reply:
- "all" or "1" → A B C D E F G I J N + auto K/L/M
- "2" → A C
- "3" → B D
- "4" → E
- "5" → F G I J N
- accessibility yes → add H
- K auto: manifest.json/sw.js/next-pwa/workbox found
- L auto: payment lib/cart/checkout found
- M auto: payment/billing SDK in deps
- N always

---

## Step 3 — Run Checks

For each category in sequence:

```bash
cat ~/.goshipit/references/checks-{letter}-{name}.md
```

For each check row, run the described command (grep/find/cat/ls).

Status per check:
- **PASS** — no issue
- **FAIL** — issue found, include `file:line` evidence
- **SKIP** — stack N/A (state why)

Reference files:

| Cat | File |
|-----|------|
| A | `checks-a-secrets.md` |
| B | `checks-b-quality.md` |
| C | `checks-c-security.md` |
| D | `checks-d-tests.md` |
| E | `checks-e-build.md` |
| F | `checks-f-reliability.md` |
| G | `checks-g-hygiene.md` |
| H | `checks-h-accessibility.md` |
| I | `checks-i-deploy.md` |
| J | `checks-j-seo.md` |
| K | `checks-k-pwa.md` |
| L | `checks-l-ecommerce.md` |
| M | `checks-m-billing.md` |
| N | `checks-n-legal.md` |

**NEVER read `.env*`, `.pem`, `.key`, `id_rsa`, `credentials.json`.**

---

## Step 4 — Score

```
Start: 100
P0 FAIL: −10 pts
P1 FAIL: −3 pts
P2 FAIL: −1 pt
No floor.
```

Print:

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

| Score | Verdict |
|-------|---------|
| 90–100 🟢 | Ready to launch |
| 75–89 🟡 | Launch with P1 fixes queued |
| 50–74 🟠 | Fix P1s before launch |
| 1–49 🔴 | Not ready |
| ≤0 ☠️ | Severely broken |

---

## Step 5 — Save Report

Write `prelaunch-report.md` in project root:

```markdown
# Prelaunch Report — {date}

**Score:** {N}/100 {emoji}
**Stack:** {detected stack}
**Verdict:** {verdict}

## ❌ P0 Blockers
| ID | Check | Evidence | Fix |
|----|-------|----------|-----|

## ⚠️ P1 Warnings
| ID | Check | Evidence | Fix |

## 📝 P2 Notes
| ID | Check | Evidence | Fix |

## ✅ Passed ({N} checks)
## ⏭️ Skipped ({N} — stack N/A)
```

Fix mode `audit+autofix`: propose safe P1/P2 fixes with diffs, apply after confirmation. Never auto-fix P0.
