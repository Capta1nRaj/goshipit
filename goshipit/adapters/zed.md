# goshipit — Pre-launch Codebase Audit

**Triggers:** "goshipit", "is my app ready?", "can I deploy now?", "prelaunch check",
"review before launch", "is this production-ready?", "check my codebase",
"launch checklist", "ready to go live?", "audit before deploy",
"production readiness check", "should I merge to main?"

188 checks. Stack-aware. Score out of 100. Saves prelaunch-report.md.

**References:** `~/.goshipit/references/`

---

## Step 1 — Stack Detection

Use the terminal to detect the stack:

```bash
ls -la && cat package.json 2>/dev/null && cat pyproject.toml 2>/dev/null && cat go.mod 2>/dev/null
ls *.config.* *.toml *.yaml *.yml Makefile Dockerfile* 2>/dev/null
```

Infer: framework, language, runtime, DB, auth lib, build tool, deploy target.

- `turbo.json`/`nx.json` → monorepo
- `bun.lockb` → Bun runtime
- `pnpm-workspace.yaml` → pnpm monorepo
- `fly.toml`/`vercel.json`/`netlify.toml`/`render.yaml` → deploy target
- `ecosystem.config.*` → PM2

Guard: No project files → tell user "No codebase detected. Run from project root." and stop.

---

## Step 2 — Category Selection

Ask the user in the chat panel:

```
Which areas to audit?

1. All areas (recommended)
2. Secrets & Security
3. Code Quality & Tests
4. Build & Performance
5. Reliability, Hygiene, Deploy & SEO

Include accessibility? (yes/no)
Fix mode? (audit-only / audit+autofix)
```

Map reply:
- "1"/all → A B C D E F G I J N + auto K/L/M
- "2" → A C  |  "3" → B D  |  "4" → E  |  "5" → F G I J N
- accessibility yes → add H
- K/L/M auto-detected from stack
- N always runs

---

## Step 3 — Run Checks

For each category, sequentially:

```bash
cat ~/.goshipit/references/checks-{letter}-{name}.md
```

Read the check table, run each described check with grep/find/cat, record result:
- **PASS** / **FAIL** (with `file:line` evidence) / **SKIP** (stack N/A)

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

**NEVER read `.env*`, `.pem`, `.key`, `id_rsa`, `credentials.json`.**

---

## Step 4 — Score & Output

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

Write `prelaunch-report.md` in project root with score, verdict, all FAIL/PASS/SKIP items grouped by severity.

Fix mode `audit+autofix`: propose P1/P2 fixes with diffs, apply after user confirms. Never auto-fix P0.
