# Category M — Billing & Subscription _(only if payment/billing SDK detected)_

## Gateway detection — do this first, dynamically

1. Grep manifest + source imports for payment SDK names
2. Identify all gateways (Stripe, Razorpay, PayPal, Paddle, LemonSqueezy, Chargebee, Braintree, Square, Adyen, Mollie, Cashfree, PayU, Paytm, PhonePe, Cashier, Billing, etc.)
3. For each detected gateway — resolve webhook event names + API conventions:
    - **MCP first** — scan for gateway MCP tool (e.g. `stripe` MCP). Use it if found.
    - **WebSearch/WebFetch if no MCP** — `"<gateway> webhook events list production required"` + `"<gateway> idempotency key API"`
    - **Never hardcode Stripe events for non-Stripe gateway** — Razorpay: `payment.captured`/`subscription.charged`; PayPal: `PAYMENT.CAPTURE.COMPLETED`; Paddle: `subscription_payment_failed`

| ID  | Check                                                                                                                                                                                                  | P   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- |
| M1  | Critical webhook events handled: payment success, subscription created/updated/cancelled, payment failed — using gateway-specific event names from detection above                                     | P0  |
| M2  | Webhook signature verified — Stripe `constructEvent`, Razorpay `validateWebhookSignature`, PayPal cert, Paddle `verifyWebhookSignature`. Flag raw payload without signature check                      | P0  |
| M3  | Idempotency: event ID stored in DB/Redis before processing (Stripe `event.id`, Razorpay `payload.payment.entity.id`, PayPal `resource.id`). Flag if absent — all gateways retry → duplicate fulfilment | P0  |
| M4  | Payment-failed handler: sends recovery email OR marks subscription `past_due`/`suspended` OR redirects to payment update. Flag if empty/missing                                                        | P1  |
| M5  | Paid features gated server-side (not only client-side UI hide)                                                                                                                                         | P0  |
| M6  | Payment SDK create calls missing idempotency key param (Stripe `idempotencyKey`, Razorpay `receipt`, PayPal `PayPal-Request-Id`) → network retry = duplicate charge                                    | P1  |
| M7  | Usage limits per plan enforced backend (not only UI) before resource creation                                                                                                                          | P1  |
| M8  | Hardcoded test-mode keys in source outside test dirs — gateway-specific prefixes from detection above (complements A9 which checks config files)                                                       | P0  |
| M9  | Webhook handler does heavy sync work (DB writes, email, external API) before responding — flag if no queue (`Bull`, `Celery`, `Sidekiq`, `pg-boss`) and no fast `200` ack                              | P1  |
