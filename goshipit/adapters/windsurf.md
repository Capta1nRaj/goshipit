# goshipit — Pre-launch Codebase Audit

**Triggers:** "goshipit", "is my app ready?", "can I deploy now?", "prelaunch check",
"review before launch", "is this production-ready?", "check my codebase",
"launch checklist", "ready to go live?", "audit before deploy",
"production readiness check", "should I merge to main?", "am I missing anything before launch?"

188 checks. Stack-aware. Severity-weighted score out of 100. Saves prelaunch-report.md. No live URL needed.

**References path:** `~/.goshipit/references/`

---

## Step 1 — Stack Detection

Run terminal commands to detect the stack:

```bash
ls -la
cat package.json 2>/dev/null
cat pyproject.toml 2>/dev/null
cat go.mod 2>/dev/null
ls *.config.* *.toml *.yaml *.yml Makefile Dockerfile* 2>/dev/null
```

Infer: framework, language, runtime, DB, auth lib, build tool, deploy target.

Key signals:
- `turbo.json`/`nx.json` → monorepo
- `bun.lockb` → Bun runtime
- `pnpm-workspace.yaml` → pnpm monorepo
- `fly.toml`/`vercel.json`/`netlify.toml`/`render.yaml` → deploy target
- `ecosystem.config.*` → PM2
- `nginx.conf` → Nginx

Guard: No project files → tell user "No codebase detected. Run goshipit from project root." and stop.

---

## Step 2 — Category Selection

Ask the user in chat:

```
Which areas to audit? (reply with numbers or "all")

1. All areas (recommended)
2. Secrets & Security
3. Code Quality & Tests
4. Build & Performance
5. Reliability, Hygiene, Deploy & SEO

Include accessibility checks? (yes/no)
Fix mode? (audit-only / audit+autofix)
```

Wait for user reply. Map:
- "all" or "1" → A, B, C, D, E, F, G, I, J, N + auto K/L/M
- "2" → A, C
- "3" → B, D
- "4" → E
- "5" → F, G, I, J, N
- accessibility yes → add H
- K auto: `manifest.json`/`sw.js`/`next-pwa`/workbox found
- L auto: payment lib/cart routes/checkout found
- M auto: payment/billing SDK in deps
- N always runs

---

## Step 3 — Run Checks

For each selected category, sequentially:

1. Read the reference file from terminal:
   ```bash
   cat ~/.goshipit/references/checks-{letter}-{name}.md
   ```
2. For each check in the table, run the appropriate grep/find/cat command
3. Record per check:
   - **PASS** — no issue found
   - **FAIL** — issue confirmed, include `file:line` evidence
   - **SKIP** — stack N/A (state why)

Reference files:

| Cat | File |
|-----|------|
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
Start: 100
P0 FAIL: −10 pts
P1 FAIL: −3 pts
P2 FAIL: −1 pt
No floor.
```

Output score block:

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

## Step 5 — Report

Save `prelaunch-report.md` in project root:

```markdown
# Prelaunch Report — {date}

**Score:** {N}/100 {emoji}  
**Stack:** {detected stack}  
**Verdict:** {verdict}

## ❌ P0 Blockers
| ID | Check | Evidence | Fix |
|----|-------|----------|-----|

## ⚠️ P1 Warnings
...

## 📝 P2 Notes
...

## ✅ Passed ({N})
## ⏭️ Skipped ({N} — stack N/A)
```

Fix mode `audit+autofix`: offer safe fixes for P1/P2 with diff preview. Never auto-apply P0 fixes.
