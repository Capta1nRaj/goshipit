---
# goshipit config - edit boxes, then say "goshipit" to run. Docs: https://github.com/Capta1nRaj/goshipit
fix_mode: audit-only     # audit-only | auto-fix (safe fixes applied with diff preview)
build: no                # yes | no - run production build, failure = P0
outdated: yes            # yes | no - outdated package check
design_md: no            # yes | no - generate DESIGN.md if missing
workspaces: all          # monorepo only: all | comma list e.g. apps/web,apps/api
max_agents: 5            # max parallel sub-agents (tools without sub-agents run sequentially)
---

# goshipit checks (210)

Tick `[x]` to run, `[ ]` to skip.
- Section box unticked -> whole section skipped.
- Section box ticked -> only its ticked checks run.
- Unsure what a check does? Full definitions: `references/checks-<letter>-*.md`.

## [x] A · Secrets & Environment (9)
- [x] A1 · Hardcoded secrets and API keys in source
- [x] A2 · .env files tracked in git
- [x] A3 · .env.example file exists
- [x] A4 · Staging/sandbox/localhost URLs in config files
- [x] A5 · README documents required env vars
- [x] A6 · Secrets leaked in git history (last year)
- [x] A7 · Separate staging and production env files exist
- [x] A8 · Localhost/ngrok URLs in webhook or callback config
- [x] A9 · Hardcoded test-mode payment keys

## [x] B · Code Quality (18)
- [x] B1 · Debug statements left in production code paths
- [x] B2 · TODO/FIXME/HACK in auth, payment and API code
- [x] B3 · Large blocks of commented-out code
- [x] B4 · Unused exported functions and components
- [x] B5 · Dependencies declared but never imported
- [x] B6 · Test data, fake users and seed imports in prod code
- [x] B7 · Overly complex functions (complexity > 15)
- [x] B8 · Duplicated copy-pasted code blocks
- [x] B9 · CHANGELOG exists and version bumped since last tag
- [x] B10 · Effects and listeners missing cleanup (memory leaks)
- [x] B11 · Async code without error handling
- [x] B12 · List endpoints without pagination
- [x] B13 · Env vars not validated at startup
- [x] B14 · Feature flags hardcoded true/false
- [x] B15 · Dependencies missing from lockfile
- [x] B16 · Unix-only package.json scripts (break on Windows)
- [x] B17 · TypeScript strict mode disabled
- [x] B18 · Env vars read at runtime without fallback or validation

## [x] C · Security (35)
- [x] C1 · SQL injection and XSS from unsanitized user input
- [x] C2 · Auth and sensitive endpoints missing rate limiting
- [x] C3 · Error stack traces returned to clients
- [x] C4 · Protected pages/endpoints missing auth checks
- [x] C5 · Dependencies with high/critical CVEs
- [x] C6 · Lockfile not committed
- [x] C7 · CORS wildcard in production API config
- [x] C8 · Webhooks missing signature verification
- [x] C9 · Cookies missing httpOnly, secure or sameSite
- [x] C10 · GPL/AGPL packages in a commercial codebase
- [x] C11 · Content-Security-Policy missing or too permissive
- [x] C12 · Clickjacking protection missing (X-Frame-Options)
- [x] C13 · X-Content-Type-Options nosniff header missing
- [x] C14 · Referrer-Policy missing or unsafe
- [x] C15 · Permissions-Policy not scoping camera/mic/location
- [x] C16 · HSTS header missing or too short
- [x] C17 · State-changing endpoints lack CSRF protection
- [x] C18 · No server-side input validation library
- [x] C19 · Open redirects from user-controlled input
- [x] C20 · Dependency confusion and untrusted registries
- [x] C21 · GraphQL introspection, depth limits and WS auth
- [x] C22 · Weak password hashing (md5/sha)
- [x] C23 · Outdated TLS versions allowed
- [x] C24 · CI pipeline missing security scanning
- [x] C25 · Sensitive PII fields stored unencrypted
- [x] C26 · Multi-tenant queries missing tenant isolation
- [x] C27 · IDOR - lookups by ID without ownership check
- [x] C28 · Mass assignment - request body written straight to DB
- [x] C29 · Sourcemaps exposed in production builds
- [x] C30 · Server secrets or server-only modules in client code
- [x] C31 · Most API routes lack rate limiting
- [x] C32 · SSRF - user-controlled URLs fetched server-side
- [x] C33 · Path traversal in file system calls
- [x] C34 · Dynamic code execution (eval, exec) with user input
- [x] C35 · File uploads without server-side type validation

