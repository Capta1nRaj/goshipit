# goshipit — Pre-launch Codebase Audit

**Triggers:** "goshipit", "is my app ready?", "can I deploy now?", "prelaunch check",
"review before launch", "is this production-ready?", "check my codebase",
"launch checklist", "ready to go live?", "audit before deploy",
"production readiness check", "should I merge to main?"

188 checks. Stack-aware. Severity-weighted score out of 100. Saves prelaunch-report.md.

**References:** `~/.goshipit/references/`

---

## Step 1 — Stack Detection

Use execute_command to detect the stack:

```bash
ls -la
cat package.json 2>/dev/null
cat pyproject.toml 2>/dev/null
cat go.mod 2>/dev/null
cat Cargo.toml 2>/dev/null
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

Use ask_followup_question:

```
Which areas to audit?

1. All areas (recommended)
2. Secrets & Security
3. Code Quality & Tests
4. Build & Performance
5. Reliability, Hygiene, Deploy & SEO

Include accessibility checks? (yes/no)
Fix mode? (audit-only / audit+autofix)
```

Map reply:
- "1"/all → A B C D E F G I J N + auto K/L/M
- "2" → A C  |  "3" → B D  |  "4" → E  |  "5" → F G I J N
- accessibility yes → add H
- K auto: manifest.json/sw.js/next-pwa/workbox
- L auto: payment/cart/checkout
- M auto: billing SDK
- N always

---

## Step 3 — Run Checks

For each category, use execute_command then read_file for each check:

```bash
cat ~/.goshipit/references/checks-{letter}-{name}.md
```

For each check, run described grep/find/cat command. Record:
- **PASS** — no issue
- **FAIL** — issue found, `file:line` evidence
- **SKIP** — stack N/A

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

## Step 4 — Score

```
Start: 100 | P0: −10 | P1: −3 | P2: −1
```

Output score block:

```
┌─────────────────────────────────────────────────┐
│  🚀 GOSHIPIT PRELAUNCH SCORE                    │
│   {N} / 100                          {emoji}    │
│   ██████████████████████░░░░░░  {N}%            │
│   ❌ P0 Blockers  {n}  −{n} pts                 │
│   ⚠️  P1 Warnings {n}  −{n} pts                 │
│   📝 P2 Notes     {n}   −{n} pts                │
│   ✅ Passed      {n}                            │
│   ⏭️  Skipped     {n}  (stack N/A)              │
│   VERDICT: {verdict}                            │
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

Use write_to_file to save `prelaunch-report.md` in project root with all findings grouped by severity.

Fix mode `audit+autofix`: for each P1/P2 FAIL, show the proposed fix using write_to_file or apply_diff with diff preview. Ask confirmation before each. Never auto-fix P0.
