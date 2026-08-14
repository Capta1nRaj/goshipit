# Category A - Secrets & Environment

| ID  | Check                                                                                                                                                                                              | P   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| A1  | Grep src for `sk_live`, `AIza`, `AKIA`, `ghp_`, `Bearer `, `password =`, `secret =`, `api_key =` (exclude `node_modules`, `.git`, tests)                                                           | P0  |
| A2  | `git ls-files .env .env.local .env.production` - flag if tracked                                                                                                                                   | P0  |
| A3  | `.env.example` exists (check via `ls`/`git ls-files` only, never read contents)                                                                                                                    | P1  |
| A4  | Grep config files (not `.env*`) for `localhost`, `staging.`, `sandbox.`, `test.stripe.com` outside test files                                                                                      | P1  |
| A5  | README explains each required env var                                                                                                                                                              | P2  |
| A6  | `git log --all -p --since=1.year.ago` grep secret patterns - flag even if removed (key compromised). Limit 1yr to avoid hang                                                                       | P0  |
| A7  | `ls`/`git ls-files` confirms both `.env.staging` + `.env.production` exist. Never read contents - note manual drift review required                                                                | P1  |
| A8  | Grep config + src (not `.env*`) for `localhost`, `127.0.0.1`, `ngrok.io`, `ngrok-free.app` in webhook/callback URL context                                                                         | P0  |
| A9  | Grep src + config (not `.env*`) for hardcoded test-mode keys: Stripe `sk_test_`/`pk_test_`, Razorpay `rzp_test_`, PayPal sandbox IDs, Paddle sandbox vendor ID, generic `sandbox`/`test_` prefixes | P0  |