## [x] D · Tests (4)
- [x] D1 · Test suite runs and passes
- [x] D2 · Tests cover auth, forms, payments and error states
- [x] D3 · Skipped tests in critical paths
- [x] D4 · No end-to-end test framework

## [x] E · Build & Performance (15)
- [x] E1 · Production build errors and deprecation warnings
- [x] E2 · TypeScript type errors and any-casts in critical code
- [x] E3 · Main JS bundle over 300kb gzipped
- [x] E4 · Images without dimensions or lazy loading
- [x] E5 · Fonts missing font-display swap or render-blocking
- [x] E6 · Blocking scripts in head without defer/async
- [x] E7 · Upload endpoints without max file size
- [x] E8 · N+1 database queries inside loops
- [x] E9 · Static assets missing long-term cache headers
- [x] E10 · HTML, robots.txt or sitemaps cached immutably
- [x] E11 · Response compression not enabled
- [x] E12 · Modern image formats (WebP/AVIF) not configured
- [x] E13 · Heavy synchronous work in event handlers
- [x] E14 · Layout shift from unreserved above-the-fold content
- [x] E15 · SSR hydration mismatch risks

## [x] F · Reliability (21)
- [x] F1 · Runtime version not pinned
- [x] F2 · No top-level error boundary
- [x] F3 · Error tracking (Sentry etc.) missing or misconfigured
- [x] F4 · No structured logger
- [x] F5 · Unapplied or edited database migrations
- [x] F6 · Dev-only tools in production dependencies
- [x] F7 · No graceful shutdown handling
- [x] F8 · No health check endpoint
- [x] F9 · Missing build, start or test scripts
- [x] F10 · Emails sent without a transactional email provider
- [x] F11 · Email from-address uses a free mail domain
- [x] F12 · No database connection pool config
- [x] F13 · No automated database backups
- [x] F14 · No uptime monitoring
- [x] F15 · Contact forms that silently drop submissions
- [x] F16 · Webhooks without idempotency (non-billing)
- [x] F17 · Foreign key columns without indexes
- [x] F18 · Sending domain can't use custom SPF/DKIM
- [x] F19 · No global uncaught error handlers
- [x] F20 · Multiple conflicting lockfiles
- [x] F21 · EventEmitter listener leaks

## [x] G · Codebase Hygiene (14)
- [x] G1 · Unresolved git merge conflict markers
- [x] G2 · Large files over 1MB in the repo
- [x] G3 · .gitignore missing required entries
- [x] G4 · README missing setup, run or deploy steps
- [x] G5 · Linter errors or no linter configured
- [x] G6 · API docs missing or out of sync with routes
- [x] G7 · Placeholder text (Lorem ipsum, Acme) in UI
- [x] G8 · No custom 404 page
- [x] G9 · No custom 500 error page
- [x] G10 · No print styles for printable pages
- [x] G11 · Dark mode not respecting OS preference
- [x] G12 · Untranslated strings and locale-less dates (i18n)
- [x] G13 · No responsive/mobile styles
- [x] G14 · Hardcoded secrets in CI config files

## [x] H · Accessibility (9)
- [x] H1 · Images missing alt text
- [x] H2 · Clickable divs/spans without role and tabIndex
- [x] H3 · Form inputs without labels
- [x] H4 · Low-contrast color combinations
- [x] H5 · Pages missing a title
- [x] H6 · aria-hidden on focusable elements
- [x] H7 · Focus outline removed without replacement
- [x] H8 · Modals without Escape key or focus trap
- [x] H9 · Touch targets smaller than 24x24px

## [x] I · Deploy Config (15)
- [x] I1a · Dockerfile not multi-stage
- [x] I1b · Docker container runs as root
- [x] I1c · Dockerfile layer order breaks dependency cache
- [x] I1d · Docker CMD runs raw source, not built output
- [x] I1e · Missing or incomplete .dockerignore
- [x] I2 · vercel.json hardcoded env, timeouts or dev routes
- [x] I3 · Render/Railway/Fly config issues
- [x] I4 · No deploy config file found
- [x] I5 · Debug env vars hardcoded in deploy config
- [x] I6 · Nginx hardening (tokens, gzip, SSL, rate limit)
- [x] I7 · Nginx proxy upstream and forwarded headers
- [x] I8 · PM2/Supervisor production settings
- [x] I9 · Production on a free platform subdomain
- [x] I10 · Kubernetes containers without resource limits
- [x] I11 · Kubernetes deployments without health probes

## [x] J · SEO & Meta (14)
- [x] J1 · Favicon missing
- [x] J2 · robots.txt blocks the whole site or is missing
- [x] J3 · No sitemap.xml
- [x] J4 · Meta description missing on key pages
- [x] J5 · Open Graph tags missing on shareable pages
- [x] J6 · noindex on production pages
- [x] J7 · html lang attribute missing
- [x] J8 · Canonical link missing on duplicate-URL pages
- [x] J9 · No JSON-LD structured data
- [x] J10 · Viewport meta tag missing
- [x] J11 · Analytics missing or not limited to production
- [x] J12 · Google Consent Mode v2 not set before tags
- [x] J13 · llms.txt missing
- [x] J14 · Google Search Console verification missing

## [x] K · PWA & Service Worker (5)
- [x] K1 · Web app manifest missing or incomplete
- [x] K2 · Service worker not registered
- [x] K3 · No offline fallback page
- [x] K4 · Service worker caches API or auth responses
- [x] K5 · Service worker not versioned on deploy

## [x] L · E-commerce Tracking (13)
- [x] L1 · GA4 view_item event missing on product pages
- [x] L2 · GA4 add_to_cart event missing or misfired
- [x] L3 · GA4 begin_checkout event missing
- [x] L4 · GA4 purchase event missing or bad transaction_id
- [x] L5 · GA4 e-commerce events missing items param
- [x] L6 · GA4 shipping and payment info events missing
- [x] L7 · Meta Pixel ViewContent missing on product pages
- [x] L8 · Meta Pixel AddToCart missing or misconfigured
- [x] L9 · Meta Pixel InitiateCheckout missing
- [x] L10 · Meta Pixel Purchase missing or incomplete
- [x] L11 · Meta Pixel AddPaymentInfo missing
- [x] L12 · Purchase event fires again on thank-you reload
- [x] L13 · No server-side tracking fallback (CAPI/MP)

## [x] M · Billing & Subscription (9)
- [x] M1 · Critical payment webhook events not handled
- [x] M2 · Payment webhook signature not verified
- [x] M3 · Payment webhooks without idempotency
- [x] M4 · No handling for failed payments
- [x] M5 · Paid features only gated on the client
- [x] M6 · Payment API calls without idempotency keys
- [x] M7 · Plan usage limits not enforced on backend
- [x] M8 · Test-mode payment keys in source code
- [x] M9 · Webhook does heavy work before acknowledging

## [x] N · Legal & Compliance (7)
- [x] N1 · Privacy policy page missing
- [x] N2 · Terms of service page missing
- [x] N3 · Tracking scripts without cookie consent
- [x] N4 · No refund/cancellation policy at checkout
- [x] N5 · Footer missing Privacy and Terms links
- [x] N6 · No user data export (GDPR Art. 20)
- [x] N7 · No real account/data deletion (GDPR Art. 17)

## [x] O · Agent Readiness (22)
- [x] O1 · robots.txt rules for AI crawlers
- [x] O2 · AI usage policy (Content-Signal or ai.txt)
- [x] O3 · llms.txt follows llmstxt.org format
- [x] O4 · llms.txt links point to LLM-friendly markdown
- [x] O5 · llms.txt size within token budget
- [x] O6 · sitemap.md markdown sitemap exists
- [x] O7 · Markdown mirrors for public pages
- [x] O8 · Pages link to their markdown version
- [x] O9 · HTTP Link headers for markdown and llms.txt
- [x] O10 · Markdown content negotiation via Accept header
- [x] O11 · Pages link to llms.txt via rel=describedby
- [x] O12 · Agent instruction file (AGENTS.md etc.) exists
- [x] O13 · Agent instruction file quality
- [x] O14 · Homepage Link headers for discovery manifests
- [x] O15 · API catalog in .well-known (RFC 9727)
- [x] O16 · MCP server card in .well-known
- [x] O17 · OAuth discovery metadata for agents
- [x] O18 · A2A agent card in .well-known
- [x] O19 · Agent skills discovery index
- [x] O20 · WebMCP, Web Bot Auth and ARD manifests
- [x] O21 · .well-known discovery hygiene and DNS-AID
- [x] O22 · Agent payment protocols (x402, UCP, ACP)

## [x] Custom checks
Write any free-form check as a ticked line.
- [ ] Example: payment webhook verifies signature
